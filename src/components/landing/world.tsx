import { useEffect, useMemo, useRef, useState } from "react";

import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

import { BRICK } from "./packs/geometry";
import { type Labels, makeLabels } from "./packs/labels";
import { LIGHT, flatMat, labelMat, outlineMat } from "./packs/materials";
import { BrickPack, JarPack, PouchPack, TrayPack } from "./packs/packs";
import { C } from "./palette";
import { SoupBowl, pour } from "./soup-bowl";
import { Stamp } from "./stamp";
import { clamp, director, easeInOut, lerp, reduced, smooth } from "./story";

// Everything in 3D: the bowl, the packs, the brick, the podium. G is the story clock (story.ts);
// the camera keys and every object's moves below were timed in a gray-box animatic first.

type Key = {
	g: number;
	az: number;
	el: number;
	d: number;
	t: [number, number, number];
};
const KEYS: Key[] = [
	{ g: 1.0, az: 0, el: 89.5, d: 15, t: [0, 0.92, 0] },
	{ g: 1.06, az: -12, el: 66, d: 13.8, t: [0, 0.75, 0] },
	{ g: 1.3, az: -24, el: 32, d: 12.4, t: [0, 0.62, 0] },
	{ g: 1.82, az: -30, el: 30, d: 12.4, t: [0, 0.62, 0] },
	{ g: 2.02, az: 0, el: 11, d: 12.5, t: [0, 0.95, 0.6] },
	{ g: 2.88, az: 0, el: 11, d: 12.5, t: [0, 0.95, 0.6] },
	{ g: 3.04, az: 0, el: 7, d: 9.6, t: [0, 0.95, 0] },
	{ g: 3.32, az: 180, el: 7, d: 9.2, t: [0, 0.95, 0] },
	{ g: 3.92, az: 180, el: 6, d: 8.8, t: [0, 0.95, 0] },
	{ g: 4.06, az: 360, el: 5, d: 7.4, t: [0, 0.8, 0] },
	{ g: 4.66, az: 360, el: 5, d: 7.4, t: [0, 0.8, 0] },
	{ g: 4.84, az: 360, el: 10, d: 12.5, t: [0, 1.25, 0] },
	{ g: 4.94, az: 360, el: 10, d: 12.5, t: [0, 1.25, 0] },
	{ g: 5.12, az: 380, el: 18, d: 15, t: [-0.4, 1.5, 0] },
	{ g: 5.9, az: 380, el: 24, d: 15, t: [-0.2, 1.3, 0] },
	{ g: 6.06, az: 360, el: 11, d: 16, t: [0, 1.0, 0] },
	{ g: 9.0, az: 360, el: 11, d: 16, t: [0, 1.0, 0] },
];

function cameraAt(G: number) {
	let i = 0;
	while (i < KEYS.length - 2 && G > KEYS[i + 1].g) i++;
	const a = KEYS[i];
	const b = KEYS[i + 1];
	const k = easeInOut(clamp((G - a.g) / (b.g - a.g)));
	return {
		az: lerp(a.az, b.az, k),
		el: lerp(a.el, b.el, k),
		d: lerp(a.d, b.d, k),
		t: a.t.map((v, j) => lerp(v, b.t[j], k)) as [number, number, number],
	};
}

const BASE_LIGHT = new THREE.Vector3(-0.55, 1, 0.65).normalize();
const Y = new THREE.Vector3(0, 1, 0);
const R = 2.3;
const RING_Z = -R * 0.35;

// ---------------------------------------------------------------- podium and confetti

function numberTexture(n: number, bg: string) {
	const c = document.createElement("canvas");
	c.width = 512;
	c.height = 384;
	const ctx = c.getContext("2d")!;
	ctx.fillStyle = bg;
	ctx.fillRect(0, 0, 512, 384);
	ctx.fillStyle = "#16120f";
	ctx.textAlign = "center";
	ctx.textBaseline = "middle";
	ctx.font = `600 230px "Clash Display", Poppins, sans-serif`;
	ctx.fillText(String(n), 256, 205);
	const t = new THREE.CanvasTexture(c);
	t.anisotropy = 8;
	return t;
}

function Step({
	n,
	w,
	h,
	color,
	hex,
	x,
}: {
	n: number;
	w: number;
	h: number;
	color: readonly number[];
	hex: string;
	x: number;
}) {
	const mats = useMemo(() => {
		const flat = flatMat(color);
		return {
			body: [flat, flat, flat, flat, labelMat(numberTexture(n, hex)), flat],
			ink: outlineMat(0),
		};
	}, [n, color, hex]);
	const t = 0.02;
	return (
		<group position={[x, h / 2, 0]}>
			<mesh material={mats.body}>
				<boxGeometry args={[w, h, 1.4]} />
			</mesh>
			<mesh
				material={mats.ink}
				scale={[1 + (2 * t) / w, 1 + (2 * t) / h, 1 + (2 * t) / 1.4]}
			>
				<boxGeometry args={[w, h, 1.4]} />
			</mesh>
		</group>
	);
}

function starShape() {
	const s = new THREE.Shape();
	for (let i = 0; i < 10; i++) {
		const a = (i / 10) * Math.PI * 2 + Math.PI / 2;
		const r = i % 2 ? 0.05 : 0.12;
		i
			? s.lineTo(Math.cos(a) * r, Math.sin(a) * r)
			: s.moveTo(Math.cos(a) * r, Math.sin(a) * r);
	}
	return new THREE.ShapeGeometry(s);
}

function Confetti() {
	const drops = useRef<THREE.InstancedMesh>(null);
	const stars = useRef<THREE.InstancedMesh>(null);
	const geo = useMemo(
		() => ({ drop: new THREE.CircleGeometry(0.08, 16), star: starShape() }),
		[]
	);
	const seeds = useMemo(
		() =>
			Array.from({ length: 70 }, (_, i) => ({
				v: new THREE.Vector3(
					(Math.random() - 0.5) * 5,
					4 + Math.random() * 4.5,
					(Math.random() - 0.5) * 2.5
				),
				spin: (Math.random() - 0.5) * 14,
				star: i % 3 === 0,
			})),
		[]
	);
	const dummy = useMemo(() => new THREE.Object3D(), []);
	useEffect(() => {
		const soups = [C.tomato, C.pumpkin, C.corn, C.pea, C.beet];
		let d = 0;
		seeds.forEach(s => {
			if (!s.star)
				drops.current!.setColorAt(d++, new THREE.Color(...soups[d % soups.length]));
		});
		drops.current!.instanceColor!.needsUpdate = true;
	}, [seeds]);
	useFrame(() => {
		const tc = (director.G - 4.76) * 8;
		const on = !reduced && tc > 0 && tc < 3.2;
		drops.current!.visible = stars.current!.visible = on;
		if (!on) return;
		let d = 0;
		let s = 0;
		for (const seed of seeds) {
			dummy.position.set(
				seed.v.x * tc,
				1.6 + seed.v.y * tc - 4.9 * tc * tc,
				seed.v.z * tc + 0.6
			);
			dummy.rotation.set(0, 0, seed.spin * tc);
			dummy.updateMatrix();
			if (seed.star) stars.current!.setMatrixAt(s++, dummy.matrix);
			else drops.current!.setMatrixAt(d++, dummy.matrix);
		}
		drops.current!.instanceMatrix.needsUpdate = true;
		stars.current!.instanceMatrix.needsUpdate = true;
	});
	const nStars = seeds.filter(s => s.star).length;
	return (
		<>
			<instancedMesh ref={drops} args={[geo.drop, undefined, seeds.length - nStars]}>
				<meshBasicMaterial toneMapped={false} side={THREE.DoubleSide} />
			</instancedMesh>
			<instancedMesh ref={stars} args={[geo.star, undefined, nStars]}>
				<meshBasicMaterial
					color={new THREE.Color(...C.star)}
					toneMapped={false}
					side={THREE.DoubleSide}
				/>
			</instancedMesh>
		</>
	);
}

// ---------------------------------------------------------------- the world

export function World({
	podiumCount,
	onReady,
}: {
	podiumCount: number;
	onReady: () => void;
}) {
	const gl = useThree(s => s.gl);
	const [labels, setLabels] = useState<Labels | null>(null);
	useEffect(() => {
		makeLabels(gl).then(setLabels);
	}, [gl]);

	const mats = useMemo(
		() => ({
			stream: flatMat(C.tomato),
			streamLine: outlineMat(0.012),
			plinth: flatMat(C.sheet, [0.79, 0.72, 0.62], 0.95),
			plinthLine: outlineMat(0.016),
		}),
		[]
	);

	const r = {
		bowl: useRef<THREE.Group>(null),
		ring: [
			useRef<THREE.Group>(null),
			useRef<THREE.Group>(null),
			useRef<THREE.Group>(null),
		],
		brick: useRef<THREE.Group>(null),
		stream: useRef<THREE.Group>(null),
		plinth: useRef<THREE.Group>(null),
		podium: useRef<THREE.Group>(null),
		first: useRef<THREE.Group>(null),
		second: useRef<THREE.Group>(null),
		third: useRef<THREE.Group>(null),
	};
	const tmp = useMemo(
		() => ({ mouth: new THREE.Vector3(), up: new THREE.Vector3(0, 1, 0) }),
		[]
	);

	const told = useRef(false);
	useFrame(state => {
		if (!told.current) {
			told.current = true;
			onReady();
		}
		const G = director.G;
		const { width: W, height: H } = state.size;
		const wide = W / H > 1.1;
		const cam = state.camera as THREE.PerspectiveCamera;

		// ---- camera, with the light turning with it so the side we look at is lit
		const c = cameraAt(G);
		const settle = easeInOut(director.settle);
		const pre = G < 1.06;
		const blend = smooth(1.0, 1.06, G);
		const top = {
			az: 0,
			el: lerp(89.5, 66, settle),
			d: lerp(15, 13.8, settle),
			t: [0, lerp(0.92, 0.75, settle), 0],
		};
		const azDeg = pre ? lerp(top.az, c.az, blend) : c.az;
		const az = THREE.MathUtils.degToRad(azDeg);
		const el = THREE.MathUtils.degToRad(pre ? lerp(top.el, c.el, blend) : c.el);
		const k = Math.max(1, 0.95 / (W / H));
		const d = (pre ? lerp(top.d, c.d, blend) : c.d) * k;
		const t = pre ? top.t : c.t;
		cam.position.set(
			t[0] + d * Math.cos(el) * Math.sin(az),
			t[1] + d * Math.sin(el),
			t[2] + d * Math.cos(el) * Math.cos(az)
		);
		cam.lookAt(t[0], t[1], t[2]);
		cam.setViewOffset(
			W,
			H,
			wide ? -0.22 * W * settle : 0,
			wide ? 0 : 0.2 * H * settle,
			W,
			H
		);
		cam.updateProjectionMatrix();
		LIGHT.copy(BASE_LIGHT).applyAxisAngle(Y, az).normalize();

		// ---- bowl: scene 1, back in scene 5
		const bowl = r.bowl.current!;
		const out1 = smooth(1.84, 1.98, G);
		const in5 = smooth(5.06, 5.2, G) * (1 - smooth(5.9, 6.0, G));
		bowl.visible = G < 2 || in5 > 0.001;
		bowl.position.set(G < 3 ? -7 * out1 : 0, G < 3 ? 0 : lerp(-5, 0, in5), 0);

		// ---- the ring of packs in scene 2
		const ringIn = smooth(1.86, 2.04, G);
		const ringOut = smooth(2.9, 3.04, G);
		const s3 = clamp((G - 2.08) / 0.76) * 3;
		const step = Math.min(Math.floor(s3), 3);
		const f = s3 - step;
		const e = f < 0.45 ? 0 : (f - 0.45) / 0.55;
		const kf = Math.min(step + e * e * (3 - 2 * e), 3);
		const ringX = lerp(9, 0, ringIn);
		// On a phone the tray, the widest, would touch the edges.
		const scales = [wide ? 1.05 : 0.82, 0.95, 1.35];
		r.ring.forEach((ref, i) => {
			const g = ref.current;
			if (!g) return;
			const ang = (i - kf) * (Math.PI / 2);
			const front = Math.max(0, 1 - Math.abs(ang) / (Math.PI / 2));
			g.visible = G > 1.84 && G < 3.1 && Math.abs(ang) < 2.2;
			g.position.set(
				Math.sin(ang) * R + ringX,
				-ringOut * 4,
				Math.cos(ang) * R + RING_Z
			);
			g.rotation.set(0, ang * 0.75 - 0.18 * front, 0);
			g.scale.setScalar(scales[i] * (0.6 + 0.55 * front) * (1 - ringOut * 0.5));
		});

		// ---- the brick: on the ring, then the hero of scenes 3 to 5
		const brick = r.brick.current;
		if (brick) {
			brick.visible = G > 1.84 && G < 5.96;
			const ang = (3 - kf) * (Math.PI / 2);
			const front = Math.max(0, 1 - Math.abs(ang) / (Math.PI / 2));
			const toCentre = smooth(2.9, 3.04, G);
			const onRing = new THREE.Vector3(
				Math.sin(ang) * R + ringX,
				0,
				Math.cos(ang) * R + RING_Z
			);
			const pos = onRing.lerp(new THREE.Vector3(0, 0, 0), toCentre);
			const sc = lerp(1.05 * (0.6 + 0.55 * front), 1, toCentre);
			let sX = sc,
				sY = sc,
				sZ = sc;
			let rotZ = 0;
			let rotY = (ang * 0.75 - 0.18 * front) * (1 - toCentre);
			// Scene 4: the brick stands still and takes the verdict as a stamp (stamp.tsx); with
			// five stars it jumps onto the plinth.
			if (G >= 4 && G < 5) {
				const jump = smooth(4.74, 4.8, G) * (1 - smooth(4.8, 4.9, G));
				pos.y += jump * 0.4;
			}
			const plinthUp = smooth(4.74, 4.84, G) * (1 - smooth(4.94, 5.0, G));
			const plinth = r.plinth.current!;
			plinth.visible = plinthUp > 0.001;
			plinth.scale.set(1, Math.max(plinthUp, 0.001), 1);
			if (G >= 4 && G < 5) pos.y += plinthUp * 0.4;
			const up = smooth(5.16, 5.28, G);
			const over = smooth(5.28, 5.4, G);
			const tip = smooth(5.4, 5.52, G) * (1 - smooth(5.86, 5.94, G));
			if (G >= 5) {
				const aside = smooth(5.0, 5.1, G);
				pos.set(lerp(lerp(0, -2.4, aside), -1.3, over), lerp(0, 2.1, up), 0);
				rotZ = -tip * 1.9 + Math.sin(up * Math.PI) * 0.08;
				rotY = 0;
				sX = sY = sZ = 1;
			}
			brick.position.copy(pos);
			brick.rotation.set(0, rotY, rotZ);
			brick.scale.set(sX, sY, sZ);

			// ---- the stream, from the brick's cap down to the soup
			const flow = smooth(5.5, 5.58, G) * (1 - smooth(5.82, 5.9, G));
			const stream = r.stream.current!;
			stream.visible = flow > 0.001;
			pour.on = flow;
			if (flow > 0.001) {
				brick.updateMatrixWorld();
				tmp.mouth.set(0, BRICK.h + 0.05, BRICK.d * 0.27);
				brick.localToWorld(tmp.mouth);
				const surface = lerp(0.48, 0.9, smooth(5.52, 5.86, G));
				const len = Math.max(tmp.mouth.y - surface, 0.05) * flow;
				stream.position.set(tmp.mouth.x, tmp.mouth.y - len / 2, tmp.mouth.z);
				stream.scale.set(1, len, 1);
				pour.at.set(
					clamp(tmp.mouth.x / 2.02 + 0.5, 0.15, 0.85),
					clamp(-tmp.mouth.z / 2.02 + 0.5, 0.15, 0.85)
				);
			}
		}

		// ---- the podium
		const pod = r.podium.current!;
		const podIn = smooth(6.0, 6.1, G) * (1 - smooth(6.92, 7.0, G));
		pod.visible = podIn > 0.001;
		pod.position.y = lerp(-4, 0, podIn);
		const second = smooth(6.12, 6.24, G);
		r.second.current!.position.y = 0.9 + lerp(3, 0, second);
		r.second.current!.visible = second > 0.001 && podiumCount >= 2;
		const firstT = clamp((G - 6.26) / 0.16);
		const bounce =
			firstT < 1 ? Math.abs(Math.cos(firstT * Math.PI * 1.5)) * (1 - firstT) : 0;
		r.first.current!.position.y = 1.2 + (firstT === 0 ? 6 : bounce * 2.2);
		r.first.current!.visible = G > 6.26 && podiumCount >= 1;
		const third = smooth(6.44, 6.56, G);
		r.third.current!.position.y = 0.6 + lerp(3, 0, third);
		r.third.current!.visible = third > 0.001 && podiumCount >= 3;
	});

	return (
		<>
			<group ref={r.bowl}>
				<SoupBowl />
			</group>

			{labels && (
				<>
					<group ref={r.ring[0]}>
						<TrayPack labels={labels.vaschetta} />
					</group>
					<group ref={r.ring[1]}>
						<PouchPack labels={labels.busta} />
					</group>
					<group ref={r.ring[2]}>
						<JarPack labels={labels.vasetto} />
					</group>
					<group ref={r.brick}>
						<BrickPack labels={labels.brick} />
						<Stamp />
					</group>
				</>
			)}

			<group ref={r.stream}>
				<mesh material={mats.stream}>
					<cylinderGeometry args={[0.07, 0.085, 1, 16]} />
				</mesh>
				<mesh material={mats.streamLine}>
					<cylinderGeometry args={[0.07, 0.085, 1, 16]} />
				</mesh>
			</group>

			<group ref={r.plinth}>
				<mesh material={mats.plinth}>
					<cylinderGeometry args={[0.55, 0.6, 0.8, 48]} />
				</mesh>
				<mesh material={mats.plinthLine}>
					<cylinderGeometry args={[0.55, 0.6, 0.8, 48]} />
				</mesh>
			</group>

			<Confetti />

			<group ref={r.podium} scale={0.75}>
				<Step n={1} w={1.8} h={1.2} color={C.corn} hex="#ffc93c" x={0} />
				<Step n={2} w={1.8} h={0.9} color={C.sheet} hex="#f8f2ea" x={-1.9} />
				<Step n={3} w={1.8} h={0.6} color={C.pumpkin} hex="#ff6a13" x={1.9} />
				{labels && (
					<>
						<group ref={r.first} position={[0, 1.2, 0]} scale={0.85}>
							<TrayPack labels={labels.vaschetta} />
						</group>
						<group ref={r.second} position={[-1.9, 0.9, 0]} scale={0.8}>
							<PouchPack labels={labels.busta} />
						</group>
						<group ref={r.third} position={[1.9, 0.6, 0]} scale={1.1}>
							<JarPack labels={labels.vasetto} />
						</group>
					</>
				)}
				{!labels && (
					<>
						<group ref={r.first} />
						<group ref={r.second} />
						<group ref={r.third} />
					</>
				)}
			</group>
		</>
	);
}
