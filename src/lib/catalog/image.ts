// Product photos live on R2 under their key; the bucket's public URL comes from the environment.
export function productImageUrl(imageKey: string | null): string | null {
	const base = process.env.IMAGE_BASE_URL;
	if (!imageKey || !base) return null;
	return `${base.replace(/\/$/, "")}/${imageKey}`;
}
