import { getRequestHeader, getRequestIP } from "@tanstack/react-start/server";

import { AppError } from "./errors";
import { log } from "./log";

// In memory, because the app is a single long-running Node process on the VPS. A restart
// forgets the counters, which for a soup poll is an acceptable price.

export class TooManyRequests extends AppError {
	constructor() {
		super(
			"INVALID",
			"Stai votando un po’ troppo in fretta: riprova tra qualche minuto."
		);
	}
}

const buckets = new Map<string, number[]>();
// When each key was last logged over its limit: once per window, so a flood is one event.
const reported = new Map<string, number>();
let lastSweep = 0;

function sweep(now: number, windowMs: number) {
	if (now - lastSweep < windowMs) return;
	lastSweep = now;
	for (const [key, hits] of buckets) {
		if (hits.every(at => now - at >= windowMs)) buckets.delete(key);
	}
	for (const [key, at] of reported) {
		if (now - at >= windowMs) reported.delete(key);
	}
}

/**
 * Throws when `key` has used up `limit` hits in the last `windowMs`; otherwise counts one.
 * `key` is `<scope>:<who>`; only the scope reaches the logs.
 */
export function hit(key: string, limit: number, windowMs: number, now = Date.now()) {
	sweep(now, windowMs);
	const recent = (buckets.get(key) ?? []).filter(at => now - at < windowMs);
	if (recent.length >= limit) {
		buckets.set(key, recent);
		if (now - (reported.get(key) ?? -Infinity) >= windowMs) {
			reported.set(key, now);
			log.warn("Rate limit {Scope} reached: {Limit} in {WindowMinutes} min", {
				Scope: key.split(":")[0],
				Limit: limit,
				WindowMinutes: Math.round(windowMs / 60_000),
			});
		}
		throw new TooManyRequests();
	}
	recent.push(now);
	buckets.set(key, recent);
}

/** Cloudflare's header first, since production sits behind its proxy. */
export function clientIp(): string {
	return (
		getRequestHeader("cf-connecting-ip") ??
		getRequestIP({ xForwardedFor: true }) ??
		"unknown"
	);
}
