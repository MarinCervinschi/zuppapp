// EAN-13 as bars, so every product label carries its own real, scannable barcode.

const L = [
	"0001101",
	"0011001",
	"0010011",
	"0111101",
	"0100011",
	"0110001",
	"0101111",
	"0111011",
	"0110111",
	"0001011",
];
const G = [
	"0100111",
	"0110011",
	"0011011",
	"0100001",
	"0011101",
	"0111001",
	"0000101",
	"0010001",
	"0001001",
	"0010111",
];
const R = [
	"1110010",
	"1100110",
	"1101100",
	"1000010",
	"1011100",
	"1001110",
	"1010000",
	"1000100",
	"1001000",
	"1110100",
];
// Which of L or G encodes each left-hand digit, chosen by the first digit.
const PARITY = [
	"LLLLLL",
	"LLGLGG",
	"LLGGLG",
	"LLGGGL",
	"LGLLGG",
	"LGGLLG",
	"LGGGLL",
	"LGLGLG",
	"LGLGGL",
	"LGGLGL",
];

export function ean13CheckDigit(first12: string): number {
	const sum = [...first12].reduce(
		(total, digit, index) => total + Number(digit) * (index % 2 === 0 ? 1 : 3),
		0
	);
	return (10 - (sum % 10)) % 10;
}

/**
 * Whether an EAN-8, UPC-A, EAN-13 or GTIN-14 ends with the right check digit: a camera that
 * misreads one bar gets caught here. Weights are 3 and 1 from the right, whatever the length.
 */
export function isValidGtin(code: string): boolean {
	if (!/^(\d{8}|\d{12,14})$/.test(code)) return false;
	const digits = [...code].map(Number);
	const check = digits.pop()!;
	const sum = digits
		.reverse()
		.reduce((total, digit, index) => total + digit * (index % 2 === 0 ? 3 : 1), 0);
	return (10 - (sum % 10)) % 10 === check;
}

/** The 95 modules of an EAN-13, as "1" for a bar and "0" for a space; null for anything else. */
export function ean13Modules(ean: string): string | null {
	if (!/^\d{13}$/.test(ean)) return null;
	const digits = [...ean].map(Number);
	const parity = PARITY[digits[0]];
	let modules = "101";
	for (let i = 1; i <= 6; i++) {
		modules += (parity[i - 1] === "L" ? L : G)[digits[i]];
	}
	modules += "01010";
	for (let i = 7; i <= 12; i++) modules += R[digits[i]];
	return modules + "101";
}

/** Runs of bars as [start, width] in modules, ready for SVG rects. */
export function barRuns(modules: string): [number, number][] {
	const runs: [number, number][] = [];
	for (let i = 0; i < modules.length; i++) {
		if (modules[i] !== "1") continue;
		const start = i;
		while (modules[i + 1] === "1") i++;
		runs.push([start, i - start + 1]);
	}
	return runs;
}
