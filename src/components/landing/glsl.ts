// Shared GLSL. `hash` and `stipple` are the very functions of the app's SoupField
// (src/components/ds/soup-field.tsx): white noise on the device pixel, thresholded, so the 3D
// grain has the same size and the same feel as the blobs on every other screen.

export const PRINT = /* glsl */ `
float hash(vec2 p) {
	p = fract(p * vec2(234.34, 435.345));
	p += dot(p, p + 34.23);
	return fract(p.x * p.y);
}

// cover 0..1: how much of the upper tone is in this pixel. Near the middle each grain decides.
float stipple(float cover) {
	float grain = hash(floor(gl_FragCoord.xy));
	float edge = cover * (1.0 - cover) * 4.0;
	return mix(cover, step(grain, cover), 0.75 * edge);
}

// The tooth of the paper, as on the blobs: a 6% flicker of light per pixel, fixed in time.
vec3 tooth(vec3 col) {
	return col * (1.0 + (hash(floor(gl_FragCoord.xy) + 17.0) - 0.5) * 0.06);
}
`;

/** A two-tone toon glaze with a stippled terminator and a flat poster highlight. */
export const TOON_VERT = /* glsl */ `
varying vec3 vNormal;
varying vec3 vView;
void main() {
	vec4 world = modelMatrix * vec4(position, 1.0);
	vNormal = normalize(mat3(modelMatrix) * normal);
	vView = normalize(cameraPosition - world.xyz);
	gl_Position = projectionMatrix * viewMatrix * world;
}`;

export const TOON_FRAG = /* glsl */ `
uniform vec3 uTone;
uniform vec3 uShade;
uniform vec3 uHigh;
uniform vec3 uLight;
uniform float uHighSize;
varying vec3 vNormal;
varying vec3 vView;
${PRINT}
void main() {
	vec3 N = normalize(vNormal);
	if (!gl_FrontFacing) N = -N;
	float ndl = dot(N, uLight);
	vec3 col = mix(uShade, uTone, stipple(smoothstep(-0.1, 0.3, ndl)));
	// The glaze shines as a poster would draw it: one flat patch of light, grainy at the edge.
	float spec = max(dot(reflect(-uLight, N), normalize(vView)), 0.0);
	col = mix(col, uHigh, stipple(smoothstep(uHighSize, uHighSize + 0.06, spec)));
	gl_FragColor = vec4(tooth(col), 1.0);
}`;

/** The ink outline: the back faces pushed out along the normal, trembling 8 times a second. */
export const OUTLINE_VERT = /* glsl */ `
uniform float uThick;
uniform float uBoil;
float h3(vec3 p) { return fract(sin(dot(p, vec3(12.9898, 78.233, 45.164))) * 43758.5453); }
void main() {
	float wobble = 0.65 + 0.7 * h3(floor(position * 9.0) + uBoil);
	vec3 p = position + normal * uThick * wobble;
	gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
}`;

export const OUTLINE_FRAG = /* glsl */ `
uniform vec3 uInk;
void main() { gl_FragColor = vec4(uInk, 1.0); }`;
