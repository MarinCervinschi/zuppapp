import { useMemo, useRef } from "react";

import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

import { BRICK } from "./packs/geometry";
import { director, reduced, starsAt } from "./story";

// Scene 4's verdict: each star stamps the brick's front with its name, in ink, like a rubber
// stamp. A new star slams a new stamp over the old one; scrolling back takes it off again.

const VERDICTS = [
	{ text: ["MAI", "PIÙ"], color: "#e0300e", tilt: -0.22 },
	{ text: ["SI", "MANGIA"], color: "#b8450a", tilt: 0.12 },
	{ text: ["NIENTE", "MALE"], color: "#16120f", tilt: -0.08 },
	{ text: ["BUONA"], color: "#2f6f2b", tilt: 0.1 },
	{ text: ["LA", "RICOMPRO"], color: "#2f6f2b", tilt: -0.12 },
];

function rng(seed: number) {
	let s = seed >>> 0;
	return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296;
}

function stampTexture(v: (typeof VERDICTS)[number], seed: number) {
	const W = 640;
	const H = 360;
	const c = document.createElement("canvas");
	c.width = W;
	c.height = H;
	const ctx = c.getContext("2d")!;
	ctx.strokeStyle = ctx.fillStyle = v.color;
	ctx.lineWidth = 14;
	ctx.beginPath();
	ctx.roundRect(20, 20, W - 40, H - 40, 26);
	ctx.stroke();
	ctx.lineWidth = 5;
	ctx.beginPath();
	ctx.roundRect(42, 42, W - 84, H - 84, 14);
	ctx.stroke();
	ctx.textAlign = "center";
	ctx.textBaseline = "middle";
	const size = v.text.length === 1 ? 150 : 112;
	ctx.font = `600 ${size}px "Clash Display", Poppins, sans-serif`;
	let width = Math.max(...v.text.map(t => ctx.measureText(t).width));
	const fit = Math.min(1, (W - 130) / width);
	ctx.font = `600 ${size * fit}px "Clash Display", Poppins, sans-serif`;
	v.text.forEach((t, i) =>
		ctx.fillText(
			t,
			W / 2,
			H / 2 + (i - (v.text.length - 1) / 2) * size * fit * 0.95 + 6
		)
	);
	// The rubber is worn: knock specks and a few dry streaks out of the ink.
	const r = rng(seed);
	ctx.globalCompositeOperation = "destination-out";
	for (let i = 0; i < 700; i++) {
		ctx.globalAlpha = 0.5 + r() * 0.5;
		const s = 1 + r() * 3.5;
		ctx.fillRect(r() * W, r() * H, s, s);
	}
	for (let i = 0; i < 4; i++) {
		ctx.globalAlpha = 0.25 + r() * 0.3;
		ctx.fillRect(r() * W, r() * H, 60 + r() * 200, 2 + r() * 5);
	}
	// A side that pressed lighter than the other.
	const g = ctx.createLinearGradient(0, 0, W, 0);
	g.addColorStop(0, "rgba(0,0,0,0)");
	g.addColorStop(1, "rgba(0,0,0,0.1)");
	ctx.globalAlpha = 1;
	ctx.fillStyle = g;
	ctx.fillRect(0, 0, W, H);
	const t = new THREE.CanvasTexture(c);
	t.colorSpace = THREE.SRGBColorSpace;
	t.anisotropy = 8;
	return t;
}

export function Stamp() {
	const mats = useMemo(
		() =>
			VERDICTS.map(
				(v, i) =>
					new THREE.MeshBasicMaterial({
						map: stampTexture(v, 7 + i * 13),
						transparent: true,
						depthWrite: false,
						toneMapped: false,
						polygonOffset: true,
						polygonOffsetFactor: -2,
					})
			),
		[]
	);
	const mesh = useRef<THREE.Mesh>(null);
	const state = useRef({ shown: 0, since: 0 });

	useFrame((_, dt) => {
		const G = director.G;
		const n = G >= 4.05 && G < 4.97 ? Math.floor(starsAt(G)) : 0;
		const st = state.current;
		if (n !== st.shown) {
			st.shown = n;
			st.since = 0;
		}
		st.since += dt;
		const m = mesh.current!;
		m.visible = n > 0;
		if (!n) return;
		const v = VERDICTS[n - 1];
		m.material = mats[n - 1];
		// The slam: it comes down big and lands in a tenth of a second, with a hair of overshoot.
		const k = reduced ? 1 : Math.min(st.since / 0.12, 1);
		const scale = reduced
			? 1
			: k < 1
				? 1.7 - 0.75 * k * k
				: 1 -
					0.05 * Math.exp(-(st.since - 0.12) * 18) * Math.sin((st.since - 0.12) * 40);
		m.scale.setScalar(scale);
		m.rotation.z = v.tilt;
		(m.material as THREE.MeshBasicMaterial).opacity = Math.min(1, 0.2 + k);
	});

	return (
		<mesh ref={mesh} position={[0, BRICK.h * 0.2, BRICK.d / 2 + 0.004]} visible={false}>
			<planeGeometry args={[0.68, 0.38]} />
		</mesh>
	);
}
