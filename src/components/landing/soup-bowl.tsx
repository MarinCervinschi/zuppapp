import { useEffect, useMemo, useRef } from "react";

import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

import {
	PLAIN_VERT,
	SHADOW_FRAG,
	SOUP_FRAG,
	SOUP_VERT,
	bowlGeometry,
	spoonParts,
} from "./bowl-parts";
import { LIGHT, boil, flatMat, outlineMat } from "./packs/materials";
import { C, GLAZE_LIT, SPOON_SHADE } from "./palette";
import { SIM_SIZE, STEP_DT, SoupSim, makeSpiral } from "./soup-sim";
import { clamp, director, lerp, reduced, smooth } from "./story";
import { BOWL } from "./story";

// The bowl of the icon, full of soup and driven by the story: the swirl draws in
// the preloader, the spoon stirs in scene 1, and in scene 5 the bowl comes back empty and the
// brick fills it with tomato soup. `pour` is written by the world while the brick pours.
// The soup behaves as a velvet soup does (ricerca/13): waves run at their real speed and short
// ones die at once, the spoon pushes a bulge ahead and leaves a hollow behind, the whole surface
// sloshes at 2.4 Hz two or three times and stops. The visitor's mouse stirs it; a tap on a phone
// pokes it and leaves a dab of cream.

export const pour = { on: 0, at: new THREE.Vector2(0.55, 0.5) };

/** Where the soup is in the world, for the steam that rises from it (steam.tsx). */
export const soupState = {
	at: new THREE.Vector3(),
	level: BOWL.soupY,
	radius: BOWL.soupRadius,
	/** 0..1: how hot it reads. Scene 1 only for now: the brick's soup is not hot (ricerca/13). */
	heat: 0,
	spoon: new THREE.Vector3(),
	/** The spoon's handle direction, from the tip up, in the world. */
	spoonDir: new THREE.Vector3(0, 1, 0),
	spoonIn: 0,
	/** A drop that has just landed (drops.tsx): where in uv, how wide, consumed on the next step. */
	kick: { uv: new THREE.Vector2(), radius: 0, pending: false },
	/** The shadow of a falling drop on the surface: uv, radius, strength (drops.tsx). */
	dropShadow: new THREE.Vector4(),
	/** The corn a landed drop leaves, spreading for a moment: uv and radius, 0 when idle. */
	dye: new THREE.Vector3(),
	/** Its edge's wobble, different for every drop. */
	dyeSeed: 0,
};

const v3 = (c: readonly number[]) => new THREE.Vector3(c[0], c[1], c[2]);

const UP = new THREE.Vector3(0, 1, 0);
/** The bowl's lowest sloshing mode: 2.4 Hz for a 13 cm bowl, damped to two or three swings. */
const SLOSH = { omega: 2 * Math.PI * 2.4, zeta: 0.12, max: 0.06 };

/** The bowl's inner radius at a height, read off the lathe profile (scaled 1.25 in y). */
function innerRadius(y: number) {
	const pts: [number, number][] = [
		[0.38, 0.32],
		[0.7, 0.42],
		[0.9, 0.6],
		[1.0, 0.74],
		[1.06, 0.82],
	];
	const yy = y / 1.25;
	for (let i = 0; i < pts.length - 1; i++) {
		const [r0, y0] = pts[i];
		const [r1, y1] = pts[i + 1];
		if (yy <= y1) return lerp(r0, r1, clamp((yy - y0) / (y1 - y0)));
	}
	return 1.06;
}

export function SoupBowl() {
	const gl = useThree(s => s.gl);
	const spiral = useMemo(() => makeSpiral(), []);
	const sim = useMemo(() => new SoupSim(spiral.texture), [spiral]);
	useEffect(() => {
		sim.clear(gl);
		return () => sim.dispose();
	}, [gl, sim]);

	const bowl = useMemo(bowlGeometry, []);
	const spoon = useMemo(spoonParts, []);
	const m = useMemo(() => {
		const soup = new THREE.ShaderMaterial({
			vertexShader: SOUP_VERT,
			fragmentShader: SOUP_FRAG,
			uniforms: {
				uSim: { value: sim.texture },
				uTexel: { value: new THREE.Vector2(1 / SIM_SIZE, 1 / SIM_SIZE) },
				uAmp: { value: 6 },
				uSlope: { value: 520 },
				uSoup: { value: v3(C.pumpkin) },
				uSoupShade: { value: v3(C.tomato) },
				uCream: { value: v3(C.sheet) },
				uCreamShade: { value: v3(C.paper) },
				uHigh: { value: new THREE.Vector3(1, 0.98, 0.94) },
				uLight: { value: LIGHT },
				uDropShadow: { value: soupState.dropShadow },
				uCorn: { value: v3(C.corn) },
				uCornShade: { value: v3(C.corn.map((c, i) => c * [0.93, 0.78, 0.62][i])) },
			},
		});
		const shadow = new THREE.ShaderMaterial({
			vertexShader: PLAIN_VERT,
			fragmentShader: SHADOW_FRAG,
			transparent: true,
			depthWrite: false,
			uniforms: {
				uColor: { value: v3(C.paper.map((p, i) => p * 0.82 + C.ink[i] * 0.18)) },
				uCentre: { value: new THREE.Vector2(0.38, 0.32) },
			},
		});
		return {
			soup,
			shadow,
			glaze: flatMat(GLAZE_LIT, C.ink, 0.9),
			cream: flatMat(C.sheet, SPOON_SHADE, 0.93),
			line: outlineMat(0.02),
			lineSpoon: outlineMat(0.018),
		};
	}, [sim]);

	const soupMesh = useRef<THREE.Mesh>(null);
	const spoonGroup = useRef<THREE.Group>(null);
	const root = useRef<THREE.Group>(null);
	const tools = useMemo(
		() => ({
			ray: new THREE.Raycaster(),
			plane: new THREE.Plane(),
			hit: new THREE.Vector3(),
			at: new THREE.Vector3(),
			v: new THREE.Vector3(),
			ndc: new THREE.Vector2(),
			hand: new THREE.Vector2(-1, -1),
			handVel: new THREE.Vector2(),
			handFlow: new THREE.Vector2(),
			tiltBase: new THREE.Quaternion().setFromAxisAngle(
				new THREE.Vector3(1, 0, 0),
				-Math.PI / 2
			),
			tiltQ: new THREE.Quaternion(),
			tiltE: new THREE.Euler(),
		}),
		[]
	);
	const st = useRef({
		tip: new THREE.Vector2(0.5, 0.5),
		zone: 1,
		redraw: 0,
		after: 0.3,
		acc: 0,
		spoonVel: new THREE.Vector2(),
		tilt: new THREE.Vector2(),
		tiltVel: new THREE.Vector2(),
		bowlX: 0,
		bowlVx: 0,
	});

	useFrame((state, dt) => {
		const G = director.G;
		const s = st.current;
		const u = sim.material.uniforms;

		// Scene 1 and scene 5 are two different soups in the same bowl: wipe it between them.
		const zone = G < 3 ? 1 : 5;
		if (zone !== s.zone) {
			sim.clear(state.gl);
			s.zone = zone;
			if (zone === 1) s.redraw = 0.3;
		}
		const tomato = zone === 5;
		(m.soup.uniforms.uSoup.value as THREE.Vector3).copy(
			v3(tomato ? C.tomato : C.pumpkin)
		);
		(m.soup.uniforms.uSoupShade.value as THREE.Vector3).copy(
			v3(tomato ? [0.78, 0.17, 0.05] : C.tomato)
		);

		// The swirl: drawn by the preloader (and a moment more, so its end sets), or drawn again
		// whole when we come back up from scene 5.
		if (zone === 1 && director.swirl < 1) {
			spiral.draw(director.swirl);
			u.uSpiralGain.value = 1;
		} else if (zone === 1 && s.after > 0) {
			spiral.draw(1);
			u.uSpiralGain.value = 1;
			s.after -= dt;
		} else if (zone === 1 && s.redraw > 0) {
			spiral.draw(1);
			u.uSpiralGain.value = 1;
			s.redraw -= dt;
		} else {
			u.uSpiralGain.value = 0;
		}

		// Soup level: full in scene 1; in scene 5 it rises from the bottom as the brick pours.
		const level =
			zone === 1 ? BOWL.soupY : lerp(0.48, BOWL.soupY - 0.02, smooth(5.52, 5.86, G));
		const soup = soupMesh.current!;
		soup.position.y = level;
		soup.scale.setScalar(innerRadius(level) / BOWL.soupRadius);
		soup.visible = zone === 1 || G > 5.5;

		// The spoon in scene 1.
		const present = smooth(1.3, 1.38, G) * (1 - smooth(1.8, 1.88, G));
		const stir = clamp((G - 1.34) / 0.48);
		const a = stir * Math.PI * 2 * 2.5 + Math.PI * 0.2;
		const r = 0.21 + 0.06 * Math.sin(a * 0.5);
		const tipX = 0.5 + r * Math.cos(a);
		const tipY = 0.5 + r * Math.sin(a);
		const step = Math.max(dt, 1e-3);
		const travel = new THREE.Vector2(tipX - s.tip.x, tipY - s.tip.y);
		s.tip.set(tipX, tipY);
		const spoonVel = travel.clone().divideScalar(step);
		const spoonAcc = spoonVel.clone().sub(s.spoonVel).divideScalar(step);
		s.spoonVel.copy(spoonVel);
		const dipped = zone === 1 ? smooth(0.85, 1, present) : 0;
		u.uSpoon.value.set(tipX, tipY, spoonVel.x, spoonVel.y);
		u.uSpoonIn.value = dipped;
		u.uFlowSpoon.value.copy(travel);
		const g = spoonGroup.current!;
		g.visible = present > 0.001;
		const wx = (tipX - 0.5) * BOWL.soupRadius * 2;
		const wz = -(tipY - 0.5) * BOWL.soupRadius * 2;
		g.position.set(wx, BOWL.soupY - 0.02 + (1 - present) * 3.2, wz);
		const out = new THREE.Vector2(wx, wz);
		if (out.lengthSq() < 1e-4) out.set(1, 0);
		out.normalize();
		g.quaternion.setFromUnitVectors(
			new THREE.Vector3(0, 1, 0),
			new THREE.Vector3(out.x * 0.62, 0.78, out.y * 0.62).normalize()
		);

		// The pour: the stream hits the surface and keeps it trembling.
		const t = state.clock.elapsedTime;
		u.uPointer.value.set(
			pour.at.x,
			pour.at.y,
			Math.sin(t * 31) * 0.6,
			Math.cos(t * 27) * 0.6
		);
		u.uPointerIn.value = pour.on;

		const cam = state.camera;
		const bowlRoot = root.current!;
		bowlRoot.getWorldPosition(tools.at);
		const soupY = tools.at.y + level;
		const R = innerRadius(level);
		const pointer = director.pointer;
		soupState.at.copy(tools.at);
		soupState.level = level;
		soupState.radius = R;
		soupState.heat = zone === 1 && soup.visible ? director.settle : 0;
		soupState.spoon.set(tools.at.x + wx, soupY, tools.at.z + wz);
		soupState.spoonIn = present;
		soupState.spoonDir.set(0, 1, 0).applyQuaternion(g.quaternion);

		// ---- the visitor's hand: the mouse stirs the soup, a tap pokes it and leaves cream
		tools.plane.set(UP, -soupY);
		tools.ndc.set(pointer.x, pointer.y);
		tools.ray.setFromCamera(tools.ndc, cam);
		let inside = false;
		const hand = new THREE.Vector2(-1, -1);
		if (soup.visible && tools.ray.ray.intersectPlane(tools.plane, tools.hit)) {
			hand.set(
				(tools.hit.x - tools.at.x) / (2 * R) + 0.5,
				-(tools.hit.z - tools.at.z) / (2 * R) + 0.5
			);
			inside = Math.hypot(hand.x - 0.5, hand.y - 0.5) < 0.48;
		}
		const handIn = pointer.on && inside && tools.hand.x >= 0;
		tools.handFlow.set(0, 0);
		const handAcc = new THREE.Vector2();
		if (handIn) {
			tools.handFlow.set(hand.x - tools.hand.x, hand.y - tools.hand.y);
			const v = tools.handFlow.clone().divideScalar(step);
			handAcc.copy(v).sub(tools.handVel).divideScalar(step);
			tools.handVel.copy(v);
		} else tools.handVel.set(0, 0);
		u.uHand.value.set(hand.x, hand.y, tools.handVel.x, tools.handVel.y);
		u.uHandIn.value = handIn ? 1 : 0;
		u.uFlowHand.value.copy(tools.handFlow);
		tools.hand.copy(inside ? hand : new THREE.Vector2(-1, -1));
		const dot = u.uDot.value as THREE.Vector3;
		dot.z = 0;
		let poke = 0;
		if (pointer.tap) {
			pointer.tap = false;
			if (inside) {
				dot.set(hand.x, hand.y, 0.04);
				poke = 1;
			}
		}

		// ---- the slosh: the whole surface tilts and swings back, a spring outside the grid,
		// pushed by what accelerates against the soup (the spoon, the hand, the bowl sliding away).
		const bowlVx = (tools.at.x - s.bowlX) / step;
		const bowlAx = (bowlVx - s.bowlVx) / step;
		s.bowlX = tools.at.x;
		s.bowlVx = bowlVx;
		// A push is a change of the tilt's speed: proportional to the acceleration and to the time.
		const kick = new THREE.Vector2()
			.addScaledVector(spoonAcc, -0.0016 * dipped)
			.addScaledVector(handAcc, handIn ? -0.0012 : 0);
		kick.x -= bowlAx * 0.0009;
		kick.multiplyScalar(Math.min(dt, 0.05));
		if (poke)
			kick.add(new THREE.Vector2(hand.x - 0.5, hand.y - 0.5).multiplyScalar(-0.5));
		if (!reduced) s.tiltVel.add(kick);
		const { omega, zeta, max } = SLOSH;
		const span = Math.min(dt, 0.05);
		const sub = Math.max(1, Math.ceil(span * 240));
		const h = span / sub;
		for (let i = 0; i < sub; i++) {
			s.tiltVel.x += (-omega * omega * s.tilt.x - 2 * zeta * omega * s.tiltVel.x) * h;
			s.tiltVel.y += (-omega * omega * s.tilt.y - 2 * zeta * omega * s.tiltVel.y) * h;
			s.tilt.x = clamp(s.tilt.x + s.tiltVel.x * h, -max, max);
			s.tilt.y = clamp(s.tilt.y + s.tiltVel.y * h, -max, max);
		}
		// Tilting towards +u raises the soup on that side: a turn about the bowl's z axis.
		tools.tiltE.set(s.tilt.y, 0, -s.tilt.x);
		tools.tiltQ.setFromEuler(tools.tiltE);
		soup.quaternion.copy(tools.tiltQ).multiply(tools.tiltBase);

		// ---- the surface, at a fixed step whatever the screen: 640 a second. The cream is carried
		// on the first three steps of the frame, a third of the frame's travel each.
		s.acc = Math.min(s.acc + Math.min(dt, 1 / 20), 40 * STEP_DT);
		(u.uDye.value as THREE.Vector3).copy(soupState.dye);
		u.uDyeSeed.value = soupState.dyeSeed;
		const landing = u.uKick.value as THREE.Vector4;
		landing.z = 0;
		if (soupState.kick.pending) {
			soupState.kick.pending = false;
			landing.set(
				soupState.kick.uv.x,
				soupState.kick.uv.y,
				-0.012,
				soupState.kick.radius
			);
		}
		let n = 0;
		while (s.acc >= STEP_DT) {
			s.acc -= STEP_DT;
			u.uAdvect.value = n < 3 ? 1 : 0;
			sim.step(state.gl);
			if (n === 0) {
				dot.z = 0;
				landing.z = 0;
			}
			n++;
		}
		m.soup.uniforms.uSim.value = sim.texture;
		boil.value = reduced ? 0 : Math.floor(t * 8);
	});

	return (
		<group ref={root}>
			<mesh
				rotation-x={-Math.PI / 2}
				position-y={0.002}
				material={m.shadow}
				renderOrder={-1}
			>
				<planeGeometry args={[7, 7]} />
			</mesh>
			<mesh geometry={bowl} material={m.glaze} />
			<mesh geometry={bowl} material={m.line} />
			<mesh
				ref={soupMesh}
				rotation-x={-Math.PI / 2}
				position-y={BOWL.soupY}
				material={m.soup}
			>
				<planeGeometry args={[BOWL.soupRadius * 2, BOWL.soupRadius * 2, 160, 160]} />
			</mesh>
			<group ref={spoonGroup}>
				<mesh geometry={spoon.head} material={m.cream} />
				<mesh geometry={spoon.neck} material={m.cream} />
				<mesh geometry={spoon.head} material={m.lineSpoon} />
				<mesh geometry={spoon.neck} material={m.lineSpoon} />
			</group>
		</group>
	);
}
