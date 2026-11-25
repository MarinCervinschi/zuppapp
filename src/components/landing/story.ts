// The script of the landing, «Presentazione ufficiale»: its scenes, each with its length in vh of
// scroll. Everything else reads one number, G: the scene index
// plus the progress inside it (1.0 is the start of scene 1, 3.5 is halfway through scene 3).

export type Scene = { id: number; name: string; vh: number };

export const SCENES: Scene[] = [
	{ id: 1, name: "Mescola per scorrere", vh: 180 },
	{ id: 2, name: "La giostra", vh: 160 },
	{ id: 3, name: "La verità sull'etichetta", vh: 200 },
	{ id: 4, name: "Il voto", vh: 200 },
	{ id: 5, name: "Respiro e versamento", vh: 180 },
	{ id: 6, name: "Il podio vero", vh: 180 },
	{ id: 7, name: "Le manca un voto", vh: 120 },
	{ id: 8, name: "Titoli di coda", vh: 60 },
];

export const TOTAL_VH = SCENES.reduce((s, x) => s + x.vh, 0);

/** Under prefers-reduced-motion: scroll still drives the story, but nothing moves on its own. */
export const reduced =
	typeof window !== "undefined" &&
	window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export const director = {
	/** Scene index + progress: 1 ≤ G < 9. */
	G: 1,
	/** 0..1 while the swirl draws itself in the preloader. */
	swirl: 0,
	/** 0..1 as the iris opens and the bowl steps aside. */
	settle: 0,
	/** The preloader's hole in CSS px, once the canvas draws the yellow itself (aurora.tsx). */
	iris: 0,
	/** 0..1 as the yellow of the preloader climbs back and becomes the curtain of the aurora. */
	morph: 0,
	/** How fast the page scrolls, 0..1: quick to rise, slow to settle. Changes sizes, never G. */
	speed: 0,
	/** The same, eased over about half a second: for the aurora's hem, which must never snap. */
	speedSoft: 0,
	/** -1 up, 1 down. */
	dir: 1,
	/** The mouse or finger: NDC position, whether it is over the page, a tap waiting to land. */
	pointer: { x: 0, y: 0, on: false, tap: false },
	/** Runs the canvas from the page's own loop (set by the world), so 3D and words never slip. */
	advance: null as null | ((timestamp: number) => void),
};

/** G from the scroll position, in px. */
export function gFromScroll(y: number, vh: number) {
	let start = 0;
	for (let i = 0; i < SCENES.length; i++) {
		const len = (SCENES[i].vh / 100) * vh;
		if (y < start + len || i === SCENES.length - 1) {
			return SCENES[i].id + Math.min(Math.max((y - start) / len, 0), 0.9999);
		}
		start += len;
	}
	return 1;
}

export const clamp = (x: number, a = 0, b = 1) => Math.min(Math.max(x, a), b);
export const smooth = (a: number, b: number, x: number) => {
	const t = clamp((x - a) / (b - a));
	return t * t * (3 - 2 * t);
};
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const easeInOut = (t: number) =>
	t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

/**
 * Stars given in scene 4, in two moments with a hold between them: one star (and its stamp)
 * for a while, then two to five, and the brick goes back in the window.
 */
export function starsAt(G: number) {
	if (G < 4.48) return clamp((G - 4.1) / 0.1);
	return 1 + clamp((G - 4.48) / 0.28) * 4;
}

// The camera and the bowl, shared with the iris so the hole in the yellow sits on the rim.
export const CAMERA = { fov: 20, distance: 15 };
export const BOWL = {
	rim: 1.35,
	rimY: 1.24,
	soupY: 0.925,
	soupRadius: 1.01,
	depth: 1.25,
};

/** On a tall screen the width is what limits the bowl: step the camera back to keep it whole. */
export function distanceScale(aspect: number) {
	return Math.max(1, 0.95 / aspect);
}

/** How many px the bowl's rim measures on screen in the opening top view. */
export function rimRadiusPx(viewportWidth: number, viewportHeight: number) {
	const t = Math.tan(((CAMERA.fov / 2) * Math.PI) / 180);
	const k = distanceScale(viewportWidth / viewportHeight);
	const fromCamera = CAMERA.distance * k - (BOWL.rimY - BOWL.soupY);
	return (BOWL.rim / (fromCamera * t)) * (viewportHeight / 2);
}
