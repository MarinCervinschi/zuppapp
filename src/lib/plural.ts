// Counts in words, through the locale's own plural rules and number format: "1 voto",
// "12.345 voti". One place, so no component builds a plural by hand.

const rules = new Intl.PluralRules("it-IT");
const number = new Intl.NumberFormat("it-IT");

export type Forms = { one: string; other: string };

export function count(n: number, forms: Forms): string {
	const form = rules.select(n) === "one" ? forms.one : forms.other;
	return `${number.format(n)} ${form}`;
}

export const VOTI: Forms = { one: "voto", other: "voti" };
export const ZUPPE: Forms = { one: "zuppa", other: "zuppe" };
export const MARCHE: Forms = { one: "marca", other: "marche" };
export const PRODOTTI: Forms = { one: "prodotto", other: "prodotti" };
export const SELEZIONATI: Forms = { one: "selezionato", other: "selezionati" };
