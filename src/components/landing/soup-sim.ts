import * as THREE from "three";

// The surface of the soup as a height field on the GPU: the wave equation on a 256² grid (13 cm of
// soup, half a millimetre a texel), ping-ponged between two render targets, at a fixed step. The
// numbers are a velvet soup's (ricerca/13): one texel is one point of the surface:
//   R = height now, G = height a step ago, B = cream (0 soup, 1 cream), A = corn from the drops.
// The cream is carried along by the spoon (a fake semi-Lagrangian advection), so the swirl of
// the logo smears when you stir.

export const SIM_SIZE = 256;
/** A fixed step, whatever the screen's refresh: 640 a second makes the waves as fast as real ones. */
export const STEP_DT = 1 / 640;

const SIM_FRAG = /* glsl */ `
uniform sampler2D uPrev;
uniform sampler2D uSpiral;
uniform vec2 uTexel;
uniform vec4 uSpoon;        // xy tip in uv, zw velocity in uv per second
uniform float uSpoonIn;     // 0 above the soup, 1 dipped
uniform vec4 uPointer;      // xy the pour's stream in uv, zw velocity in uv per second
uniform float uPointerIn;
uniform vec4 uHand;         // xy the visitor's mouse or finger in uv, zw velocity per second
uniform float uHandIn;
uniform vec3 uDot;          // xy in uv, z radius: a dab of cream where a finger tapped
uniform vec4 uKick;         // xy in uv, z push for one step, w radius: a drop landing
uniform vec3 uDye;          // xy in uv, z radius: the corn a drop leaves where it landed
uniform float uDyeSeed;     // a different wobble of the edge for every drop
uniform float uStepDt;      // seconds per step
uniform float uAdvect;      // 1 on the steps that carry the cream (three a frame, a third each)
uniform vec2 uFlowSpoon;    // the spoon's travel over the whole frame, in uv
uniform vec2 uFlowHand;     // the hand's, likewise
uniform float uDamping;
uniform float uViscosity;
uniform float uSpiralGain;
varying vec2 vUv;

// A thick soup does not dig a hole where something moves through it: it bulges ahead and sinks
// behind (a dipole), and only in proportion to the speed.
float push(vec2 at, vec2 vel, float radius) {
	float speed = length(vel);
	if (speed < 1e-4) return 0.0;
	vec2 rel = vUv - at;
	float head = smoothstep(radius, 0.0, length(rel));
	return head * dot(rel / radius, vel / speed) * min(speed, 1.5);
}

void main() {
	vec4 c = texture2D(uPrev, vUv);
	float n = texture2D(uPrev, vUv + vec2(0.0, uTexel.y)).r;
	float s = texture2D(uPrev, vUv - vec2(0.0, uTexel.y)).r;
	float e = texture2D(uPrev, vUv + vec2(uTexel.x, 0.0)).r;
	float w = texture2D(uPrev, vUv - vec2(uTexel.x, 0.0)).r;

	// The wave equation. With 640 steps a second on a 0.5 mm grid, waves run at about 23 cm/s,
	// the slowest a real surface allows.
	float h = (n + s + e + w) * 0.5 - c.g;
	// A velvety soup: short waves are overdamped (they flatten without a single oscillation),
	// so part of every step is traded for diffusion, which kills them in proportion to k².
	h = mix(h, (n + s + e + w) * 0.25, uViscosity);
	h *= uDamping;

	h += push(uSpoon.xy, uSpoon.zw, 0.09) * uSpoonIn * 0.03 * uStepDt * 60.0;
	h += push(uPointer.xy, uPointer.zw, 0.07) * uPointerIn * 0.05 * uStepDt * 60.0;
	h += push(uHand.xy, uHand.zw, 0.12) * uHandIn * 0.012 * uStepDt * 60.0;

	// A drop makes a dimple as wide as itself, which the thick soup closes again at once.
	h += uKick.z * smoothstep(uKick.w, 0.0, length(vUv - uKick.xy));

	float inside = step(length(vUv - 0.5), 0.497);
	h = clamp(h, -0.012, 0.012) * inside;

	// Cream: carried three times a frame, a third of the frame's travel each, from where the flow
	// comes from. Few samples keep filaments sharp (a cream barely diffuses: in a minute it spreads
	// by a third of a millimetre); a thick soup drags a wide, soft wake behind what moves in it.
	float cream = c.b;
	float dye = c.a;
	if (uAdvect > 0.5) {
		vec2 flow = uFlowSpoon * smoothstep(0.13, 0.02, length(vUv - uSpoon.xy)) * uSpoonIn
			+ uFlowHand * smoothstep(0.17, 0.0, length(vUv - uHand.xy)) * uHandIn * 0.7;
		flow /= 3.0;
		float len = length(flow);
		if (len > 0.006) flow *= 0.006 / len;
		vec2 carried = texture2D(uPrev, vUv - flow).ba;
		cream = carried.x;
		dye = carried.y;
	}
	cream = max(cream, texture2D(uSpiral, vUv).r * uSpiralGain);
	cream = max(cream, smoothstep(uDot.z, uDot.z * 0.6, length(vUv - uDot.xy)) * step(0.001, uDot.z));
	cream *= inside;
	// The corn of a drop stays where it fell (it barely diffuses, and the soup's yield stress holds
	// it), until the spoon or the hand draws it out into filaments with the cream.
	// As a viscous drop spreads seen from above: an uneven, lobed edge, and a fuller rim (the liquid
	// piles up at the edge) around a thinner centre. Rim 1, centre 0.72.
	vec2 rel = vUv - uDye.xy;
	float ang = atan(rel.y, rel.x);
	float wobble = 1.0
		+ 0.045 * sin(3.0 * ang + uDyeSeed)
		+ 0.035 * sin(7.0 * ang + uDyeSeed * 2.3)
		+ 0.015 * sin(11.0 * ang + uDyeSeed * 3.7);
	float rr = uDye.z * wobble;
	float dist = length(rel);
	float spot = smoothstep(rr, rr * 0.92, dist) * mix(0.72, 1.0, smoothstep(rr * 0.55, rr * 0.85, dist));
	dye = max(dye, spot * step(0.001, uDye.z));
	dye *= inside;

	gl_FragColor = vec4(h, c.r, cream, dye);
}`;

const SIM_VERT = /* glsl */ `
varying vec2 vUv;
void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`;

export class SoupSim {
	private targets: [THREE.WebGLRenderTarget, THREE.WebGLRenderTarget];
	private scene = new THREE.Scene();
	private camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
	readonly material: THREE.ShaderMaterial;
	private flip = 0;

	constructor(spiral: THREE.Texture) {
		const make = () =>
			new THREE.WebGLRenderTarget(SIM_SIZE, SIM_SIZE, {
				type: THREE.HalfFloatType,
				format: THREE.RGBAFormat,
				minFilter: THREE.LinearFilter,
				magFilter: THREE.LinearFilter,
				depthBuffer: false,
				stencilBuffer: false,
			});
		this.targets = [make(), make()];
		this.material = new THREE.ShaderMaterial({
			vertexShader: SIM_VERT,
			fragmentShader: SIM_FRAG,
			uniforms: {
				uPrev: { value: null },
				uSpiral: { value: spiral },
				uTexel: { value: new THREE.Vector2(1 / SIM_SIZE, 1 / SIM_SIZE) },
				uSpoon: { value: new THREE.Vector4(0.5, 0.5, 0, 0) },
				uSpoonIn: { value: 0 },
				uPointer: { value: new THREE.Vector4(0.5, 0.5, 0, 0) },
				uPointerIn: { value: 0 },
				uHand: { value: new THREE.Vector4(0.5, 0.5, 0, 0) },
				uHandIn: { value: 0 },
				uDot: { value: new THREE.Vector3(0.5, 0.5, 0) },
				uKick: { value: new THREE.Vector4(0.5, 0.5, 0, 0.02) },
				uDye: { value: new THREE.Vector3(0.5, 0.5, 0) },
				uDyeSeed: { value: 0 },
				uStepDt: { value: STEP_DT },
				uAdvect: { value: 0 },
				uFlowSpoon: { value: new THREE.Vector2() },
				uFlowHand: { value: new THREE.Vector2() },
				uDamping: { value: 0.9985 },
				uViscosity: { value: 0.4 },
				uSpiralGain: { value: 0 },
			},
			depthTest: false,
			depthWrite: false,
		});
		const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.material);
		quad.frustumCulled = false;
		this.scene.add(quad);
	}

	get texture() {
		return this.targets[this.flip].texture;
	}

	clear(gl: THREE.WebGLRenderer) {
		const prevColor = new THREE.Color();
		gl.getClearColor(prevColor);
		const prevAlpha = gl.getClearAlpha();
		gl.setClearColor(0x000000, 0);
		for (const t of this.targets) {
			gl.setRenderTarget(t);
			gl.clear(true, false, false);
		}
		gl.setRenderTarget(null);
		gl.setClearColor(prevColor, prevAlpha);
	}

	step(gl: THREE.WebGLRenderer) {
		const read = this.targets[this.flip];
		const write = this.targets[1 - this.flip];
		this.material.uniforms.uPrev.value = read.texture;
		const previous = gl.getRenderTarget();
		gl.setRenderTarget(write);
		gl.render(this.scene, this.camera);
		gl.setRenderTarget(previous);
		this.flip = 1 - this.flip;
	}

	dispose() {
		this.targets.forEach(t => t.dispose());
		this.material.dispose();
	}
}

// The swirl of the icon (bowl-loader.tsx): three half circles of radius 1, 3.2 and 5.5 in a
// 32×32 box, so 9.7π long. The soup is the circle of radius 10 around (16,16); it maps onto
// the 0..1 uv square of the surface.
const SPIRAL_PATH = "M15 16a1 1 0 1 1 2 0a3.2 3.2 0 1 1-6.4 0a5.5 5.5 0 1 1 11 0";
const SPIRAL_LENGTH = 9.7 * Math.PI;

export function makeSpiral(size = 512) {
	const canvas = document.createElement("canvas");
	canvas.width = canvas.height = size;
	const ctx = canvas.getContext("2d")!;
	const path = new Path2D(SPIRAL_PATH);
	const texture = new THREE.CanvasTexture(canvas);
	texture.minFilter = THREE.LinearFilter;
	texture.generateMipmaps = false;
	// The soup plane is a hair wider than the icon's soup circle; scale the box to match.
	const k = size / 20;
	function draw(progress: number) {
		ctx.setTransform(1, 0, 0, 1, 0, 0);
		ctx.clearRect(0, 0, size, size);
		if (progress <= 0) {
			texture.needsUpdate = true;
			return;
		}
		ctx.setTransform(k, 0, 0, k, -6 * k, -6 * k);
		ctx.lineWidth = 2;
		ctx.lineCap = "round";
		ctx.strokeStyle = "#f00";
		ctx.setLineDash([SPIRAL_LENGTH * Math.min(progress, 1), SPIRAL_LENGTH]);
		ctx.stroke(path);
		texture.needsUpdate = true;
	}
	return { texture, draw };
}
