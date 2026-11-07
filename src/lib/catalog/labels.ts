import { ZUPPE, count } from "@/lib/plural";

// How a subtype reads as a filter: the plural people use at the supermarket.
const SUBTYPE_PLURALS: Record<string, string> = {
	vellutata: "Vellutate",
	minestrone: "Minestroni",
	legumi: "Legumi",
	cereali: "Cereali",
	brodo: "Brodi",
	passato: "Passati",
};

export function subtypeLabel(subtype: string) {
	return SUBTYPE_PLURALS[subtype] ?? subtype.charAt(0).toUpperCase() + subtype.slice(1);
}

/** "1 zuppa", "12.345 zuppe": every count of soups on screen goes through here. */
export function zuppe(n: number) {
	return count(n, ZUPPE);
}
