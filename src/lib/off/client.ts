import type { OffProduct } from "./map";

// Open Food Facts asks every app to name itself and leave a way to reach it.
const USER_AGENT = "Zuppapp/0.1 (https://github.com/MarinCervinschi/zuppapp)";

// The product API allows 100 reads a minute; 700 ms between them stays under it.
const PRODUCT_INTERVAL_MS = 700;
const RETRIES = 4;

export const PRODUCT_FIELDS = [
	"code",
	"product_name",
	"product_name_it",
	"brands",
	"quantity",
	"categories_tags",
	"image_front_url",
	"ingredients_text_it",
	"ingredients_text",
	"allergens_tags",
	"nutriments",
	"nutriscore_grade",
	"nova_group",
	"last_modified_t",
].join(",");

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

type ReadOptions = {
	/** Give up on one request after this long; none by default, as a script can wait. */
	timeoutMs?: number;
	retries?: number;
};

async function getJson<T>(url: string, options: ReadOptions = {}): Promise<T | null> {
	const retries = options.retries ?? RETRIES;
	for (let attempt = 0; ; attempt++) {
		const response = await fetch(url, {
			headers: { "User-Agent": USER_AGENT },
			signal: options.timeoutMs ? AbortSignal.timeout(options.timeoutMs) : undefined,
		});
		if (response.status === 404) return null;
		if (response.ok) return (await response.json()) as T;
		// 429 and 503 are Open Food Facts asking us to slow down: back off and try again.
		if (attempt < retries && (response.status === 429 || response.status >= 500)) {
			await sleep(2000 * 2 ** attempt);
			continue;
		}
		throw new Error(`Open Food Facts ${response.status} for ${url}`);
	}
}

/**
 * Codes of the soups sold in Italy. Discovery only, through Search-a-licious: the classic
 * search answers 503 under load, and Search-a-licious' copies of the products lag behind,
 * so the details come from the product API.
 */
export async function* discoverSoupCodes(pageSize = 100): AsyncGenerator<string> {
	const query = encodeURIComponent(
		'categories_tags:"en:soups" AND countries_tags:"en:italy"'
	);
	for (let page = 1; ; page++) {
		const result = await getJson<{ hits: { code: string }[]; page_count: number }>(
			`https://search.openfoodfacts.org/search?q=${query}&page_size=${pageSize}&page=${page}&fields=code`
		);
		if (!result) return;
		for (const hit of result.hits) yield hit.code;
		if (page >= result.page_count || result.hits.length === 0) return;
	}
}

let lastProductRead = 0;

/**
 * One product by code, through the product API. A scan in the app passes a short timeout and
 * no retries: the person holding the phone should not wait for Open Food Facts to recover.
 */
export async function fetchProduct(
	ean: string,
	options: ReadOptions = {}
): Promise<OffProduct | null> {
	const wait = lastProductRead + PRODUCT_INTERVAL_MS - Date.now();
	if (wait > 0) await sleep(wait);
	lastProductRead = Date.now();

	const result = await getJson<{ status: number; product?: OffProduct }>(
		`https://world.openfoodfacts.org/api/v2/product/${ean}?fields=${PRODUCT_FIELDS}`,
		options
	);
	return result?.status === 1 && result.product ? result.product : null;
}
