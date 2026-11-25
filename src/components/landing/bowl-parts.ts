import * as THREE from "three";

import { PRINT } from "./glsl";
import { BOWL } from "./story";

// The bowl of the app's icon, turned on a lathe, its spoon, and the shaders of the soup's surface
// and of the drawn shadow under the bowl.

export const SOUP_VERT = /* glsl */ `
uniform sampler2D uSim;
uniform float uAmp;
varying vec2 vUv;
varying vec3 vView;
void main() {
	vUv = uv;
	vec3 p = position;
	p.z += texture2D(uSim, uv).r * uAmp;
	vec4 world = modelMatrix * vec4(p, 1.0);
	vView = normalize(cameraPosition - world.xyz);
	gl_Position = projectionMatrix * viewMatrix * world;
}`;

export const SOUP_FRAG = /* glsl */ `
uniform sampler2D uSim;
uniform vec2 uTexel;
uniform float uSlope;
uniform vec3 uSoup;
uniform vec3 uSoupShade;
uniform vec3 uCream;
uniform vec3 uCreamShade;
uniform vec3 uHigh;
uniform vec3 uLight;
uniform vec4 uDropShadow;
uniform vec3 uCorn;
uniform vec3 uCornShade;
varying vec2 vUv;
varying vec3 vView;
${PRINT}
void main() {
	vec2 d = vUv - 0.5;
	float r = length(d);
	if (r > 0.5) discard;

	float hL = texture2D(uSim, vUv - vec2(uTexel.x, 0.0)).r;
	float hR = texture2D(uSim, vUv + vec2(uTexel.x, 0.0)).r;
	float hD = texture2D(uSim, vUv - vec2(0.0, uTexel.y)).r;
	float hU = texture2D(uSim, vUv + vec2(0.0, uTexel.y)).r;
	vec3 Nl = normalize(vec3((hL - hR) * uSlope, (hD - hU) * uSlope, 1.0));
	vec3 N = vec3(Nl.x, Nl.z, -Nl.y);

	float lit = stipple(smoothstep(0.42, 0.66, dot(N, uLight)));
	float cream = stipple(smoothstep(0.3, 0.62, texture2D(uSim, vUv).b));
	vec3 col = mix(mix(uSoupShade, uSoup, lit), mix(uCreamShade, uCream, lit), cream);
	// The corn the drops left lies on top of whatever was there, cream included: a drop lands on
	// the surface. Over the cream the thin yellow film reads paler, as a thin layer would.
	float dye = texture2D(uSim, vUv).a;
	float corn = stipple(smoothstep(0.3, 0.62, dye));
	// A fuller rim and a thinner, paler centre, two flat tones as the posters would print it.
	float rim = stipple(smoothstep(0.82, 0.92, dye));
	vec3 cornCol = mix(uCornShade, uCorn, lit);
	cornCol = mix(mix(cornCol, uCream, 0.3), cornCol, rim);
	cornCol = mix(cornCol, mix(cornCol, uCream, 0.35), cream);
	col = mix(col, cornCol, corn);

	// The wall of the bowl throws a crescent of shade on the side the light comes from.
	vec2 toLight = normalize(vec2(uLight.x, -uLight.z));
	float wall = smoothstep(0.455, 0.49, length(d + toLight * 0.06));
	col = mix(col, mix(uSoupShade, uCreamShade, cream) * 0.8, stipple(wall));

	// One flat patch of light, as a poster draws a shine.
	float spec = dot(reflect(-uLight, N), normalize(vView));
	col = mix(col, uHigh, stipple(smoothstep(0.975, 0.99, spec)));

	// The shadow of a drop falling into it, stippled like every other shadow.
	float ds = smoothstep(uDropShadow.z, uDropShadow.z * 0.45, length(vUv - uDropShadow.xy));
	col = mix(col, uSoupShade * 0.82, stipple(ds * uDropShadow.w));

	gl_FragColor = vec4(tooth(col), 1.0);
}`;

export const SHADOW_FRAG = /* glsl */ `
uniform vec3 uColor;
uniform vec2 uCentre;
varying vec2 vUv;
${PRINT}
void main() {
	vec2 q = (vUv - 0.5) * 7.0 - uCentre;
	float d = length(q / vec2(1.55, 1.4));
	float cover = smoothstep(1.0, 0.72, d);
	float a = stipple(cover);
	if (a < 0.01) discard;
	gl_FragColor = vec4(uColor, a);
}`;

export const PLAIN_VERT = /* glsl */ `
varying vec2 vUv;
void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;

/** The bowl of the icon, turned on a lathe: a foot, a round belly, a soft rim, the inside. */
export function bowlGeometry() {
	const pts: [number, number][] = [
		[0.0, 0.04],
		[0.5, 0.04],
		[0.58, 0.0],
		[0.7, 0.0],
		[0.74, 0.06],
		[0.95, 0.18],
		[1.14, 0.36],
		[1.27, 0.58],
		[1.34, 0.8],
		[1.355, 0.93],
		[1.34, 0.975],
		[1.3, 0.99],
		[1.25, 0.975],
		[1.16, 0.92],
		[1.06, 0.82],
		[1.0, 0.74],
		[0.9, 0.6],
		[0.7, 0.42],
		[0.38, 0.32],
		[0.0, 0.3],
	];
	const curve = new THREE.SplineCurve(pts.map(([x, y]) => new THREE.Vector2(x, y)));
	const g = new THREE.LatheGeometry(curve.getPoints(140), 128);
	g.scale(1, BOWL.depth, 1);
	g.computeVertexNormals();
	return g;
}

export function spoonParts() {
	const head = new THREE.SphereGeometry(1, 48, 24);
	head.scale(0.3, 0.42, 0.1);
	const neck = new THREE.CapsuleGeometry(0.085, 1.8, 8, 24);
	neck.translate(0, 0.4 + 0.9, 0);
	return { head, neck };
}
