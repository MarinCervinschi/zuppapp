// Open Food Facts sometimes stores text with its HTML entities still in it («&quot;O&quot;»).

const NAMED: Record<string, string> = {
	amp: "&",
	quot: '"',
	apos: "’",
	lt: "<",
	gt: ">",
	nbsp: " ",
};

/** «farina di grano tipo &quot;0&quot;» becomes «farina di grano tipo "0"». Unknown entities stay. */
export function decodeEntities(text: string): string {
	return text.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (entity, code: string) => {
		if (code[0] === "#") {
			const value =
				code[1] === "x" || code[1] === "X"
					? parseInt(code.slice(2), 16)
					: parseInt(code.slice(1), 10);
			return Number.isFinite(value) ? String.fromCodePoint(value) : entity;
		}
		return NAMED[code.toLowerCase()] ?? entity;
	});
}
