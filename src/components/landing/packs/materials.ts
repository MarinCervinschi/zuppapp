import * as THREE from "three";

import { OUTLINE_FRAG, OUTLINE_VERT, PRINT, TOON_FRAG, TOON_VERT } from "../glsl";
import { themed } from "../theme";

// The brand material, now with a printed label: the label's own colour is the lit tone, the same
// colour dimmed and warmed is the shade, the terminator is stippled, the shine is a flat patch.

export const LIGHT = new THREE.Vector3(-0.55, 1, 0.65).normalize();
const v3 = (c: readonly number[]) => new THREE.Vector3(c[0], c[1], c[2]);

const TEX_VERT = /* glsl */ `
varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vView;
void main() {
	vUv = uv;
	vec4 world = modelMatrix * vec4(position, 1.0);
	vNormal = normalize(mat3(modelMatrix) * normal);
	vView = normalize(cameraPosition - world.xyz);
	gl_Position = projectionMatrix * viewMatrix * world;
}`;

const TEX_FRAG = /* glsl */ `
uniform sampler2D uMap;
uniform vec3 uLight;
uniform vec3 uHigh;
uniform float uHighSize;
uniform float uShadeMul;
uniform vec3 uTint;
varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vView;
${PRINT}
void main() {
	vec3 N = normalize(vNormal);
	if (!gl_FrontFacing) N = -N;
	vec3 base = texture2D(uMap, vUv).rgb;
	vec3 shade = base * uShadeMul * uTint;
	vec3 col = mix(shade, base, stipple(smoothstep(-0.2, 0.22, dot(N, uLight))));
	float spec = max(dot(reflect(-uLight, N), normalize(vView)), 0.0);
	col = mix(col, uHigh, stipple(smoothstep(uHighSize, uHighSize + 0.035, spec)));
	gl_FragColor = vec4(tooth(col), 1.0);
}`;

export function labelMat(map: THREE.Texture, { highSize = 0.97, shade = 0.74 } = {}) {
	return new THREE.ShaderMaterial({
		vertexShader: TEX_VERT,
		fragmentShader: TEX_FRAG,
		uniforms: {
			uMap: { value: map },
			uLight: { value: LIGHT },
			uHigh: { value: new THREE.Vector3(1, 0.99, 0.96) },
			uHighSize: { value: highSize },
			uShadeMul: { value: shade },
			uTint: { value: new THREE.Vector3(1.0, 0.9, 0.84) },
		},
	});
}

export function flatMat(
	tone: readonly number[],
	shadeOf?: readonly number[],
	highSize = 0.97
) {
	const shade = shadeOf ?? tone.map((c, i) => c * 0.74 * [1, 0.9, 0.84][i]);
	return new THREE.ShaderMaterial({
		vertexShader: TOON_VERT,
		fragmentShader: TOON_FRAG,
		uniforms: {
			uTone: { value: v3(tone) },
			uShade: { value: v3(shade) },
			uHigh: { value: new THREE.Vector3(1, 0.99, 0.96) },
			uLight: { value: LIGHT },
			uHighSize: { value: highSize },
		},
	});
}

export const boil = { value: 0 };

export function outlineMat(thick = 0.016) {
	return new THREE.ShaderMaterial({
		vertexShader: OUTLINE_VERT,
		fragmentShader: OUTLINE_FRAG,
		side: THREE.BackSide,
		// The ink follows the theme: cream by night, like the text (theme.ts).
		uniforms: { uThick: { value: thick }, uBoil: boil, uInk: themed.line },
	});
}

const SHADOW_FRAG = /* glsl */ `
uniform vec3 uColor;
uniform vec2 uSize;
varying vec2 vUv;
${PRINT}
void main() {
	vec2 q = (vUv - 0.5) * 2.0;
	float d = length(q);
	float a = stipple(smoothstep(1.0, 0.55, d));
	if (a < 0.01) discard;
	gl_FragColor = vec4(uColor, a);
}`;

/** A flat, stippled ink shadow under each pack: drawn, not computed. */
export function shadowMat() {
	return new THREE.ShaderMaterial({
		vertexShader: /* glsl */ `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
		fragmentShader: SHADOW_FRAG,
		transparent: true,
		depthWrite: false,
		uniforms: {
			uColor: themed.shadow,
			uSize: { value: new THREE.Vector2(1, 1) },
		},
	});
}
