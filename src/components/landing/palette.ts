// The app's tokens (globals.css), as plain sRGB triplets. The shaders write them out as they are,
// with no colour management and no tone mapping, so the canvas matches the CSS to the digit.

function rgb(hex: string): [number, number, number] {
	const h = hex.replace("#", "");
	return [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16) / 255) as [
		number,
		number,
		number,
	];
}

export const HEX = {
	paper: "#ede3d4",
	sheet: "#f8f2ea",
	ink: "#16120f",
	inkSoft: "#6a5f53",
	tomato: "#ff3d14",
	pumpkin: "#ff6a13",
	corn: "#ffc93c",
	pea: "#8fd16a",
	beet: "#e04aa0",
	star: "#ffd66b",
} as const;

export const C = Object.fromEntries(
	Object.entries(HEX).map(([k, v]) => [k, rgb(v)])
) as Record<keyof typeof HEX, [number, number, number]>;

/** A shade for the spoon's cream glaze: not a token, the cream sheet seen in its own shadow. */
export const SPOON_SHADE = rgb("#c9b89f");
/** The lit side of the black glaze: ink with a breath of warm light on it. */
export const GLAZE_LIT = rgb("#4a3c31");
