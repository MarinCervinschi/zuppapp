import * as THREE from "three";

// The surface of the soup as a height field on the GPU: the wave equation on a 256² grid,
// ping-ponged between two render targets. One texel is one point of the surface:
//   R = height now, G = height a step ago, B = cream (0 soup, 1 cream).
// The cream is carried along by the spoon (a fake semi-Lagrangian advection), so the swirl of
// the logo smears when you stir.

export const SIM_SIZE = 256;

const SIM_FRAG = /* glsl */ `
uniform sampler2D uPrev;
uniform sampler2D uSpiral;
uniform vec2 uTexel;
uniform vec4 uSpoon;        // xy tip in uv, zw velocity in uv per step
uniform float uSpoonIn;     // 0 above the soup, 1 dipped
uniform vec4 uPointer;      // xy pointer in uv, zw velocity in uv per step
uniform float uPointerIn;
uniform float uDamping;
uniform float uViscosity;
uniform float uSpiralGain;
varying vec2 vUv;

void main() {
	vec4 c = texture2D(uPrev, vUv);
	float n = texture2D(uPrev, vUv + vec2(0.0, uTexel.y)).r;
	float s = texture2D(uPrev, vUv - vec2(0.0, uTexel.y)).r;
	float e = texture2D(uPrev, vUv + vec2(uTexel.x, 0.0)).r;
	float w = texture2D(uPrev, vUv - vec2(uTexel.x, 0.0)).r;

	float h = (n + s + e + w) * 0.5 - c.g;
	// A velvety soup: part of the wave is traded for diffusion, so the crests flatten fast.
	h = mix(h, (n + s + e + w) * 0.25, uViscosity);
	h *= uDamping;

	// The spoon and the pointer push the surface in proportion to how fast they move.
	float dSpoon = length(vUv - uSpoon.xy);
	float spoonHead = smoothstep(0.075, 0.0, dSpoon) * uSpoonIn;
	h -= spoonHead * min(length(uSpoon.zw), 0.02) * 4.0;
	float dPointer = length(vUv - uPointer.xy);
	float pointerHead = smoothstep(0.06, 0.0, dPointer) * uPointerIn;
	h -= pointerHead * min(length(uPointer.zw), 0.03) * 3.0;

	float inside = step(length(vUv - 0.5), 0.497);
	// A steady push (the pour) must not dig a hole forever: the surface only ever ripples.
	h = clamp(h, -0.012, 0.012) * inside;

	// Cream: fetched from where the flow comes from. The spoon drags a wider wake than its head.
	vec2 flow = uSpoon.zw * smoothstep(0.13, 0.02, dSpoon) * uSpoonIn
		+ uPointer.zw * smoothstep(0.09, 0.0, dPointer) * uPointerIn * 0.6;
	float len = length(flow);
	if (len > 0.006) flow *= 0.006 / len;
	float cream = texture2D(uPrev, vUv - flow).b;
	cream = max(cream, texture2D(uSpiral, vUv).r * uSpiralGain);
	cream *= inside;

	gl_FragColor = vec4(h, c.r, cream, 1.0);
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
				uDamping: { value: 0.985 },
				uViscosity: { value: 0.18 },
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
