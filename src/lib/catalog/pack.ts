// How much is in the pack, read from the free text Open Food Facts keeps («620 g», «1 kg»,
// «500 ml», «620gr», «620»). Millilitres count as grams: a soup weighs about as much as water.

const UNITS: Record<string, number> = { g: 1, gr: 1, kg: 1000, ml: 1, cl: 10, l: 1000 };

/** The pack's weight in grams, or null when the text says nothing usable (a multipack, «1pcs»). */
export function packGrams(quantity: string | null): number | null {
	if (!quantity) return null;
	const match = quantity
		.trim()
		.toLowerCase()
		.match(/^(\d+(?:[.,]\d+)?)\s*(kg|gr|g|ml|cl|l)?$/);
	if (!match) return null;
	const grams = parseFloat(match[1].replace(",", ".")) * UNITS[match[2] ?? "g"];
	// Below a sachet or above a family tub, the number is more likely a typo than a pack.
	return grams >= 20 && grams <= 1500 ? grams : null;
}
