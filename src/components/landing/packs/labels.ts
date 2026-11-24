import * as THREE from "three";

import { HEX } from "../palette";

// The labels of four invented soups, drawn at runtime on a 2D canvas: flat blobs of soup colour
// with the poster's grain, heavy titles, vegetables cut out of paper with an ink outline.
// Brands are made up (to be checked on TMview before going live). Clash Display is only ever
// drawn with the browser's own text engine, never converted (its licence forbids it).

const TITLE = '"Clash Display", Poppins, sans-serif';
const BODY = "Poppins, sans-serif";
const LEAF = "#3f8a3a";
const LEAF_DARK = "#2a5f28";

export type PackKind = "brick" | "busta" | "vaschetta" | "vasetto";

export const PACK_INFO: Record<
	PackKind,
	{ brand: string; name: string; size: string; claim: string; soup: keyof typeof HEX }
> = {
	brick: {
		brand: "Sincera",
		name: "Vellutata di pomodoro",
		size: "500 ml",
		claim: "Come fatta in casa",
		soup: "tomato",
	},
	busta: {
		brand: "Orto Promesso",
		name: "Passato di piselli",
		size: "450 g",
		claim: "Ricca di verdure",
		soup: "pea",
	},
	vaschetta: {
		brand: "Contadino Ipotetico",
		name: "Vellutata di zucca",
		size: "620 g",
		claim: "Ricetta tradizionale",
		soup: "pumpkin",
	},
	vasetto: {
		brand: "Nonna Generica",
		name: "Crema di ceci",
		size: "480 g",
		claim: "Senza conservanti*",
		soup: "corn",
	},
};

// ---------------------------------------------------------------- drawing helpers

function rng(seed: number) {
	let s = seed >>> 0;
	return () => {
		s = (s * 1664525 + 1013904223) >>> 0;
		return s / 4294967296;
	};
}

function canvas(w: number, h: number) {
	const c = document.createElement("canvas");
	c.width = w;
	c.height = h;
	return { c, ctx: c.getContext("2d")! };
}

function texture(c: HTMLCanvasElement, gl?: THREE.WebGLRenderer) {
	const t = new THREE.CanvasTexture(c);
	t.anisotropy = gl ? Math.min(8, gl.capabilities.getMaxAnisotropy()) : 4;
	t.generateMipmaps = true;
	t.minFilter = THREE.LinearMipmapLinearFilter;
	return t;
}

/** An organic blob, with a stippled hem like the app's SoupField. */
function blob(
	ctx: CanvasRenderingContext2D,
	cx: number,
	cy: number,
	R: number,
	color: string,
	paper: string,
	seed: number,
	squash = 1
) {
	const r = rng(seed);
	const ph = [r() * 6.28, r() * 6.28, r() * 6.28];
	const radius = (a: number) =>
		R *
		(1 +
			0.07 * Math.sin(3 * a + ph[0]) +
			0.05 * Math.sin(5 * a + ph[1]) +
			0.06 * Math.sin(2 * a + ph[2]));
	ctx.beginPath();
	for (let i = 0; i <= 180; i++) {
		const a = (i / 180) * Math.PI * 2;
		const rr = radius(a);
		const x = cx + Math.cos(a) * rr;
		const y = cy + Math.sin(a) * rr * squash;
		i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
	}
	ctx.fillStyle = color;
	ctx.fill();
	// The grain at the edge: near the hem each speck is either soup or paper.
	const n = Math.round(R * 22);
	for (let i = 0; i < n; i++) {
		const a = r() * Math.PI * 2;
		const rr = radius(a) * (1 + (r() - 0.5) * 0.09);
		ctx.fillStyle = r() < 0.5 ? color : paper;
		const s = 1.5 + r() * 2;
		ctx.fillRect(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr * squash, s, s);
	}
}

/** The tooth of the paper over a whole label. */
function grain(ctx: CanvasRenderingContext2D, w: number, h: number, seed: number) {
	const r = rng(seed);
	const n = Math.round((w * h) / 90);
	for (let i = 0; i < n; i++) {
		ctx.fillStyle = r() < 0.5 ? "rgba(22,18,15,0.07)" : "rgba(255,255,255,0.08)";
		ctx.fillRect(r() * w, r() * h, 2, 2);
	}
}

function fitFont(
	ctx: CanvasRenderingContext2D,
	text: string,
	weight: number,
	family: string,
	max: number,
	width: number
) {
	let size = max;
	ctx.font = `${weight} ${size}px ${family}`;
	while (ctx.measureText(text).width > width && size > 8) {
		size -= 2;
		ctx.font = `${weight} ${size}px ${family}`;
	}
	return size;
}

function lines(
	ctx: CanvasRenderingContext2D,
	text: string[],
	x: number,
	y: number,
	lh: number
) {
	text.forEach((t, i) => ctx.fillText(t, x, y + i * lh));
}

function ink(ctx: CanvasRenderingContext2D, w = 5) {
	ctx.strokeStyle = HEX.ink;
	ctx.lineWidth = w;
	ctx.lineJoin = "round";
	ctx.stroke();
}

function tomato(ctx: CanvasRenderingContext2D, x: number, y: number, r: number) {
	ctx.beginPath();
	ctx.ellipse(x, y, r, r * 0.86, 0, 0, Math.PI * 2);
	ctx.fillStyle = HEX.tomato;
	ctx.fill();
	ink(ctx, r * 0.07);
	ctx.beginPath();
	ctx.ellipse(x - r * 0.38, y - r * 0.3, r * 0.2, r * 0.12, -0.6, 0, Math.PI * 2);
	ctx.fillStyle = HEX.sheet;
	ctx.fill();
	ctx.beginPath();
	for (let i = 0; i < 10; i++) {
		const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
		const rr = i % 2 ? r * 0.12 : r * 0.36;
		ctx.lineTo(x + Math.cos(a) * rr, y - r * 0.74 + Math.sin(a) * rr * 0.55);
	}
	ctx.closePath();
	ctx.fillStyle = LEAF;
	ctx.fill();
	ink(ctx, r * 0.05);
}

function pod(
	ctx: CanvasRenderingContext2D,
	x: number,
	y: number,
	len: number,
	rot: number
) {
	ctx.save();
	ctx.translate(x, y);
	ctx.rotate(rot);
	ctx.beginPath();
	ctx.moveTo(-len / 2, 0);
	ctx.quadraticCurveTo(0, -len * 0.34, len / 2, 0);
	ctx.quadraticCurveTo(0, len * 0.26, -len / 2, 0);
	ctx.fillStyle = LEAF;
	ctx.fill();
	ink(ctx, len * 0.03);
	for (let i = 0; i < 4; i++) {
		ctx.beginPath();
		ctx.arc(-len * 0.27 + i * len * 0.18, -len * 0.03, len * 0.075, 0, Math.PI * 2);
		ctx.fillStyle = HEX.pea;
		ctx.fill();
		ink(ctx, len * 0.02);
	}
	ctx.restore();
}

function pumpkin(ctx: CanvasRenderingContext2D, x: number, y: number, r: number) {
	for (const [dx, sx] of [
		[-0.42, 0.62],
		[0.42, 0.62],
		[0, 0.66],
	] as const) {
		ctx.beginPath();
		ctx.ellipse(x + dx * r, y, r * sx, r * 0.78, 0, 0, Math.PI * 2);
		ctx.fillStyle = HEX.pumpkin;
		ctx.fill();
		ink(ctx, r * 0.06);
	}
	ctx.beginPath();
	ctx.roundRect(x - r * 0.08, y - r * 1.05, r * 0.16, r * 0.34, r * 0.05);
	ctx.fillStyle = LEAF_DARK;
	ctx.fill();
	ink(ctx, r * 0.05);
}

function chickpea(ctx: CanvasRenderingContext2D, x: number, y: number, r: number) {
	ctx.beginPath();
	ctx.arc(x, y, r, 0, Math.PI * 2);
	ctx.fillStyle = "#f2cf86";
	ctx.fill();
	ink(ctx, r * 0.12);
	ctx.beginPath();
	ctx.moveTo(x + r * 0.2, y - r * 0.95);
	ctx.quadraticCurveTo(x + r * 0.55, y - r * 1.4, x + r * 0.7, y - r * 0.75);
	ink(ctx, r * 0.12);
}

function sticker(
	ctx: CanvasRenderingContext2D,
	x: number,
	y: number,
	r: number,
	text: string[],
	rot = -0.18
) {
	ctx.save();
	ctx.translate(x, y);
	ctx.rotate(rot);
	ctx.beginPath();
	for (let i = 0; i < 28; i++) {
		const a = (i / 28) * Math.PI * 2;
		const rr = i % 2 ? r * 0.9 : r;
		ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
	}
	ctx.closePath();
	ctx.fillStyle = HEX.star;
	ctx.fill();
	ink(ctx, r * 0.05);
	ctx.fillStyle = HEX.ink;
	ctx.textAlign = "center";
	ctx.textBaseline = "middle";
	const size = r * 0.26;
	ctx.font = `600 ${size}px ${TITLE}`;
	text.forEach((t, i) => ctx.fillText(t, 0, (i - (text.length - 1) / 2) * size * 1.05));
	ctx.restore();
}

function barcode(
	ctx: CanvasRenderingContext2D,
	x: number,
	y: number,
	w: number,
	h: number,
	seed: number
) {
	const r = rng(seed);
	ctx.fillStyle = HEX.sheet;
	ctx.fillRect(x - 10, y - 10, w + 20, h + 46);
	ctx.fillStyle = HEX.ink;
	let cx = x;
	while (cx < x + w) {
		const bw = 2 + Math.floor(r() * 3) * 2;
		if (r() > 0.45) ctx.fillRect(cx, y, bw, h);
		cx += bw + 2;
	}
	ctx.font = `500 22px ${BODY}`;
	ctx.textAlign = "center";
	ctx.textBaseline = "top";
	// Prefix 20-29: in-store numbers, never a real product.
	ctx.fillText("2 049871 300125", x + w / 2, y + h + 6);
}

// ---------------------------------------------------------------- the four labels

export type LabelSet = Partial<
	Record<
		"front" | "back" | "left" | "right" | "top" | "band" | "sleeve" | "film" | "lid",
		THREE.CanvasTexture
	>
>;

function brickFront() {
	const { c, ctx } = canvas(640, 1640);
	ctx.fillStyle = HEX.sheet;
	ctx.fillRect(0, 0, 640, 1640);
	blob(ctx, 330, 470, 330, HEX.tomato, HEX.sheet, 3, 1.1);
	ctx.fillStyle = HEX.ink;
	ctx.textAlign = "center";
	ctx.textBaseline = "alphabetic";
	ctx.font = `600 64px ${TITLE}`;
	ctx.fillText("SINCERA", 320, 120);
	tomato(ctx, 230, 520, 120);
	tomato(ctx, 410, 600, 90);
	pod(ctx, 440, 380, 160, -0.5);
	ctx.fillStyle = HEX.ink;
	ctx.textAlign = "left";
	const s = fitFont(ctx, "pomodoro", 600, TITLE, 150, 560);
	ctx.font = `600 ${s * 0.62}px ${TITLE}`;
	ctx.fillText("Vellutata di", 42, 1000);
	ctx.font = `600 ${s}px ${TITLE}`;
	ctx.fillText("pomodoro", 38, 1000 + s * 0.92);
	ctx.font = `400 34px ${BODY}`;
	ctx.fillStyle = HEX.inkSoft;
	lines(ctx, ["con patate e un filo", "d'olio extravergine"], 42, 1250, 44);
	sticker(ctx, 470, 860, 120, ["Come", "fatta", "in casa"]);
	ctx.fillStyle = HEX.ink;
	ctx.font = `600 58px ${TITLE}`;
	ctx.fillText("500 ml", 42, 1560);
	ctx.fillStyle = HEX.tomato;
	ctx.fillRect(0, 1600, 640, 40);
	grain(ctx, 640, 1640, 11);
	return c;
}

function brickSide(flip: boolean) {
	const { c, ctx } = canvas(512, 1640);
	ctx.fillStyle = HEX.tomato;
	ctx.fillRect(0, 0, 512, 1640);
	ctx.save();
	ctx.translate(256, 820);
	ctx.rotate(flip ? Math.PI / 2 : -Math.PI / 2);
	ctx.fillStyle = HEX.sheet;
	ctx.textAlign = "center";
	ctx.textBaseline = "middle";
	ctx.font = `600 190px ${TITLE}`;
	ctx.fillText("SINCERA", 0, -30);
	ctx.font = `500 44px ${BODY}`;
	ctx.fillText("ricca di verdure · ricetta tradizionale", 0, 120);
	ctx.restore();
	grain(ctx, 512, 1640, flip ? 5 : 7);
	return c;
}

function brickBack() {
	const { c, ctx } = canvas(640, 1640);
	ctx.fillStyle = HEX.sheet;
	ctx.fillRect(0, 0, 640, 1640);
	ctx.fillStyle = HEX.ink;
	ctx.textAlign = "left";
	ctx.textBaseline = "alphabetic";
	ctx.font = `600 50px ${TITLE}`;
	ctx.fillText("Ingredienti", 44, 130);
	ctx.font = `400 30px ${BODY}`;
	lines(
		ctx,
		[
			"acqua, pomodoro 38%, patate",
			"7%, cipolla, olio di semi di",
			"girasole, amido modificato di",
			"mais, zucchero, sale, olio",
			"extravergine di oliva 0,5%,",
			"aromi naturali, correttore",
			"di acidità: acido citrico.",
			"Può contenere sedano.",
		],
		44,
		190,
		42
	);
	ctx.font = `600 40px ${TITLE}`;
	ctx.fillText("Valori nutrizionali", 44, 620);
	ctx.font = `400 28px ${BODY}`;
	const rows = [
		["per 100 ml", ""],
		["Energia", "52 kcal"],
		["Grassi", "2,1 g"],
		["Carboidrati", "6,8 g"],
		["di cui zuccheri", "3,9 g"],
		["Proteine", "1,2 g"],
		["Sale", "0,82 g"],
	];
	rows.forEach(([a, b], i) => {
		const y = 680 + i * 50;
		ctx.fillText(a, 44, y);
		ctx.textAlign = "right";
		ctx.fillText(b, 596, y);
		ctx.textAlign = "left";
		ctx.fillRect(44, y + 14, 552, 2);
	});
	ctx.font = `400 26px ${BODY}`;
	lines(
		ctx,
		[
			"Agitare prima dell'uso. Una volta",
			"aperto conservare in frigo e",
			"consumare entro 3 giorni.",
		],
		44,
		1080,
		36
	);
	barcode(ctx, 120, 1260, 400, 180, 21);
	grain(ctx, 640, 1640, 13);
	return c;
}

function brickTop() {
	const { c, ctx } = canvas(512, 512);
	ctx.fillStyle = HEX.tomato;
	ctx.fillRect(0, 0, 512, 512);
	grain(ctx, 512, 512, 17);
	return c;
}

function pouchFace(front: boolean) {
	const { c, ctx } = canvas(1024, 1440);
	ctx.fillStyle = HEX.sheet;
	ctx.fillRect(0, 0, 1024, 1440);
	// The welded seals: a darker band at the top and on the sides, with the tear notch.
	ctx.fillStyle = "#e4d8c6";
	ctx.fillRect(0, 0, 1024, 150);
	ctx.fillStyle = HEX.inkSoft;
	for (let x = 0; x < 1024; x += 14) ctx.fillRect(x, 120, 6, 3);
	ctx.font = `500 26px ${BODY}`;
	ctx.textAlign = "left";
	ctx.fillText("strappa qui", 60, 104);
	if (front) {
		blob(ctx, 540, 1060, 460, HEX.pea, HEX.sheet, 8, 0.8);
		pod(ctx, 380, 1060, 340, -0.35);
		pod(ctx, 690, 1150, 280, 0.4);
		ctx.fillStyle = HEX.ink;
		ctx.textAlign = "center";
		ctx.font = `600 54px ${TITLE}`;
		ctx.fillText("ORTO PROMESSO", 512, 280);
		ctx.textAlign = "left";
		ctx.font = `600 120px ${TITLE}`;
		ctx.fillText("Passato", 90, 470);
		ctx.fillText("di piselli", 90, 590);
		sticker(ctx, 830, 520, 120, ["Ricca", "di", "verdure"], 0.2);
		ctx.font = `600 64px ${TITLE}`;
		ctx.fillStyle = HEX.ink;
		ctx.fillText("450 g", 90, 1370);
	} else {
		ctx.fillStyle = HEX.ink;
		ctx.textAlign = "left";
		ctx.font = `600 56px ${TITLE}`;
		ctx.fillText("Ingredienti", 90, 300);
		ctx.font = `400 34px ${BODY}`;
		lines(
			ctx,
			[
				"acqua, piselli 31%, patate, porri,",
				"cipolla, olio di girasole, sale,",
				"pepe. Può contenere sedano.",
			],
			90,
			370,
			48
		);
		barcode(ctx, 300, 900, 420, 200, 33);
		blob(ctx, 512, 1500, 520, HEX.pea, HEX.sheet, 9, 0.5);
	}
	grain(ctx, 1024, 1440, front ? 19 : 23);
	return c;
}

function trayParts() {
	// The sleeve wraps the tray twice round (front and back); x = 1024 is the middle of the front.
	const sleeve = canvas(2048, 400);
	const { ctx } = sleeve;
	ctx.fillStyle = HEX.pumpkin;
	ctx.fillRect(0, 0, 2048, 400);
	blob(ctx, 700, 225, 210, HEX.corn, HEX.pumpkin, 4, 0.75);
	pumpkin(ctx, 650, 235, 88);
	pumpkin(ctx, 790, 265, 62);
	ctx.fillStyle = HEX.ink;
	ctx.textAlign = "left";
	ctx.textBaseline = "alphabetic";
	ctx.font = `600 34px ${TITLE}`;
	ctx.fillText("CONTADINO IPOTETICO", 880, 100);
	ctx.font = `600 84px ${TITLE}`;
	ctx.fillText("Vellutata", 876, 196);
	ctx.fillText("di zucca", 876, 276);
	ctx.font = `400 28px ${BODY}`;
	ctx.fillText("con carote e un pizzico di zenzero", 880, 330);
	sticker(ctx, 1420, 200, 92, ["Ricetta", "tradizio-", "nale"], 0.16);
	ctx.font = `600 120px ${TITLE}`;
	ctx.fillText("620 g", 90, 250);
	ctx.font = `600 40px ${TITLE}`;
	ctx.fillText("Pronta in 3 minuti", 1640, 220);
	grain(ctx, 2048, 400, 29);

	const film = canvas(1024, 700);
	const f = film.ctx;
	f.fillStyle = HEX.pumpkin;
	f.fillRect(0, 0, 1024, 700);
	const r = rng(41);
	// Bits of carrot and potato in the velvety soup, seen through the film.
	for (let i = 0; i < 70; i++) {
		const x = 60 + r() * 900;
		const y = 60 + r() * 580;
		const s = 14 + r() * 20;
		f.save();
		f.translate(x, y);
		f.rotate(r() * 3);
		f.fillStyle = r() < 0.55 ? HEX.tomato : "#f6dc9a";
		f.fillRect(-s / 2, -s / 2, s, s);
		f.restore();
	}
	f.strokeStyle = HEX.sheet;
	f.lineWidth = 14;
	f.lineCap = "round";
	f.beginPath();
	f.arc(520, 350, 150, 0.3, Math.PI * 1.6);
	f.stroke();
	// The film's sheen and its printed band.
	f.fillStyle = "rgba(255,255,255,0.32)";
	f.beginPath();
	f.ellipse(300, 170, 260, 60, -0.35, 0, Math.PI * 2);
	f.fill();
	f.fillStyle = HEX.ink;
	f.font = `600 40px ${TITLE}`;
	f.fillText("Togliere il film prima di scaldare", 60, 660);
	grain(f, 1024, 700, 43);
	return { sleeve: sleeve.c, film: film.c };
}

function jarBand() {
	// The band goes all the way round; x = 1024 faces the camera.
	const { c, ctx } = canvas(2048, 480);
	ctx.fillStyle = HEX.sheet;
	ctx.fillRect(0, 0, 2048, 480);
	blob(ctx, 830, 250, 190, HEX.corn, HEX.sheet, 14, 0.95);
	for (const [x, y, r] of [
		[780, 230, 40],
		[860, 200, 34],
		[880, 290, 38],
		[790, 320, 34],
		[940, 240, 30],
	] as const)
		chickpea(ctx, x, y, r);
	ctx.fillStyle = HEX.ink;
	ctx.textAlign = "left";
	ctx.textBaseline = "alphabetic";
	ctx.font = `600 36px ${TITLE}`;
	ctx.fillText("NONNA GENERICA", 1050, 120);
	ctx.font = `600 104px ${TITLE}`;
	ctx.fillText("Crema", 1044, 222);
	ctx.fillText("di ceci", 1044, 318);
	ctx.font = `400 28px ${BODY}`;
	ctx.fillText("480 g · *ci sono tutti gli altri", 1050, 376);
	sticker(ctx, 1440, 250, 100, ["Senza", "conser-", "vanti*"], 0.15);
	ctx.fillStyle = HEX.corn;
	ctx.fillRect(0, 0, 2048, 30);
	ctx.fillRect(0, 450, 2048, 30);
	grain(ctx, 2048, 480, 47);
	return c;
}

function jarLid() {
	const { c, ctx } = canvas(512, 512);
	ctx.fillStyle = HEX.ink;
	ctx.fillRect(0, 0, 512, 512);
	ctx.strokeStyle = "#3a2f27";
	ctx.lineWidth = 6;
	ctx.beginPath();
	ctx.arc(256, 256, 170, 0, Math.PI * 2);
	ctx.stroke();
	ctx.fillStyle = HEX.sheet;
	ctx.textAlign = "center";
	ctx.font = `600 44px ${TITLE}`;
	ctx.fillText("NONNA", 256, 250);
	ctx.fillText("GENERICA", 256, 300);
	return c;
}

/** Waits for the fonts, then draws every label. */
export async function makeLabels(gl?: THREE.WebGLRenderer) {
	await Promise.all([
		document.fonts.load(`600 100px "Clash Display"`),
		document.fonts.load(`400 30px Poppins`),
		document.fonts.load(`500 30px Poppins`),
	]).catch(() => {});
	const tray = trayParts();
	const t = (c: HTMLCanvasElement) => texture(c, gl);
	return {
		brick: {
			front: t(brickFront()),
			back: t(brickBack()),
			left: t(brickSide(false)),
			right: t(brickSide(true)),
			top: t(brickTop()),
		},
		busta: { front: t(pouchFace(true)), back: t(pouchFace(false)) },
		vaschetta: { sleeve: t(tray.sleeve), film: t(tray.film) },
		vasetto: { band: t(jarBand()), lid: t(jarLid()) },
	} satisfies Record<PackKind, LabelSet>;
}
export type Labels = Awaited<ReturnType<typeof makeLabels>>;
