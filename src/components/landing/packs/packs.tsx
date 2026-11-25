import { useMemo } from "react";

import * as THREE from "three";

import { C, GLAZE_LIT, SPOON_SHADE } from "../palette";
import {
	BRICK,
	JAR,
	POUCH,
	TRAY,
	capGeometry,
	earGeometry,
	jarGeometry,
	pouchGeometry,
	trayGeometry,
} from "./geometry";
import type { Labels } from "./labels";
import { flatMat, labelMat, outlineMat, shadowMat } from "./materials";

/** A drawn shadow on the floor, under a pack. */
function Shadow({
	w,
	d,
	x = 0.12,
	z = -0.1,
}: {
	w: number;
	d: number;
	x?: number;
	z?: number;
}) {
	const mat = useMemo(shadowMat, []);
	return (
		<mesh
			rotation-x={-Math.PI / 2}
			position={[x, 0.002, z]}
			material={mat}
			renderOrder={-1}
		>
			<planeGeometry args={[w, d]} />
		</mesh>
	);
}

export function BrickPack({ labels }: { labels: Labels["brick"] }) {
	const { w, h, d } = BRICK;
	const m = useMemo(() => {
		const side = (t: THREE.Texture) => labelMat(t, { highSize: 0.985 });
		return {
			body: [
				side(labels.right),
				side(labels.left),
				side(labels.top),
				flatMat(C.tomato),
				side(labels.front),
				side(labels.back),
			],
			tomato: flatMat(C.tomato),
			cap: flatMat(C.sheet, SPOON_SHADE, 0.9),
			ink: outlineMat(0),
			line: outlineMat(0.014),
		};
	}, [labels]);
	const ear = useMemo(earGeometry, []);
	const cap = useMemo(() => capGeometry(0.1, 0.085, 36), []);
	const t = 0.018;
	return (
		<group>
			<Shadow w={1.5} d={1.3} />
			<mesh position-y={h / 2} material={m.body}>
				<boxGeometry args={[w, h, d]} />
			</mesh>
			<mesh
				position-y={h / 2}
				scale={[1 + (2 * t) / w, 1 + (2 * t) / h, 1 + (2 * t) / d]}
				material={m.ink}
			>
				<boxGeometry args={[w, h, d]} />
			</mesh>
			{/* The sealed fin across the top, folded flat, and the two ears folded down the sides. */}
			<mesh position={[0, h + 0.008, 0]} material={m.tomato}>
				<boxGeometry args={[w * 0.97, 0.016, 0.07]} />
			</mesh>
			<mesh geometry={ear} position={[w / 2, h - 0.002, 0]} material={m.tomato} />
			<mesh
				geometry={ear}
				position={[-w / 2 - 0.012, h - 0.002, 0]}
				material={m.tomato}
			/>
			<mesh geometry={ear} position={[w / 2, h - 0.002, 0]} material={m.line} />
			<mesh
				geometry={ear}
				position={[-w / 2 - 0.012, h - 0.002, 0]}
				material={m.line}
			/>
			<group position={[0, h + 0.045, d * 0.27]}>
				<mesh geometry={cap} material={m.cap} />
				<mesh geometry={cap} material={m.line} />
			</group>
		</group>
	);
}

export function PouchPack({ labels }: { labels: Labels["busta"] }) {
	const geo = useMemo(() => pouchGeometry(), []);
	const m = useMemo(
		() => ({
			body: [
				labelMat(labels.front, { highSize: 0.93 }),
				labelMat(labels.back, { highSize: 0.93 }),
				flatMat(C.pea),
			],
			line: outlineMat(0.016),
		}),
		[labels]
	);
	return (
		<group>
			<Shadow w={POUCH.w * 1.25} d={POUCH.t * 4} />
			<mesh geometry={geo} material={m.body} />
			<mesh geometry={geo} material={m.line} />
		</group>
	);
}

export function TrayPack({ labels }: { labels: Labels["vaschetta"] }) {
	const geo = useMemo(trayGeometry, []);
	const m = useMemo(() => {
		labels.sleeve.wrapS = THREE.RepeatWrapping;
		labels.sleeve.needsUpdate = true;
		return {
			walls: labelMat(labels.sleeve, { highSize: 0.99 }),
			film: labelMat(labels.film, { highSize: 0.9, shade: 0.85 }),
			rim: flatMat(C.sheet, SPOON_SHADE, 0.92),
			base: flatMat(C.pumpkin),
			line: outlineMat(0.016),
		};
	}, [labels]);
	return (
		<group>
			<Shadow w={TRAY.w * 1.3} d={TRAY.d * 1.4} />
			<mesh geometry={geo.walls} material={m.walls} />
			<mesh geometry={geo.walls} material={m.line} />
			<mesh geometry={geo.base} material={m.base} />
			<mesh geometry={geo.film} material={m.film} />
			<mesh geometry={geo.rim} material={m.rim} />
			<mesh geometry={geo.rim} material={m.line} />
		</group>
	);
}

export function JarPack({ labels }: { labels: Labels["vasetto"] }) {
	const geo = useMemo(jarGeometry, []);
	const m = useMemo(
		() => ({
			// The glass: we see the soup through it, with one long shine.
			glass: flatMat(C.corn, C.pumpkin, 0.86),
			band: labelMat(labels.band, { highSize: 0.995 }),
			lid: flatMat(GLAZE_LIT, C.ink, 0.9),
			lidTop: labelMat(labels.lid, { highSize: 0.94 }),
			line: outlineMat(0.016),
		}),
		[labels]
	);
	return (
		<group>
			<Shadow w={JAR.r * 3.2} d={JAR.r * 3.2} />
			<mesh geometry={geo.glass} material={m.glass} />
			<mesh geometry={geo.glass} material={m.line} />
			<mesh geometry={geo.band} material={m.band} />
			<mesh geometry={geo.lid} material={m.lid} />
			<mesh geometry={geo.lid} material={m.line} />
			<mesh geometry={geo.lidTop} material={m.lidTop} />
		</group>
	);
}
