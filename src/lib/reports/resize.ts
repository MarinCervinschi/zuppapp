// Browser only. Each chosen photo is redrawn on a canvas before it leaves the phone: smaller
// (a phone photo is 4–12 MB), always JPEG, and without EXIF, so no GPS position goes with it.

export async function toJpeg(
	file: Blob,
	maxSide: number,
	quality = 0.85
): Promise<Blob> {
	const bitmap = await createImageBitmap(file);
	const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
	const canvas = document.createElement("canvas");
	canvas.width = Math.round(bitmap.width * scale);
	canvas.height = Math.round(bitmap.height * scale);
	canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
	bitmap.close();
	return new Promise((resolve, reject) =>
		canvas.toBlob(
			blob => (blob ? resolve(blob) : reject(new Error("Photo not encoded"))),
			"image/jpeg",
			quality
		)
	);
}
