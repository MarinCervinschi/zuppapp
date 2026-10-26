import { expect, it } from "vitest";

import { pageWindow } from "./pagination";

it("shows the ends and the neighbours, with gaps", () => {
	expect(pageWindow(1, 1)).toEqual([1]);
	expect(pageWindow(1, 5)).toEqual([1, 2, "gap", 5]);
	expect(pageWindow(5, 38)).toEqual([1, "gap", 4, 5, 6, "gap", 38]);
	expect(pageWindow(3, 5)).toEqual([1, 2, 3, 4, 5]);
});
