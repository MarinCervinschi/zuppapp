import { describe, expect, it } from "vitest";

import { TooManyRequests, clientIpFrom, hit } from "./rate-limit";

it("allows up to the limit in the window, then refuses, then forgets", () => {
	const key = `test-${Math.random()}`;
	hit(key, 2, 1000, 0);
	hit(key, 2, 1000, 10);
	expect(() => hit(key, 2, 1000, 20)).toThrow(TooManyRequests);
	expect(() => hit(key, 2, 1000, 1001)).not.toThrow();
});

describe("clientIpFrom", () => {
	const PEER = "203.0.113.7";
	const TRAEFIK = "203.0.113.200";

	it("reads the address Traefik appended, not cf-connecting-ip or X-Real-Ip", () => {
		const headers = new Headers({
			"x-forwarded-for": PEER,
			"cf-connecting-ip": "198.51.100.1",
			"x-real-ip": "198.51.100.2",
		});
		expect(clientIpFrom(headers, TRAEFIK)).toBe(PEER);
	});

	it("skips the X-Forwarded-For entries in front of Traefik's", () => {
		const headers = new Headers({
			"x-forwarded-for": `198.51.100.1, 198.51.100.2,${PEER}`,
		});
		expect(clientIpFrom(headers, TRAEFIK)).toBe(PEER);
	});

	it("keeps one budget when the other headers change on every request", () => {
		const limit = 3;
		const request = (i: number) =>
			new Headers({
				"x-forwarded-for": `198.51.100.${i}, ${PEER}`,
				"cf-connecting-ip": `192.0.2.${i}`,
			});
		for (let i = 0; i < limit; i++)
			hit(`vote:${clientIpFrom(request(i), TRAEFIK)}`, limit, 1000, i);
		expect(() =>
			hit(`vote:${clientIpFrom(request(limit), TRAEFIK)}`, limit, 1000, limit)
		).toThrow(TooManyRequests);
	});

	it("falls back to the socket address, then to unknown", () => {
		const forged = new Headers({ "cf-connecting-ip": "198.51.100.1" });
		expect(clientIpFrom(forged, "::1")).toBe("::1");
		expect(clientIpFrom(new Headers(), undefined)).toBe("unknown");
	});
});
