import * as THREE from "three";

import { C } from "./palette";

// The landing follows the app's theme. By night it is the app's dark theme, «the same paper by
// lamplight» (globals.css): a warm brown-black paper, cream ink, the soup blobs at 80%, no yellow
// flash when the page opens. In 3D that means the ink outlines turn cream like the text (black on
// black would vanish), shadows go darker than the dark paper, the aurora is laid at 80%, and the
// steam reads on the paper too, as real steam does against a dark ground. The packs stay as they
// are: they are printed products, light by day and by night.

const v3 = (hex: string) => new THREE.Color(hex);

const DARK = {
	paper: "#171411",
	ink: "#f5efe6",
	shadow: "#0b0a08",
} as const;

/** Uniforms shared by every material that changes with the theme. */
export const themed = {
	/** The ink of every outline. */
	line: { value: new THREE.Vector3(...C.ink) },
	/** The stippled shadow under the bowl and the packs. */
	shadow: {
		value: new THREE.Vector3(...C.paper.map((p, i) => p * 0.81 + C.ink[i] * 0.19)),
	},
	/** The aurora: how much soup is in it, and the paper it fades into. */
	strength: { value: 1 },
	ground: { value: new THREE.Vector3(...C.paper) },
	/** The preloader's colour: corn by day, the paper by night. */
	iris: { value: new THREE.Vector3(...C.corn) },
	/** The steam on the paper: its colour, and its cover as veil and fold. */
	steamPaper: { value: new THREE.Vector3(...C.sheet) },
	steamPaperCover: { value: new THREE.Vector2(0.6, 0.9) },
};

export const theme = { dark: false };

/** Whether the page is dark: the app's own choice first, the system when there is none. */
export function readDark() {
	if (typeof document === "undefined") return false;
	const chosen = document.documentElement.getAttribute("data-theme");
	if (chosen === "dark") return true;
	if (chosen === "light") return false;
	return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function set(target: { value: THREE.Vector3 }, color: THREE.Color) {
	target.value.set(color.r, color.g, color.b);
}

export function applyTheme(dark: boolean) {
	theme.dark = dark;
	if (dark) {
		const ink = v3(DARK.ink);
		set(themed.line, ink);
		set(themed.shadow, v3(DARK.shadow));
		themed.strength.value = 0.8;
		set(themed.ground, v3(DARK.paper));
		set(themed.iris, v3(DARK.paper));
		set(themed.steamPaper, ink);
		themed.steamPaperCover.value.set(0.22, 0.45);
	} else {
		themed.line.value.set(...C.ink);
		themed.shadow.value.set(
			...(C.paper.map((p, i) => p * 0.81 + C.ink[i] * 0.19) as [number, number, number])
		);
		themed.strength.value = 1;
		themed.ground.value.set(...C.paper);
		themed.iris.value.set(...C.corn);
		themed.steamPaper.value.set(...C.sheet);
		themed.steamPaperCover.value.set(0.6, 0.9);
	}
}

/** Follows the theme: the app's switch (`data-theme` on <html>) and the system's setting. */
export function watchTheme(onChange: (dark: boolean) => void) {
	const update = () => {
		applyTheme(readDark());
		onChange(theme.dark);
	};
	update();
	const observer = new MutationObserver(update);
	observer.observe(document.documentElement, { attributeFilter: ["data-theme"] });
	const scheme = window.matchMedia("(prefers-color-scheme: dark)");
	scheme.addEventListener("change", update);
	return () => {
		observer.disconnect();
		scheme.removeEventListener("change", update);
	};
}
