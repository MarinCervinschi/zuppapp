import { expect, it } from "vitest";

import { stripJpegMetadata } from "./photos";

const segment = (marker: number, payload: number[]) => [
	0xff,
	marker,
	(payload.length + 2) >> 8,
	(payload.length + 2) & 0xff,
	...payload,
];

const jpeg = (...segments: number[][]) =>
	new Uint8Array([
		0xff,
		0xd8,
		...segments.flat(),
		0xff,
		0xda,
		0,
		2,
		1,
		2,
		3,
		0xff,
		0xd9,
	]);

it("drops EXIF and comments, keeps JFIF, the colour profile and the image", () => {
	const jfif = segment(0xe0, [0x4a, 0x46]);
	const exif = segment(0xe1, [0x45, 0x78, 0x69, 0x66]);
	const icc = segment(0xe2, [1]);
	const comment = segment(0xfe, [0x68, 0x69]);
	const table = segment(0xdb, [9, 9]);

	expect(stripJpegMetadata(jpeg(jfif, exif, icc, comment, table))).toEqual(
		jpeg(jfif, icc, table)
	);
});

it("refuses what is not a JPEG", () => {
	expect(stripJpegMetadata(new Uint8Array([0x89, 0x50, 0x4e, 0x47]))).toBeNull();
	// A segment that claims more bytes than there are.
	expect(
		stripJpegMetadata(new Uint8Array([0xff, 0xd8, 0xff, 0xe1, 0x10, 0x00, 1]))
	).toBeNull();
});
