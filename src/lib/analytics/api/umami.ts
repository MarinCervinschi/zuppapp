import { createServerFn } from "@tanstack/react-start";

/**
 * Where the Umami script lives and which website it counts, or null where analytics are off
 * (local dev, previews). Read at start like every other setting, since the image is built without
 * them. Umami sets no cookies, so it needs no consent.
 */
export const umamiFn = createServerFn({ method: "GET" }).handler(() => {
	const src = process.env.UMAMI_SCRIPT_URL;
	const websiteId = process.env.UMAMI_WEBSITE_ID;
	return src && websiteId ? { src, websiteId } : null;
});
