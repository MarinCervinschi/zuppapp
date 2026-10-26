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
