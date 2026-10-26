import type { Score } from "@/lib/ranking/rules";

export type Nutrition = {
	energyKcal: number | null;
	fat: number | null;
	saturatedFat: number | null;
	carbohydrates: number | null;
	sugars: number | null;
	proteins: number | null;
	salt: number | null;
};

export type TagOption = {
	id: string;
	slug: string;
	label: string;
	sentiment: "positive" | "negative" | "neutral";
};

export type TagShare = TagOption & { count: number; percent: number };

export type ProductStatsView = {
	votesCount: number;
	votesRegistered: number;
	ranked: boolean;
	/** Position in the overall ranking, when the product is in it. */
	rank: number | null;
	/** The face of the plain mean, for the card; the ranking orders by the Bayesian score. */
	meanFace: Score | null;
	rebuyPercent: number;
	/** Votes per face, for the receipt. */
	scoreCounts: Record<Score, number>;
	tags: TagShare[];
};

export type ProductCard = {
	id: string;
	ean: string;
	name: string;
	brand: string | null;
	quantity: string | null;
	subtype: string | null;
	categoryName: string;
	imageUrl: string | null;
	producerUrl: string | null;
	retailers: { retailer: string; url: string }[];
	ingredientsText: string | null;
	allergens: string[];
	nutrition: Nutrition | null;
	nutriscore: string | null;
	nova: number | null;
	recipeChangedAt: string | null;
	archived: boolean;
	stats: ProductStatsView;
	tagOptions: TagOption[];
	myVote: { score: Score; tagIds: string[] } | null;
};

export type ProductListItem = {
	id: string;
	ean: string;
	name: string;
	brand: string | null;
	subtype: string | null;
	quantity: string | null;
	imageUrl: string | null;
	votesCount: number;
	rebuyPercent: number;
	/** Votes per face, for the spread bar of the ranking. */
	scoreCounts: Record<Score, number>;
	/** Position in the current ranking view; null outside it. */
	rank: number | null;
	/** The reader's own face, so a tile can show it already voted. */
	myScore: Score | null;
};

export type FacetValue = { value: string; count: number };

export type Facets = {
	subtypes: FacetValue[];
	brands: FacetValue[];
	nutriscores: FacetValue[];
	total: number;
};

export type RankingPage = {
	/** Places 1 to 3, on the first page only; empty on the others. */
	podium: ProductListItem[];
	/** The rest of this page's places, as rows. */
	rows: ProductListItem[];
	total: number;
	page: number;
	pageSize: number;
	pageCount: number;
};

export type ListPage = {
	items: ProductListItem[];
	total: number;
	page: number;
	pageSize: number;
	pageCount: number;
};
