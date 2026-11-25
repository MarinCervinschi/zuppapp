import { useEffect, useMemo } from "react";

import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

import { auroraMask } from "./aurora";
import { bowlGeometry } from "./bowl-parts";
import { C } from "./palette";
import { soupState } from "./soup-bowl";
import { director, reduced } from "./story";
import { themed } from "./theme";

// The steam over the soup, after footage of steam over cups and bowls (ricerca/15) and the
// measurements over an espresso (ricerca/13): indoor steam is tongues and folds, not round puffs
// and not threads of constant width. A tongue is a streakline: every bit of air that left one spot
// of the surface while that spot was "on" (0.4-1 s). The air rises slowly and then faster,
// v(h) = 1.25 (1 - e^(-h/0.63)) units/s (1 unit is 6.4 cm), converges towards the axis low down,
// curls into a half turn a few centimetres up, and is carried by any air that moves: the pointer
// is a breath, the spoon cuts through it, and when the bowl slides away the steam stays behind.
//
// How it is drawn: no outline and no tremble. Steam adds light to what is behind it, so it is an
// overprint towards the paper colour in two flat levels, veil and fold, as strong as the ground
// allows: on the black glaze it reads, on the bright soup it is left out (the real change there is
// under 3%, and drawn it only made blotches). Beyond the bowl it goes on, as a declared licence, so
// a tongue is never cut by the bowl's outline: a paler sheet on the paper, a light overprint on
// the aurora. Seen from above (66°) that leaves the crescent of the far wall and the tongues that
// climb over the far rim; as the camera comes down to 32° the steam shows its profile. The shapes are drawn 12 times a second; the motion is computed every frame; a threshold
// with hysteresis keeps a pixel from flickering, and thin parts wear through on the brand's
// stipple grid as they die.

const MAX_SEGMENTS = 220;
const DRAWN_FPS = 12;
const EMIT_EVERY = 1 / 30;
/** How fast a bit of steam thins out: between a dry room (0.7 s) and a humid one (1.3 s) the
 * footage shows tongues reaching 8-10 cm, which at the measured rise takes about 2 s. */
const DECAY = 1.5;
/** The longest link between two puffs of one tongue: about a centimetre. */
const MAX_LINK = 0.15;

type Particle = {
	pos: THREE.Vector3;
	age: number;
	life: number;
	seed: number;
};
type Emitter = {
	at: THREE.Vector3;
	on: number;
	next: number;
	particles: Particle[];
	curl: null | {
		centre: THREE.Vector3;
		lat: THREE.Vector3;
		omega: number;
		left: number;
	};
	curlAt: number;
};

const UP = new THREE.Vector3(0, 1, 0);

/** The rise of the plume, measured on a coffee cup's chimogram, with a floor near the surface. */
const rise = (h: number) => Math.max(0.35, 1.25 * (1 - Math.exp(-h / 0.63)));

const SEG_VERT = /* glsl */ `
attribute vec4 aA;      // xyz start, w radius (world)
attribute vec4 aB;      // xyz end, w radius
attribute vec4 aD;      // density at start, at end, start cap, end cap
uniform float uAspect;
varying vec2 vP;
varying vec2 vA;
varying vec2 vB;
varying vec2 vR;
varying vec4 vD;
void main() {
	vec4 ca = projectionMatrix * viewMatrix * vec4(aA.xyz, 1.0);
	vec4 cb = projectionMatrix * viewMatrix * vec4(aB.xyz, 1.0);
	// Screen space with square units: x scaled by the aspect.
	vec2 a = ca.xy / ca.w * vec2(uAspect, 1.0);
	vec2 b = cb.xy / cb.w * vec2(uAspect, 1.0);
	float ra = aA.w * projectionMatrix[1][1] / ca.w;
	float rb = aB.w * projectionMatrix[1][1] / cb.w;
	vec2 d = b - a;
	float len = length(d);
	vec2 dir = len > 1e-5 ? d / len : vec2(0.0, 1.0);
	vec2 nrm = vec2(-dir.y, dir.x);
	float r = max(ra, rb);
	// A quad around the segment, grown by the radius on every side.
	vec2 p = mix(a, b, position.x + 0.5) + dir * position.x * 2.0 * r + nrm * position.y * 2.0 * r;
	vP = p;
	vA = a;
	vB = b;
	vR = vec2(ra, rb);
	vD = aD;
	float z = mix(ca.z / ca.w, cb.z / cb.w, position.x + 0.5);
	gl_Position = vec4(p.x / uAspect, p.y, z, 1.0);
}`;

// The density of one stretch of a tongue: highest on its axis, nothing at its edge. Each stretch
// covers only its own length (no caps between neighbours), so where the tongue overlaps itself,
// in the curl and the folds, the densities add up and the fold appears on its own.
const SEG_FRAG = /* glsl */ `
varying vec2 vP;
varying vec2 vA;
varying vec2 vB;
varying vec2 vR;
varying vec4 vD;
void main() {
	vec2 ba = vB - vA;
	float h = dot(vP - vA, ba) / max(dot(ba, ba), 1e-9);
	if (h < 0.0 && vD.z < 0.5) discard;
	if (h > 1.0 && vD.w < 0.5) discard;
	float hc = clamp(h, 0.0, 1.0);
	float dist = length(vP - (vA + ba * hc));
	float r = mix(vR.x, vR.y, hc);
	float d = mix(vD.x, vD.y, hc) * clamp(1.0 - dist / max(r, 1e-6), 0.0, 1.0);
	if (d <= 0.0) discard;
	gl_FragColor = vec4(d, 0.0, 0.0, 0.0);
}`;

const QUAD_VERT = /* glsl */ `
varying vec2 vUv;
void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`;

// The drawing: veil above a threshold, fold above 1.6 times it, each with hysteresis against the
// previous drawing, and a threshold that wobbles on the brand's fixed stipple grid so that thin,
// old parts wear through instead of fading.
const LEVEL_FRAG = /* glsl */ `
uniform sampler2D uDensity;
uniform sampler2D uPrev;
varying vec2 vUv;
float hash(vec2 p) {
	p = fract(p * vec2(234.34, 435.345));
	p += dot(p, p + 34.23);
	return fract(p.x * p.y);
}
void main() {
	float d = texture2D(uDensity, vUv).r;
	vec2 prev = texture2D(uPrev, vUv).rg;
	float grain = hash(floor(gl_FragCoord.xy / 2.0));
	float s = 0.25 + (grain - 0.5) * 0.16;
	float veil = prev.r > 0.5 ? step(s - 0.04, d) : step(s + 0.04, d);
	float fold = prev.g > 0.5 ? step(1.6 * s - 0.04, d) : step(1.6 * s + 0.04, d);
	gl_FragColor = vec4(veil, fold * veil, 0.0, 1.0);
}`;

// The overprint on the scene: a lighter sheet over whatever is behind, at a cover set by that
// ground. The edge is decided here, at full resolution, from the smooth density, so it never
// steps; the half-resolution levels only say which side of the hysteresis each part was on.
const OVER_FRAG = /* glsl */ `
uniform sampler2D uLevel;
uniform sampler2D uGround;
uniform vec3 uSheet;
uniform vec3 uPaperColor;   // the steam on the paper: a lighter sheet by day, cream by night
uniform vec2 uPaperCover;
uniform vec2 uSize;
float hash(vec2 p) {
	p = fract(p * vec2(234.34, 435.345));
	p += dot(p, p + 34.23);
	return fract(p.x * p.y);
}
void main() {
	vec2 uv = gl_FragCoord.xy / uSize;
	vec2 lv = texture2D(uLevel, uv).rg;
	vec4 g = texture2D(uGround, uv);
	float d = g.r;
	float grain = hash(floor(gl_FragCoord.xy / 3.0));
	float s = 0.25 + (grain - 0.5) * 0.16;
	float veil = lv.r > 0.5 ? step(s - 0.04, d) : step(s + 0.04, d);
	float fold = veil * (lv.g > 0.5 ? step(1.6 * s - 0.04, d) : step(1.6 * s + 0.04, d));
	if (veil < 0.5) discard;
	// The ground: glaze (green), soup (blue), aurora (alpha), else the paper.
	if (g.b > 0.5) discard;
	vec3 colour = uSheet;
	float a;
	if (g.g > 0.5) a = fold > 0.5 ? 0.45 : 0.22;
	else if (g.a > 0.5) a = fold > 0.5 ? 0.35 : 0.18;
	else {
		// On the paper: a lighter sheet by day, cream by night (theme.ts), lighter still in the fold.
		colour = fold > 0.5 ? mix(uPaperColor, vec3(1.0), 0.4) : uPaperColor;
		a = fold > 0.5 ? uPaperCover.y : uPaperCover.x;
	}
	gl_FragColor = vec4(colour, a);
}`;

export function Steam() {
	const gl = useThree(s => s.gl);
	const size = useThree(s => s.size);
	const dpr = useThree(s => s.viewport.dpr);

	const targets = useMemo(() => {
		const make = (depth: boolean) =>
			new THREE.WebGLRenderTarget(4, 4, {
				type: THREE.UnsignedByteType,
				depthBuffer: depth,
				stencilBuffer: false,
				minFilter: THREE.LinearFilter,
				magFilter: THREE.LinearFilter,
			});
		// Density and the ground behind it; two levels, ping-ponged for the hysteresis.
		return { density: make(true), level: [make(false), make(false)] as const, flip: 0 };
	}, []);
	useEffect(
		() => () => {
			targets.density.dispose();
			targets.level.forEach(t => t.dispose());
		},
		[targets]
	);
	useEffect(() => {
		// Half the resolution: at a quarter, small islands jump between pixels and flicker.
		const w = Math.max(1, Math.round((size.width * dpr) / 2));
		const h = Math.max(1, Math.round((size.height * dpr) / 2));
		targets.density.setSize(w, h);
		targets.level.forEach(t => t.setSize(w, h));
	}, [size, dpr, targets]);

	const parts = useMemo(() => {
		const scene = new THREE.Scene();
		// What is behind the steam: the black glaze in green, the bright soup in blue. Both write
		// depth, so the near rim hides the foot of the steam behind it.
		// Each writes only its own channel, and alpha 0: alpha is the aurora's.
		const flat = (rgba: string) =>
			new THREE.ShaderMaterial({
				vertexShader:
					"void main() { gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
				fragmentShader: `void main() { gl_FragColor = vec4(${rgba}); }`,
			});
		const ground = new THREE.Group();
		ground.add(new THREE.Mesh(bowlGeometry(), flat("0.0, 1.0, 0.0, 0.0")));
		const disc = new THREE.Mesh(
			new THREE.CircleGeometry(1, 48),
			flat("0.0, 0.0, 1.0, 0.0")
		);
		disc.rotation.x = -Math.PI / 2;
		ground.add(disc);
		scene.add(ground);

		const quad = new THREE.PlaneGeometry(1, 1);
		const geo = new THREE.InstancedBufferGeometry();
		geo.index = quad.index;
		geo.setAttribute("position", quad.getAttribute("position"));
		const aA = new THREE.InstancedBufferAttribute(
			new Float32Array(MAX_SEGMENTS * 4),
			4
		);
		const aB = new THREE.InstancedBufferAttribute(
			new Float32Array(MAX_SEGMENTS * 4),
			4
		);
		const aD = new THREE.InstancedBufferAttribute(
			new Float32Array(MAX_SEGMENTS * 4),
			4
		);
		geo.setAttribute("aA", aA);
		geo.setAttribute("aB", aB);
		geo.setAttribute("aD", aD);
		geo.instanceCount = 0;
		const segMat = new THREE.ShaderMaterial({
			vertexShader: SEG_VERT,
			fragmentShader: SEG_FRAG,
			uniforms: { uAspect: { value: 1 } },
			transparent: true,
			depthWrite: false,
			blending: THREE.CustomBlending,
			blendEquation: THREE.AddEquation,
			blendSrc: THREE.OneFactor,
			blendDst: THREE.OneFactor,
		});
		const segs = new THREE.Mesh(geo, segMat);
		segs.frustumCulled = false;
		segs.renderOrder = 1;
		scene.add(segs);
		// The aurora, into alpha only, from the curtain's own shader (aurora.tsx).
		const aurora = new THREE.Mesh(new THREE.PlaneGeometry(2, 2));
		aurora.frustumCulled = false;
		aurora.renderOrder = 2;
		aurora.visible = false;
		scene.add(aurora);

		const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
		const levelMat = new THREE.ShaderMaterial({
			vertexShader: QUAD_VERT,
			fragmentShader: LEVEL_FRAG,
			uniforms: {
				uDensity: { value: targets.density.texture },
				uPrev: { value: null },
			},
			depthTest: false,
			depthWrite: false,
		});
		const levelScene = new THREE.Scene();
		const levelQuad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), levelMat);
		levelQuad.frustumCulled = false;
		levelScene.add(levelQuad);

		const over = new THREE.Mesh(
			new THREE.PlaneGeometry(2, 2),
			new THREE.ShaderMaterial({
				vertexShader: QUAD_VERT,
				fragmentShader: OVER_FRAG,
				uniforms: {
					uLevel: { value: null },
					uGround: { value: targets.density.texture },
					uSheet: { value: new THREE.Vector3(...C.sheet) },
					uPaperColor: themed.steamPaper,
					uPaperCover: themed.steamPaperCover,
					uSize: { value: new THREE.Vector2(1, 1) },
				},
				transparent: true,
				depthTest: false,
				depthWrite: false,
			})
		);
		over.frustumCulled = false;
		over.renderOrder = 40;
		return {
			scene,
			ground,
			disc,
			aurora,
			geo,
			aA,
			aB,
			aD,
			segMat,
			camera,
			levelMat,
			levelScene,
			over,
		};
	}, [targets]);

	const sim = useMemo(
		() => ({
			emitters: [] as Emitter[],
			nextBirth: 0.3,
			drawClock: 1,
			wind: new THREE.Vector3(),
			lastPointer: new THREE.Vector2(),
			lastSpoon: new THREE.Vector3(),
			lastBowl: new THREE.Vector3(),
			right: new THREE.Vector3(),
			warmed: false,
		}),
		[]
	);

	useFrame((state, frameDt) => {
		const cam = state.camera as THREE.PerspectiveCamera;
		const W = state.size.width;
		const H = state.size.height;
		const dt = Math.min(frameDt, 1 / 20);
		const R = soupState.radius;
		const axis = new THREE.Vector3(
			soupState.at.x,
			soupState.at.y + soupState.level,
			soupState.at.z
		);
		const hot = soupState.heat;

		// The breath: the pointer moving over the bowl is air at up to 30 cm/s (4.7 units/s), rising
		// in 80 ms and dying in half a second, uniform over the surface.
		const pointer = director.pointer;
		const centre = axis.clone().project(cam);
		const pdx = pointer.x - sim.lastPointer.x;
		sim.lastPointer.set(pointer.x, pointer.y);
		sim.right.setFromMatrixColumn(cam.matrixWorld, 0);
		const overBowl =
			pointer.on &&
			Math.abs(pointer.x - centre.x) < 0.4 &&
			Math.abs(pointer.y - centre.y) < 0.5;
		const worldPerNdc =
			cam.position.distanceTo(axis) *
			Math.tan(((cam.fov / 2) * Math.PI) / 180) *
			(W / H);
		const gust = overBowl ? (pdx / Math.max(frameDt, 1e-3)) * worldPerNdc : 0;
		const target = sim.right
			.clone()
			.multiplyScalar(THREE.MathUtils.clamp(gust, -4.7, 4.7));
		sim.wind.lerp(
			gust !== 0 ? target : new THREE.Vector3(),
			1 - Math.exp(-dt / (gust !== 0 ? 0.08 : 0.5))
		);
		const torn = sim.wind.length() > 3.1;

		// The spoon's travel this frame, to cut the tongues it goes through; and whether the bowl
		// is sliding away (then the steam it leaves behind thins out twice as fast).
		const spoonVel = soupState.spoon
			.clone()
			.sub(sim.lastSpoon)
			.divideScalar(Math.max(dt, 1e-3));
		sim.lastSpoon.copy(soupState.spoon);
		const bowlSpeed = soupState.at.distanceTo(sim.lastBowl) / Math.max(dt, 1e-3);
		sim.lastBowl.copy(soupState.at);

		// The direction away from the camera, on the table: the far side of the bowl.
		const away = Math.atan2(axis.z - cam.position.z, axis.x - cam.position.x);

		const step = (dt: number, t: number) => {
			// Births: about two tongues a second on this bowl, in clusters and pauses; half again as
			// many while the spoon brings hotter soup up.
			sim.nextBirth -= dt;
			// No new tongues while the bowl itself is sliding: the hot surface is moving out from
			// under the air above it.
			while (hot > 0.05 && bowlSpeed < 0.5 && sim.nextBirth <= 0) {
				// Half of them on the far side, where a tongue climbs over the rim and reads against the
				// glaze: from above that is all of the steam one sees.
				const far = Math.random() < 0.5;
				const r = far
					? R * (0.5 + 0.4 * Math.random())
					: Math.sqrt(Math.random()) * R * 0.9;
				const a = far
					? away + (Math.random() - 0.5) * (Math.PI / 1.5)
					: Math.random() * Math.PI * 2;
				sim.emitters.push({
					at: new THREE.Vector3(Math.cos(a) * r, 0, Math.sin(a) * r),
					on: 0.4 + 0.6 * Math.pow(Math.random(), 2),
					next: 0,
					particles: [],
					curl: null,
					curlAt: 0.63 + Math.random() * 0.31,
				});
				const rate = 2 * hot * (1 + 0.5 * soupState.spoonIn);
				const gap =
					Math.random() < 0.15 ? 1 + Math.random() : -Math.log(1 - Math.random()) * 0.5;
				sim.nextBirth += gap / rate;
			}

			for (const e of sim.emitters) {
				// While on, a particle every 33 ms from the same spot of the surface.
				// A spot of the surface that has slid away no longer feeds this tongue.
				if (bowlSpeed > 0.5) e.on = 0;
				if (e.on > 0) {
					e.on -= dt;
					e.next -= dt;
					while (e.next <= 0 && e.particles.length < 40) {
						e.next += EMIT_EVERY;
						e.particles.push({
							pos: axis.clone().add(e.at).addScaledVector(UP, 0.02),
							age: 0,
							life: 1.8 + Math.random() * 0.8,
							seed: Math.random() * 10,
						});
					}
				}
				// The curl: once the head of the tongue passes 4-6 cm, a half turn in about 0.6 s
				// around a point a centimetre or so to one side.
				const head = e.particles[0];
				if (head && !e.curl && head.pos.y - axis.y > e.curlAt) {
					const lat = new THREE.Vector3(
						Math.random() - 0.5,
						0,
						Math.random() - 0.5
					).normalize();
					e.curl = {
						centre: head.pos.clone().addScaledVector(lat, 0.12 + Math.random() * 0.07),
						lat,
						omega: (Math.random() < 0.5 ? -1 : 1) * (Math.PI / 0.6),
						left: 0.6 + Math.random() * 0.4,
					};
				}
				if (e.curl) {
					e.curl.left -= dt;
					e.curl.centre.y += rise(e.curl.centre.y - axis.y) * dt;
				}
				for (const p of e.particles) {
					// Torn by the breath, or left behind by a bowl sliding away: it thins out fast.
					p.age += dt * (torn ? 2 : bowlSpeed > 0.5 ? 4 : 1);
					const h = Math.max(p.pos.y - axis.y, 0);
					const dx = p.pos.x - axis.x;
					const dz = p.pos.z - axis.z;
					const low = Math.exp(-h / 0.63);
					// Rising faster as it goes, drawn towards the axis low down (the upturned cone).
					const v = new THREE.Vector3(-0.4 * dx * low, rise(h), -0.4 * dz * low);
					// The air's own restlessness, growing with height, carried along with it.
					const amp = Math.min((h / 0.63) ** 2, 2.5) * 0.15;
					v.x += Math.sin(p.pos.y * 9 + t * 1.3 + p.seed) * amp;
					v.z += Math.cos(p.pos.y * 8 - t * 1.1 + p.seed * 1.7) * amp;
					if (e.curl && e.curl.left > 0) {
						const rel = p.pos.clone().sub(e.curl.centre);
						const x = rel.dot(e.curl.lat);
						if (Math.hypot(x, rel.y) < 0.35)
							v.addScaledVector(e.curl.lat, -rel.y * e.curl.omega).addScaledVector(
								UP,
								x * e.curl.omega
							);
					}
					// The breath carries it whole; the spoon pushes aside what it goes through.
					v.add(sim.wind);
					if (soupState.spoonIn > 0.05) {
						const toTip = p.pos.clone().sub(soupState.spoon);
						const along = THREE.MathUtils.clamp(toTip.dot(soupState.spoonDir), 0, 2.2);
						const off = toTip
							.sub(soupState.spoonDir.clone().multiplyScalar(along))
							.length();
						if (off < 0.12) v.addScaledVector(spoonVel, soupState.spoonIn);
					}
					p.pos.addScaledVector(v, dt);
				}
				e.particles = e.particles.filter(p => p.age < p.life);
			}
			sim.emitters = sim.emitters.filter(e => e.on > 0 || e.particles.length > 0);
		};

		// Under reduced motion: one still drawing, two seconds into the steam's life.
		if (reduced) {
			if (!sim.warmed && hot > 0.5) {
				sim.warmed = true;
				for (let i = 0; i < 120; i++) step(1 / 60, i / 60);
				sim.drawClock = 1;
			}
		} else {
			// Steam is already rising when the page opens: two seconds of it, run at once the first
			// time the soup is hot, so the first view is never empty.
			if (!sim.warmed && hot > 0.5) {
				sim.warmed = true;
				for (let i = 0; i < 120; i++)
					step(1 / 60, state.clock.elapsedTime - 2 + i / 60);
			}
			step(dt, state.clock.elapsedTime);
			sim.drawClock += dt;
		}

		// The steam belongs to the bowl's scene: past it (a quick scroll can get there before the
		// last tongues have worn out) whatever is left goes.
		if (director.G > 2) sim.emitters = [];
		const live = sim.emitters.length > 0;
		parts.over.visible = live;
		const overMat = parts.over.material as THREE.ShaderMaterial;
		overMat.uniforms.uSize.value.set(W * state.viewport.dpr, H * state.viewport.dpr);
		if (!live || sim.drawClock < 1 / DRAWN_FPS) return;
		sim.drawClock = reduced ? -Infinity : sim.drawClock % (1 / DRAWN_FPS);

		// A new drawing: the tongues as chains of segments, radius 0.45 cm growing 0.5 cm a
		// second, density e^(-age / DECAY).
		let n = 0;
		for (const e of sim.emitters) {
			const ps = e.particles;
			// Two puffs born far apart (the bowl ran from under them) are not one tongue: the chain
			// breaks there instead of drawing a long straight bar between them.
			const linked = ps.map(
				(p, i) => i < ps.length - 1 && p.pos.distanceTo(ps[i + 1].pos) < MAX_LINK
			);
			for (let i = 0; i < ps.length - 1 && n < MAX_SEGMENTS; i++) {
				if (!linked[i]) continue;
				const p = ps[i];
				const q = ps[i + 1];
				parts.aA.setXYZW(n, p.pos.x, p.pos.y, p.pos.z, 0.07 + 0.078 * p.age);
				parts.aB.setXYZW(n, q.pos.x, q.pos.y, q.pos.z, 0.07 + 0.078 * q.age);
				parts.aD.setXYZW(
					n,
					Math.exp(-p.age / DECAY),
					Math.exp(-q.age / DECAY),
					i === 0 || !linked[i - 1] ? 1 : 0,
					i === ps.length - 2 || !linked[i + 1] ? 1 : 0
				);
				n++;
			}
		}
		parts.geo.instanceCount = n;
		parts.aA.needsUpdate = parts.aB.needsUpdate = parts.aD.needsUpdate = true;
		parts.segMat.uniforms.uAspect.value = W / H;
		parts.ground.position.copy(soupState.at);
		if (auroraMask.material) {
			parts.aurora.material = auroraMask.material;
			parts.aurora.visible = director.G < 1.96;
		}
		parts.disc.position.y = soupState.level + 0.005;
		parts.disc.scale.setScalar(R);

		const prevTarget = gl.getRenderTarget();
		const prevColor = new THREE.Color();
		gl.getClearColor(prevColor);
		const prevAlpha = gl.getClearAlpha();
		gl.setClearColor(0x000000, 0);
		gl.setRenderTarget(targets.density);
		gl.clear(true, true, false);
		gl.render(parts.scene, cam);
		// The level, against the previous drawing.
		const read = targets.level[targets.flip];
		const write = targets.level[1 - targets.flip];
		parts.levelMat.uniforms.uPrev.value = read.texture;
		gl.setRenderTarget(write);
		gl.render(parts.levelScene, parts.camera);
		targets.flip = 1 - targets.flip;
		overMat.uniforms.uLevel.value = write.texture;
		gl.setRenderTarget(prevTarget);
		gl.setClearColor(prevColor, prevAlpha);
	});

	return <primitive object={parts.over} />;
}
