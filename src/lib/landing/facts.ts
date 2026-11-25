import type { ProductCard, ProductListItem, RankingPage } from "@/lib/catalog/types";
import { VOTI, count } from "@/lib/plural";
import { MIN_VOTES_TO_RANK } from "@/lib/ranking/rules";

// What `/presentazione` needs from the catalogue, built from what the loader fetched: the size of
// the catalogue, the podium, the facts of a real label and the soup closest to the ranking.

export type PodiumEntry = {
	ean: string;
	name: string;
	brand: string | null;
	mean: number;
	votes: number;
};
export type LabelFacts = {
	ean: string;
	name: string;
	brand: string | null;
	ingredients: number;
	/** The first ingredient, the one there is most of, without its share: «acqua». */
	first: string | null;
	/** Whether the list has yeast extract, which nobody adds at home. */
	yeast: boolean;
	/** An ingredient no traditional recipe has: «olio di girasole», «amido», «aromi». */
	modern: string | null;
	veg: string | null;
	nutriscore: string | null;
};
export type ToTaste = {
	ean: string;
	name: string;
	brand: string | null;
	quantity: string | null;
	votes: number;
	imageUrl: string | null;
};

export type LandingData = {
	total: number;
	minVotes: number;
	podium: PodiumEntry[];
	label: LabelFacts | null;
	toTaste: ToTaste | null;
};

const VEGETABLE =
	/(zucca|carot|patat|pomodor|piselli|fagiol|lenticch|ceci|porr|cipoll|sedano|zucchin|spinac|verdur|cavol|broccol|scarola|radicchio)/i;

/**
 * Counts the ingredients in a label's list and picks the first vegetable with its share: the
 * facts the scanner's laser writes next to the promises. A comma inside brackets or inside a
 * number («2,3%») does not split, and the sentences after the list («Può contenere…») do not count.
 */
export function labelFacts(p: {
	ean: string;
	name: string;
	brand: string | null;
	ingredientsText: string | null;
	nutriscore: string | null;
}): LabelFacts {
	const text = (p.ingredientsText ?? "").split(/\.\s/)[0];
	const parts: string[] = [];
	let depth = 0;
	let current = "";
	for (let i = 0; i < text.length; i++) {
		const ch = text[i];
		if (ch === "(" || ch === "[") depth++;
		if (ch === ")" || ch === "]") depth = Math.max(0, depth - 1);
		const inNumber = /\d/.test(text[i - 1] ?? "") && /\d/.test(text[i + 1] ?? "");
		if (ch === "," && depth === 0 && !inNumber) {
			parts.push(current.trim());
			current = "";
		} else current += ch;
	}
	if (current.trim()) parts.push(current.trim());
	const ingredients = parts.filter(Boolean);
	const veg =
		ingredients.find(x => VEGETABLE.test(x) && /\d+([,.]\d+)?\s*%/.test(x)) ?? null;
	const lower = text.toLowerCase();
	const first = ingredients[0]
		? ingredients[0]
				.replace(/\([^)]*\)|\[[^\]]*\]/g, "")
				.replace(/\d+([,.]\d+)?\s*%/g, "")
				.replace(/\s+/g, " ")
				.trim()
				.toLowerCase() || null
		: null;
	const modern = /girasole/.test(lower)
		? "olio di girasole"
		: /\bamid/.test(lower)
			? "amido"
			: /\baromi\b/.test(lower)
				? "aromi"
				: null;
	return {
		ean: p.ean,
		name: p.name,
		brand: p.brand,
		ingredients: ingredients.length,
		first,
		yeast: /estratto di lievito/.test(lower),
		modern,
		// «verdure fresche 16% (carote, sedano…)» → «verdure fresche 16%»: it has to fit a line.
		veg: veg
			? veg
					.replace(/\([^)]*\)|\[[^\]]*\]/g, "")
					.replace(/\s+/g, " ")
					.trim()
					.toLowerCase()
			: null,
		nutriscore: p.nutriscore ? p.nutriscore.toUpperCase() : null,
	};
}

/** Everything the page shows, from the loader's queries. */
export function landingData(sources: {
	total: number;
	ranking: RankingPage;
	toTaste: ProductListItem[];
	card: ProductCard | null;
}): LandingData {
	const taste = sources.toTaste[0] ?? null;
	return {
		total: sources.total,
		minVotes: MIN_VOTES_TO_RANK,
		podium: sources.ranking.podium.map(p => ({
			ean: p.ean,
			name: p.name,
			brand: p.brand,
			mean: p.mean ?? 0,
			votes: p.votesCount,
		})),
		label: sources.card?.ingredientsText?.trim() ? labelFacts(sources.card) : null,
		toTaste: taste && {
			ean: taste.ean,
			name: taste.name,
			brand: taste.brand,
			quantity: taste.quantity,
			votes: taste.votesCount,
			imageUrl: taste.imageUrl,
		},
	};
}

/**
 * The line over the podium, for 0 to 3 soups on it: how the ranking really stands today, with its
 * real numbers, rather than suspense.
 */
export function podiumLine(
	podium: { votes: number }[],
	minVotes: number,
	catalogue: number
) {
	const n = podium.length;
	if (n === 0)
		return `Nessuna zuppa ha ancora ${count(minVotes, VOTI)}. Il podio è vuoto.`;
	if (n === 1) return "Sul podio c’è una zuppa sola.";
	if (n === 2) {
		const votes = podium.reduce((sum, p) => sum + p.votes, 0);
		return `Due zuppe sul podio, ${count(votes, VOTI)} in tutto.`;
	}
	return `Tre zuppe sul podio, su ${catalogue.toLocaleString("it-IT")}.`;
}
