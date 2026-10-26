import { getRequestHeader, getRequestIP } from "@tanstack/react-start/server";

import { AppError } from "./errors";

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
let lastSweep = 0;

function sweep(now: number, windowMs: number) {
	if (now - lastSweep < windowMs) return;
	lastSweep = now;
	for (const [key, hits] of buckets) {
		if (hits.every(at => now - at >= windowMs)) buckets.delete(key);
	}
}

/** Throws when `key` has used up `limit` hits in the last `windowMs`; otherwise counts one. */
export function hit(key: string, limit: number, windowMs: number, now = Date.now()) {
	sweep(now, windowMs);
	const recent = (buckets.get(key) ?? []).filter(at => now - at < windowMs);
	if (recent.length >= limit) {
		buckets.set(key, recent);
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
