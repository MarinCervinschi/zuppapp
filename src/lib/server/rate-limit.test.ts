import { expect, it } from "vitest";

import { TooManyRequests, hit } from "./rate-limit";

it("allows up to the limit in the window, then refuses, then forgets", () => {
	const key = `test-${Math.random()}`;
	hit(key, 2, 1000, 0);
	hit(key, 2, 1000, 10);
	expect(() => hit(key, 2, 1000, 20)).toThrow(TooManyRequests);
	expect(() => hit(key, 2, 1000, 1001)).not.toThrow();
});
