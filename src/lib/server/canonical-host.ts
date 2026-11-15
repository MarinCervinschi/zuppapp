import { createMiddleware } from "@tanstack/react-start";

/** Where a request to `url` should go instead: the www name answers with the same path on `site`. */
export function canonicalRedirect(url: string, site: string): string | null {
	const from = new URL(url);
	const to = new URL(site);
	if (from.host !== `www.${to.host}`) return null;
	return new URL(from.pathname + from.search, to).href;
}

// The app's address is BETTER_AUTH_URL. Any other host, such as the health check on localhost, passes.
export const canonicalHostMiddleware = createMiddleware().server(
	({ request, next }) => {
		const site = process.env.BETTER_AUTH_URL;
		const target = site ? canonicalRedirect(request.url, site) : null;
		// Not Response.redirect: its headers are immutable, and later steps may still add to them.
		if (target)
			return new Response(null, { status: 301, headers: { Location: target } });
		return next();
	}
);
