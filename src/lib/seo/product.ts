import type { ProductCard } from "@/lib/catalog/types";

// What a soup's page tells search engines and link previews. Pure, so it is tested alone.

/** The line under the title in search results and in a shared link's preview. */
export function productDescription(product: ProductCard) {
	const { votesCount, ranked, mean } = product.stats;
	const who = product.brand ? `${product.name} di ${product.brand}` : product.name;
	const votes = votesCount === 1 ? "1 voto" : `${votesCount} voti`;
	const verdict =
		ranked && mean !== null
			? `${formatStars(mean)} stelle su 5 con ${votes}`
			: votesCount > 0
				? `${votes}, ancora pochi per la classifica`
				: "ancora nessun voto";
	return `${who}: ${verdict}. Ingredienti, allergeni e valori nutrizionali.`;
}

/**
 * schema.org's Product, for Google. The rating goes in only once the soup is in the ranking, so
 * no result shows five stars resting on a single vote.
 */
export function productJsonLd(product: ProductCard, url: string, image: string | null) {
	const { votesCount, ranked, mean } = product.stats;
	return {
		"@context": "https://schema.org",
		"@type": "Product",
		name: product.name,
		url,
		...(image && { image }),
		...(product.brand && { brand: { "@type": "Brand", name: product.brand } }),
		...gtin(product.ean),
		...(ranked &&
			mean !== null && {
				aggregateRating: {
					"@type": "AggregateRating",
					ratingValue: mean,
					ratingCount: votesCount,
					bestRating: 5,
					worstRating: 1,
				},
			}),
	};
}

/** JSON for a script tag: a `<` in a name could otherwise close the tag. */
export function scriptJson(value: unknown) {
	return JSON.stringify(value).replace(/</g, "\\u003c");
}

function gtin(ean: string) {
	if (ean.length === 13) return { gtin13: ean };
	if (ean.length === 8) return { gtin8: ean };
	return { gtin: ean };
}

function formatStars(mean: number) {
	return mean.toLocaleString("it-IT", { maximumFractionDigits: 1 });
}
