// Product photos live in our bucket under their key; its public URL comes from the environment.
export function productImageUrl(imageKey: string | null): string | null {
	const base = process.env.S3_PUBLIC_URL;
	if (!imageKey || !base) return null;
	return `${base.replace(/\/$/, "")}/${imageKey}`;
}

/**
 * Open Food Facts serves each photo at 100, 200 and 400 px and at full size: lists ask for the
 * size they draw, the enlarged view for the full one. Any other URL comes back as it is.
 */
export function sizedImage(
	url: string | null,
	size: 100 | 200 | 400 | "full"
): string | null {
	if (!url) return null;
	return url.replace(/\.(100|200|400|full)\.jpg$/, `.${size}.jpg`);
}
