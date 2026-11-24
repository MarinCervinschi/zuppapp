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
import { SIM_SIZE, SoupSim, makeSpiral } from "./soup-sim";
import { clamp, director, lerp, reduced, smooth } from "./story";
import { BOWL } from "./story";

// The bowl of the icon, full of soup and driven by the story: the swirl draws in
// the preloader, the spoon stirs in scene 1, and in scene 5 the bowl comes back empty and the
// brick fills it with tomato soup. `pour` is written by the world while the brick pours.

export const pour = { on: 0, at: new THREE.Vector2(0.55, 0.5) };

const v3 = (c: readonly number[]) => new THREE.Vector3(c[0], c[1], c[2]);

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
	const st = useRef({
		tip: new THREE.Vector2(0.5, 0.5),
		zone: 1,
		redraw: 0,
		after: 0.3,
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
		const vel = new THREE.Vector2(tipX - s.tip.x, tipY - s.tip.y);
		s.tip.set(tipX, tipY);
		const dipped = zone === 1 ? smooth(0.85, 1, present) : 0;
		u.uSpoon.value.set(tipX, tipY, vel.x / 2, vel.y / 2);
		u.uSpoonIn.value = dipped;
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
			Math.sin(t * 31) * 0.01,
			Math.cos(t * 27) * 0.01
		);
		u.uPointerIn.value = pour.on;

		sim.step(state.gl);
		sim.step(state.gl);
		m.soup.uniforms.uSim.value = sim.texture;
		boil.value = reduced ? 0 : Math.floor(t * 8);
	});

	return (
		<group>
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
