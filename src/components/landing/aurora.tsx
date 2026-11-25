import { useMemo } from "react";

import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

import { PRINT } from "./glsl";
import { C } from "./palette";
import { director, reduced, smooth } from "./story";
import { themed } from "./theme";

// The aurora of the app's home (SoupField, shape «onda») drawn inside the 3D scene: a curtain of
// flat soup hanging from the top, its hem rolling, its edge stippled with the same grain. It is
// first the preloader's yellow, with the hole on the bowl's rim, then climbs back and becomes the
// curtain. One full-screen quad, drawn before everything else. Drops gather on its hem, pull a
// thread and fall into the soup (drops.tsx draws them here until they let go).

/** The share of the screen's height the curtain is drawn in, from the top. */
/** 0..1 as the curtain climbs off the top at the end of scene 1. */
export const auroraOut = (G: number) => smooth(1.7, 1.95, G);

export const auroraBand = (_wide: boolean) => 0.42;

/** The curtain's slow clock, shared with the drops so both read the same hem. */
export const auroraClock = { t: Math.random() * 40 };

/**
 * Two drops on the hem, in device px (drops.tsx writes them, ricerca/14 has the storyboard).
 * A: x, drop diameter D, how far the bulb's centre hangs below the hem, the thread's narrowest
 * radius. B: stub length after the break, state (0 off, 1 hanging, 2 broken), bulb radius, half
 * width of the calm stretch of hem around it.
 */
export const dripA = [new THREE.Vector4(), new THREE.Vector4()];
export const dripB = [new THREE.Vector4(), new THREE.Vector4()];
/** How calm the hem is around each drop, 0..1: it eases in before a drop and out after it. */
export const dripCalm = new THREE.Vector2();
/** The curtain's clock where each drop hangs: there the hem holds still, as a wet edge does. */
export const dripFreeze = new THREE.Vector2();

/**
 * The hem's height inside the band (0 at its foot, 1 at the top) where a drop hangs. There the
 * curtain is calm (no noise bends it), so this is exactly where the shader draws it.
 */
export function calmHem(
	x: number,
	t: number,
	speed: number,
	out = auroraOut(director.G)
) {
	return (
		out * 0.75 +
		0.62 +
		0.12 * Math.sin(x * 2.4 + t * 0.6) +
		0.06 * Math.sin(x * 5.3 - t * 0.45 + 1.3) +
		speed * 0.05 * Math.sin(x * 3.1 + t * 2.0)
	);
}

const VERT = /* glsl */ `
void main() { gl_Position = vec4(position.xy, 0.0, 1.0); }`;

const FRAG = /* glsl */ `
uniform vec2 uSize;
uniform float uTime;
uniform float uBand;
uniform float uMorph;
uniform float uOut;
uniform float uSpeed;
uniform vec3 uIris;
uniform vec3 uCore;
uniform vec3 uRim;
uniform vec4 uDripA[2];
uniform vec4 uDripB[2];
uniform vec2 uCalm;
uniform vec2 uFreeze;
uniform float uScale;
uniform float uStrength;  // 1 by day; 0.8 by night, as the app's blobs
uniform vec3 uGround;
uniform vec3 uIrisColor;  // the preloader: corn by day, the paper by night   // 1 on screen; 2 in the steam's half-resolution mask
${PRINT}

// Distance functions for the drop: a cone with round ends (the thread, the shoulders, the stub) and
// a smooth union (the meniscus).
float sdCone(vec2 p, vec2 a, vec2 b, float ra, float rb) {
	vec2 pa = p - a;
	vec2 ba = b - a;
	float h = clamp(dot(pa, ba) / max(dot(ba, ba), 1e-4), 0.0, 1.0);
	return length(pa - ba * h) - mix(ra, rb, h);
}
float smin(float a, float b, float k) {
	float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
	return mix(b, a, h) - k * h * (1.0 - h);
}

float noise(vec2 p) {
	vec2 i = floor(p);
	vec2 f = fract(p);
	f = f * f * (3.0 - 2.0 * f);
	return mix(
		mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
		mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x),
		f.y
	);
}

float fbm(vec2 p) {
	float value = 0.0;
	float amplitude = 0.5;
	for (int i = 0; i < 3; i++) {
		value += amplitude * noise(p);
		p = p * 2.03 + 11.7;
		amplitude *= 0.5;
	}
	return value;
}

void main() {
	vec2 px = gl_FragCoord.xy * uScale;
	vec2 uv = px / uSize;
	float aspect = uSize.x / uSize.y;
	// The curtain lives in a band at the top of the screen, as the app's lives in its header.
	vec2 p = vec2((uv.x - 0.5) * aspect / uBand, (uv.y - (1.0 - uBand)) / uBand);
	float t = uTime;

	// Where a drop gathers, the hem calms down and holds still: the liquid there hangs from a
	// smooth, wet edge that stops rolling while the drop forms.
	float calm = 0.0;
	float held = t;
	for (int i = 0; i < 2; i++) {
		float strength = i == 0 ? uCalm.x : uCalm.y;
		float c = strength * exp(-pow((px.x - uDripA[i].x) / uDripB[i].w, 2.0));
		if (c > calm) {
			calm = c;
			held = i == 0 ? uFreeze.x : uFreeze.y;
		}
	}
	float tl = mix(t, held, calm);
	vec2 bend = vec2(fbm(p * 1.7 + vec2(t * 0.06, 3.1)), fbm(p * 1.7 + vec2(7.4, t * 0.05))) - 0.5;
	vec2 q = p + bend * 0.32 * (1.0 - calm);

	float hem = 0.62
		+ 0.12 * sin(q.x * 2.4 + tl * 0.6)
		+ 0.06 * sin(q.x * 5.3 - tl * 0.45 + 1.3)
		+ 0.1 * (fbm(vec2(q.x * 0.9 + t * 0.08, t * 0.05)) - 0.5) * (1.0 - calm)
		+ uSpeed * 0.05 * sin(q.x * 3.1 + tl * 2.0);
	// From the preloader: the hem starts below the screen and climbs; at the end of scene 1 it
	// climbs on, off the top.
	hem = mix(-2.6, hem, uMorph) + uOut * 0.75;
	float field = smoothstep(hem - 0.07, hem + 0.05, q.y) * (0.8 + 0.6 * smoothstep(hem, 1.0, q.y));
	float body = smoothstep(0.32, 0.78, field);

	// The posters' stipple, as on the home: near the edge some grains are soup, some paper.
	float grain = hash(floor(px));
	float edge = body * (1.0 - body) * 4.0;
	float cover = step(0.5, mix(body, step(grain, body), 0.6 * edge));

	// The drops, as glycerol drips off an edge (ricerca/14): a lobe that swells under the hem, a
	// pear whose shoulders slope into a concave meniscus, a neck that stretches into a thread
	// thinnest a third of the way down, a break, a stub that springs back into a little cone. Hem
	// and drop are one distance field, stippled at the edge like the rest of the curtain.
	float drop = 0.0;
	for (int i = 0; i < 2; i++) {
		vec4 a = uDripA[i];
		vec4 b = uDripB[i];
		float strength = i == 0 ? uCalm.x : uCalm.y;
		if (strength <= 0.0) continue;
		float D = a.y;
		// The calm hem, at this pixel's x and at the drop's: near a drop the curtain follows it.
		float xp = (px.x / uSize.x - 0.5) * aspect / uBand;
		float xb = (a.x / uSize.x - 0.5) * aspect / uBand;
		float tb = mix(t, i == 0 ? uFreeze.x : uFreeze.y, strength);
		float hemP = uOut * 0.75 + 0.62 + 0.12 * sin(xp * 2.4 + tl * 0.6) + 0.06 * sin(xp * 5.3 - tl * 0.45 + 1.3)
			+ uSpeed * 0.05 * sin(xp * 3.1 + tl * 2.0);
		// Its slope, so the meniscus measures the distance across the hem, not straight down.
		float slope = 0.12 * 2.4 * cos(xp * 2.4 + tl * 0.6) + 0.06 * 5.3 * cos(xp * 5.3 - tl * 0.45 + 1.3)
			+ uSpeed * 0.05 * 3.1 * cos(xp * 3.1 + tl * 2.0);
		float hemB = uOut * 0.75 + 0.62 + 0.12 * sin(xb * 2.4 + tb * 0.6) + 0.06 * sin(xb * 5.3 - tb * 0.45 + 1.3)
			+ uSpeed * 0.05 * sin(xb * 3.1 + tb * 2.0);
		float edgeY = (1.0 - uBand + uBand * hemP) * uSize.y;
		float top = (1.0 - uBand + uBand * hemB) * uSize.y;
		if (b.y < 0.5) continue;
		// The curtain as a distance: negative above its hem.
		float d = (edgeY - px.y) / sqrt(1.0 + slope * slope);
		if (b.y < 1.5) {
			float R = b.z;
			float c = a.z;
			vec2 bulb = vec2(a.x, top - c);
			float gap = max(c - R, 0.0);
			float yNeck = top - gap / 3.0;
			// Thread: from a wide foot at the hem to the narrowest point, then a cone into the bulb.
			float thread = min(
				sdCone(px, vec2(a.x, top + 0.2 * D), vec2(a.x, yNeck), max(1.7 * a.w, 0.1 * D), a.w),
				sdCone(px, vec2(a.x, yNeck), bulb + vec2(0.0, R * 0.5), a.w, max(0.2 * D, a.w))
			);
			float k = mix(0.45, 0.2, clamp(gap / D, 0.0, 1.0)) * D;
			// The meniscus: the curtain and the thread joined by a concave fillet.
			d = smin(d, thread, k);
			d = smin(d, length(px - bulb) - R, 0.12 * D);
		} else if (b.x > 0.25) {
			// The stub, springing back into a little cone under the hem.
			d = smin(d, sdCone(px, vec2(a.x, top + 0.2 * D), vec2(a.x, top - b.x), 0.16 * D, 0.5), 0.15 * D);
		}
		// Only what hangs below the hem is the drop, and only around it: the calm line of the hem
		// is a construction for the meniscus, never drawn on its own.
		float near = 1.0 - smoothstep(1.5 * D, 2.5 * D, abs(px.x - a.x));
		float body2 = (1.0 - smoothstep(-1.5, 1.5, d)) * step(px.y, edgeY) * near;
		float e2 = body2 * (1.0 - body2) * 4.0;
		drop = max(drop, step(0.5, mix(body2, step(grain, body2), 0.6 * e2)));
	}
	// The drop is corn, from the top of the curtain, coming down through the pumpkin hem.
	float dropOnly = drop * (1.0 - cover) * uMorph;
	cover = max(cover, dropOnly);
	// The preloader's hole, as sharp as the CSS one it replaces.
	if (uIris.z > 0.0) cover *= step(uIris.z, length(px - uIris.xy));
	if (cover < 0.5) discard;

	float core = max(smoothstep(0.75, 1.35, field), 1.0 - uMorph);
	// Where a drop gathers, the corn of the top runs down through the hem and into it.
	vec3 colour = mix(uRim, uCore, max(core, dropOnly));
	colour = mix(uIrisColor, colour, smoothstep(0.0, 0.5, uMorph));
	colour = mix(uGround, colour, uStrength);
#ifdef MASK
	// Only where the curtain is, in alpha: the steam reads this to know its ground.
	gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
#else
	gl_FragColor = vec4(tooth(colour), 1.0);
#endif
}`;

/** The curtain as a mask, for the steam: same uniforms, alpha only (steam.tsx). */
export const auroraMask = { material: null as THREE.ShaderMaterial | null };

export function Aurora() {
	const material = useMemo(
		() =>
			new THREE.ShaderMaterial({
				vertexShader: VERT,
				fragmentShader: FRAG,
				depthTest: false,
				depthWrite: false,
				uniforms: {
					uSize: { value: new THREE.Vector2(1, 1) },
					uTime: { value: 0 },
					uBand: { value: 0.5 },
					uMorph: { value: 0 },
					uOut: { value: 0 },
					uSpeed: { value: 0 },
					uIris: { value: new THREE.Vector3() },
					// As on the home: corn at the top, pumpkin along the hem.
					uCore: { value: new THREE.Vector3(...C.corn) },
					uRim: { value: new THREE.Vector3(...C.pumpkin) },
					uDripA: { value: dripA },
					uDripB: { value: dripB },
					uCalm: { value: dripCalm },
					uFreeze: { value: dripFreeze },
					uScale: { value: 1 },
					uStrength: themed.strength,
					uGround: themed.ground,
					uIrisColor: themed.iris,
				},
			}),
		[]
	);
	useMemo(() => {
		// The same curtain, written into alpha only and leaving the colour channels alone.
		auroraMask.material = new THREE.ShaderMaterial({
			vertexShader: VERT,
			fragmentShader: FRAG,
			defines: { MASK: 1 },
			depthTest: false,
			depthWrite: false,
			transparent: true,
			blending: THREE.CustomBlending,
			blendEquation: THREE.AddEquation,
			blendSrc: THREE.ZeroFactor,
			blendDst: THREE.OneFactor,
			blendSrcAlpha: THREE.OneFactor,
			blendDstAlpha: THREE.ZeroFactor,
			uniforms: { ...material.uniforms, uScale: { value: 2 } },
		});
	}, [material]);

	const mesh = useMemo(() => {
		const m = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
		m.frustumCulled = false;
		m.renderOrder = -10;
		return m;
	}, [material]);

	useFrame((state, dt) => {
		const u = material.uniforms;
		const dpr = state.viewport.dpr;
		const { width: W, height: H } = state.size;
		const G = director.G;
		if (!reduced) auroraClock.t += Math.min(dt, 0.1) * 0.5;
		u.uSize.value.set(W * dpr, H * dpr);
		u.uTime.value = auroraClock.t;
		u.uBand.value = auroraBand(W / H > 1.1);
		u.uMorph.value = director.morph;
		u.uOut.value = auroraOut(G);
		u.uSpeed.value = director.speedSoft;
		u.uIris.value.set((W / 2) * dpr, (H / 2) * dpr, director.iris * dpr);
		mesh.visible = G < 1.96;
	});

	return <primitive object={mesh} />;
}
