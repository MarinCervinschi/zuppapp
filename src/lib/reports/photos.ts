// The browser re-encodes every photo before sending it (`toJpeg`), which already drops EXIF.
// The server cannot trust that, so it strips the metadata segments again: GPS position, camera
// serial, comments. Pure, so it can be tested without a bucket.

// APP0 (JFIF), APP2 (colour profile) and APP14 (Adobe colour transform) change how the photo
// looks; every other APPn segment and the comments are metadata.
const KEEP = new Set([0xe0, 0xe2, 0xee]);
const SOS = 0xda;
const COM = 0xfe;

/** The JPEG without its metadata segments; null for anything that is not a JPEG. */
export function stripJpegMetadata(bytes: Uint8Array): Uint8Array | null {
	if (bytes.length < 4 || bytes[0] !== 0xff || bytes[1] !== 0xd8) return null;

	const kept: Uint8Array[] = [bytes.subarray(0, 2)];
	let at = 2;
	while (at + 4 <= bytes.length) {
		if (bytes[at] !== 0xff) return null;
		const marker = bytes[at + 1];
		// After the start of scan comes the image data, up to the end: copied as it is.
		if (marker === SOS) {
			kept.push(bytes.subarray(at));
			break;
		}
		const length = (bytes[at + 2] << 8) | bytes[at + 3];
		const end = at + 2 + length;
		if (length < 2 || end > bytes.length) return null;
		const isApp = marker >= 0xe0 && marker <= 0xef;
		if (!(isApp && !KEEP.has(marker)) && marker !== COM)
			kept.push(bytes.subarray(at, end));
		at = end;
	}

	const out = new Uint8Array(kept.reduce((total, part) => total + part.length, 0));
	let offset = 0;
	for (const part of kept) {
		out.set(part, offset);
		offset += part.length;
	}
	return out;
}
