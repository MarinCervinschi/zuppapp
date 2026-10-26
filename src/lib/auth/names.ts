// "Minestrone Anonimo #4821": what an anonymous voter is called until they pick a nickname.

const SOUPS = [
	"Minestrone",
	"Vellutata",
	"Passato",
	"Brodino",
	"Zuppetta",
	"Ribollita",
	"Pasta e Fagioli",
	"Crema di Zucca",
];

export function anonymousName(random: () => number = Math.random) {
	const soup = SOUPS[Math.floor(random() * SOUPS.length)];
	const number = 1000 + Math.floor(random() * 9000);
	return `${soup} Anonimo #${number}`;
}

/** The same soup name for the same id, every time: a seeded generator over the id's characters. */
export function soupNameFor(id: string) {
	let seed = 0;
	for (const char of id) seed = (seed * 31 + char.charCodeAt(0)) >>> 0;
	return anonymousName(() => {
		seed = (seed * 1664525 + 1013904223) >>> 0;
		return seed / 2 ** 32;
	});
}
