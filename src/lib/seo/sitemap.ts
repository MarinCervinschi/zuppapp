import { asc, eq, ne } from "drizzle-orm";

import { getDb } from "@/db";
import { productStats, products } from "@/db/schema";

/** The pages anyone can open, besides the soups. */
const PAGES = ["/", "/classifica", "/presentazione", "/dati", "/privacy"];

/** Every page a search engine should know: the public ones and each soup that is not a draft. */
export async function getSitemap(site: string) {
	const soups = await getDb()
		.select({
			ean: products.ean,
			updatedAt: products.updatedAt,
			votedAt: productStats.updatedAt,
		})
		.from(products)
		.leftJoin(productStats, eq(productStats.productId, products.id))
		.where(ne(products.status, "draft"))
		.orderBy(asc(products.ean));
	return sitemapXml([
		...PAGES.map(path => ({ loc: site + path })),
		...soups.map(soup => ({
			loc: `${site}/prodotti/${soup.ean}`,
			lastmod: lastChange(soup.updatedAt, soup.votedAt).toISOString().slice(0, 10),
		})),
	]);
}

/** A vote changes the page as much as the label does: the mean and the count are on it. */
export function lastChange(updatedAt: Date, votedAt: Date | null) {
	return votedAt && votedAt > updatedAt ? votedAt : updatedAt;
}

export function sitemapXml(urls: { loc: string; lastmod?: string }[]) {
	const entries = urls.map(
		({ loc, lastmod }) =>
			`<url><loc>${escapeXml(loc)}</loc>${lastmod ? `<lastmod>${lastmod}</lastmod>` : ""}</url>`
	);
	return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries.join("\n")}\n</urlset>\n`;
}

function escapeXml(text: string) {
	return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
