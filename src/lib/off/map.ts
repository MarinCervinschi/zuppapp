import { decodeEntities } from "@/lib/entities";

// Open Food Facts product → our row, kept free of I/O so the rules can be tested alone.

export type OffProduct = {
	code?: string;
	product_name?: string;
	product_name_it?: string;
	brands?: string | string[];
	quantity?: string;
	categories_tags?: string[];
	image_front_url?: string;
	ingredients_text_it?: string;
	ingredients_text?: string;
	allergens_tags?: string[];
	nutriments?: Record<string, unknown>;
	nutriscore_grade?: string;
	nova_group?: number;
	last_modified_t?: number;
};

export type MappedProduct = {
	ean: string;
	name: string;
	brand: string | null;
	quantity: string | null;
	subtype: string | null;
	attributes: Record<string, string>;
	ingredientsText: string | null;
	offLastModifiedAt: Date;
	snapshot: {
		ingredientsText: string | null;
		allergens: string[];
		nutriments: Record<string, number>;
		nutriscore: string | null;
		nova: number | null;
		imageUrl: string | null;
	};
};

export type MapResult =
	{ ok: true; product: MappedProduct } | { ok: false; reason: string };

/**
 * GS1 "restricted circulation" numbers: shops print them on weighed goods and their own
 * labels, and every chain reuses them, so on Open Food Facts the same code names different
 * products. They identify nothing across shops: never import or sync one.
 */
export function isStoreInternalCode(ean: string): boolean {
	if (ean.length === 13) return /^(2|02|04)/.test(ean);
	if (ean.length === 8) return /^[02]/.test(ean);
	return false;
}

/** A product nobody has touched on Open Food Facts for this long is probably off the shelf. */
export const MAX_AGE_YEARS = 5;

const NUTRIMENT_KEYS = [
	"energy-kcal_100g",
	"fat_100g",
	"saturated-fat_100g",
	"carbohydrates_100g",
	"sugars_100g",
	"proteins_100g",
	"salt_100g",
];

// First match wins, so the specific words come before the generic ones.
const SUBTYPE_WORDS: [string, RegExp][] = [
	["passato", /\bpassat[oa]\b/],
	["vellutata", /\bvellutat[ae]\b|\bcrem[ae]\b/],
	["minestrone", /\bminestron[ei]\b|\bminestr[ae]\b/],
	["brodo", /\bbrod[oi]\b/],
	["legumi", /\blegumi\b|\bfagiol|\bceci\b|\blenticchie\b|\bcicerchie\b/],
	["cereali", /\bcereali\b|\bfarro\b|\borzo\b/],
];

export function subtypeOf(name: string): string | null {
	const text = name.toLowerCase();
	return SUBTYPE_WORDS.find(([, pattern]) => pattern.test(text))?.[0] ?? null;
}

function clean(value: string | undefined): string | null {
	const trimmed = value && decodeEntities(value).replace(/\s+/g, " ").trim();
	return trimmed ? trimmed : null;
}

/** "MINESTRONE DI VERDURE" and "mix di cereali" become "Minestrone di verdure", "Mix di cereali". */
export function tidyName(name: string): string {
	const sentence = /\p{Ll}/u.test(name) ? name : name.toLowerCase();
	return sentence.charAt(0).toUpperCase() + sentence.slice(1);
}

/**
 * "CONAD" and "Conad" are one brand on the shelf: shouted names longer than an acronym are
 * set in title case, and a lowercase first letter is raised. "MD" and "Pam & Panorama" stay.
 */
export function tidyBrand(brand: string): string {
	const shouted = !/\p{Ll}/u.test(brand) && brand.replace(/[^\p{L}]/gu, "").length > 3;
	const cased = shouted
		? brand
				.toLowerCase()
				.replace(/(^|[\s&.-])(\p{L})/gu, (_, sep, letter) => sep + letter.toUpperCase())
		: brand;
	return cased.charAt(0).toUpperCase() + cased.slice(1);
}

function firstBrand(brands: string | string[] | undefined): string | null {
	const list = Array.isArray(brands) ? brands : (brands ?? "").split(",");
	const brand = clean(list[0]);
	return brand ? tidyBrand(brand) : null;
}

// The 14 allergens of EU Regulation 1169/2011, as the pack names them in Italian.
const ALLERGENS_IT: Record<string, string> = {
	"en:gluten": "glutine",
	"en:crustaceans": "crostacei",
	"en:eggs": "uova",
	"en:fish": "pesce",
	"en:peanuts": "arachidi",
	"en:soybeans": "soia",
	"en:milk": "latte",
	"en:nuts": "frutta a guscio",
	"en:celery": "sedano",
	"en:mustard": "senape",
	"en:sesame-seeds": "sesamo",
	"en:sulphur-dioxide-and-sulphites": "anidride solforosa e solfiti",
	"en:lupin": "lupini",
	"en:molluscs": "molluschi",
};

function allergenName(tag: string) {
	return ALLERGENS_IT[tag] ?? tag.replace(/^[a-z]{2}:/, "").replace(/-/g, " ");
}

export function mapOffProduct(off: OffProduct, now = new Date()): MapResult {
	const ean = off.code?.trim() ?? "";
	if (!/^\d{8,14}$/.test(ean)) return { ok: false, reason: "EAN non valido" };
	if (isStoreInternalCode(ean))
		return { ok: false, reason: "codice interno del negozio" };

	const rawName = clean(off.product_name_it) ?? clean(off.product_name);
	if (!rawName) return { ok: false, reason: "senza nome" };
	const name = tidyName(rawName);
	if (!off.image_front_url) return { ok: false, reason: "senza foto" };

	if (!off.last_modified_t) return { ok: false, reason: "senza data di modifica" };
	const lastModified = new Date(off.last_modified_t * 1000);
	const cutoff = new Date(now);
	cutoff.setFullYear(cutoff.getFullYear() - MAX_AGE_YEARS);
	if (lastModified < cutoff) return { ok: false, reason: "fermo da oltre 5 anni" };

	const nutriments: Record<string, number> = {};
	for (const key of NUTRIMENT_KEYS) {
		const value = off.nutriments?.[key];
		if (typeof value === "number" && Number.isFinite(value)) nutriments[key] = value;
	}

	const attributes: Record<string, string> = {};
	if (off.categories_tags?.includes("en:frozen-foods")) attributes.format = "surgelato";

	const ingredientsText = clean(off.ingredients_text_it) ?? clean(off.ingredients_text);

	return {
		ok: true,
		product: {
			ean,
			name,
			brand: firstBrand(off.brands),
			quantity: clean(off.quantity),
			subtype: subtypeOf(name),
			attributes,
			ingredientsText,
			offLastModifiedAt: lastModified,
			snapshot: {
				ingredientsText,
				allergens: (off.allergens_tags ?? []).map(allergenName),
				nutriments,
				nutriscore: /^[a-e]$/.test(off.nutriscore_grade ?? "")
					? off.nutriscore_grade!
					: null,
				nova: typeof off.nova_group === "number" ? off.nova_group : null,
				imageUrl: off.image_front_url,
			},
		},
	};
}

/** Whether two ingredient lists say the same thing, ignoring case, spacing and punctuation. */
export function sameRecipe(a: string | null, b: string | null) {
	const normal = (text: string | null) =>
		(text ?? "")
			.toLowerCase()
			.replace(/[^\p{L}\p{N}%]+/gu, " ")
			.trim();
	return normal(a) === normal(b);
}
