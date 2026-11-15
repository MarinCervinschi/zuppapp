import { createServerFn } from "@tanstack/react-start";

/**
 * The app's own address, the origin of BETTER_AUTH_URL: canonical links, Open Graph and the sitemap
 * need it absolute. Read at start like every other setting, since the image is built without them.
 */
export const siteUrlFn = createServerFn({ method: "GET" }).handler(() => siteUrl());

export function siteUrl() {
	const url = process.env.BETTER_AUTH_URL;
	return url ? new URL(url).origin : null;
}
