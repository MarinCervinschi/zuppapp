import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

import type { Soup } from "./page-head";

// A living version of the poster blobs: flat soup colour that moves slowly, with the
// stippled grain of the Minute Maid / del Valle posters at its edge. Our own WebGL, after
// looking at React Bits' Grainient and Aurora: their licence (MIT + Commons Clause) does not
// let a public repository carry the components themselves, ported or not.

/** «gocce»: three drops hanging from the top edge. «onda»: a curtain with a rolling hem. */
export type FieldShape = "gocce" | "onda";

// Each soup and the one it fades into, by primitive name: the shader needs real colours.
const PAIRS: Record<Soup, [string, string]> = {
	tomato: ["--soup-tomato", "--soup-pumpkin"],
	pumpkin: ["--soup-pumpkin", "--soup-corn"],
	corn: ["--soup-corn", "--soup-pumpkin"],
	pea: ["--soup-pea", "--soup-corn"],
	beet: ["--soup-beet", "--soup-tomato"],
};

const VERTEX = `
attribute vec2 aPosition;
void main() { gl_Position = vec4(aPosition, 0.0, 1.0); }`;

const FRAGMENT = `
precision highp float;
uniform vec2 uSize;
uniform float uTime;
uniform vec3 uCore;
uniform vec3 uRim;
uniform vec3 uGround;
uniform float uStrength;
uniform vec3 uPointer;
uniform float uShape;

float hash(vec2 p) {
	p = fract(p * vec2(234.34, 435.345));
	p += dot(p, p + 34.23);
	return fract(p.x * p.y);
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
	for (int i = 0; i < 4; i++) {
		value += amplitude * noise(p);
		p = p * 2.03 + 11.7;
		amplitude *= 0.5;
	}
	return value;
}

// How much soup is at p: 0 is paper, 1 and over is the core of the blob.
float drops(vec2 p, float aspect, float t) {
	float field = 0.0;
	for (int i = 0; i < 3; i++) {
		float k = float(i);
		vec2 centre = vec2(
			(k - 1.0) * aspect * 0.34 + 0.06 * sin(t * 0.31 + k * 2.1),
			1.02 + 0.08 * sin(t * 0.23 + k * 1.7)
		);
		float radius = 0.5 + 0.07 * sin(t * 0.4 + k * 2.6);
		vec2 d = (p - centre) * vec2(1.0, 1.2);
		field += exp(-dot(d, d) / (radius * radius));
	}
	return field;
}

float wave(vec2 p, float t) {
	// The hem of the curtain rolls along x; a second, slower swell keeps it from repeating.
	float hem = 0.62
		+ 0.12 * sin(p.x * 2.4 + t * 0.6)
		+ 0.06 * sin(p.x * 5.3 - t * 0.45 + 1.3)
		+ 0.1 * (fbm(vec2(p.x * 0.9 + t * 0.08, t * 0.05)) - 0.5);
	// A firm hem, so the curtain reads as a shape; the core deepens towards the top.
	return smoothstep(hem - 0.07, hem + 0.05, p.y) * (0.8 + 0.6 * smoothstep(hem, 1.0, p.y));
}

void main() {
	vec2 uv = gl_FragCoord.xy / uSize;
	float aspect = uSize.x / uSize.y;
	vec2 p = vec2((uv.x - 0.5) * aspect, uv.y);
	float t = uTime;

	// Bend the space a little, so no edge is ever a clean geometric curve.
	vec2 bend = vec2(fbm(p * 1.7 + vec2(t * 0.06, 3.1)), fbm(p * 1.7 + vec2(7.4, t * 0.05))) - 0.5;
	vec2 q = p + bend * 0.32;

	float field = uShape < 0.5 ? drops(q, aspect, t) : wave(q, t);

	// The pointer leans the soup towards it, softly.
	vec2 toPointer = (q - vec2((uPointer.x - 0.5) * aspect, uPointer.y)) * vec2(1.0, 1.3);
	field += uPointer.z * 0.45 * exp(-dot(toPointer, toPointer) / 0.06);

	float body = smoothstep(0.32, 0.78, field);
	// The posters' stipple: near the edge each grain is either soup or paper.
	float grain = hash(floor(gl_FragCoord.xy));
	float edge = body * (1.0 - body) * 4.0;
	float speckled = mix(body, step(grain, body), 0.6 * edge);

	vec3 soup = mix(uRim, uCore, smoothstep(0.75, 1.35, field));
	vec3 colour = mix(uGround, soup, speckled * uStrength);
	// A faint tooth over the whole sheet, darker grains in the soup than on the paper.
	colour *= 1.0 + (hash(floor(gl_FragCoord.xy) + 17.0) - 0.5) * 0.06 * speckled;
	// The foot is the page's own paper, exactly, so the header has no edge.
	colour = mix(uGround, colour, smoothstep(0.0, 0.3, uv.y));
	gl_FragColor = vec4(colour, 1.0);
}`;

function hexToRgb(value: string): [number, number, number] | null {
	const hex = value.trim().replace("#", "");
	if (!/^[0-9a-f]{6}$/i.test(hex)) return null;
	return [0, 2, 4].map(i => parseInt(hex.slice(i, i + 2), 16) / 255) as [
		number,
		number,
		number,
	];
}

/** The colours of the current theme, read from the CSS custom properties. */
function readColours(soup: Soup) {
	const style = getComputedStyle(document.documentElement);
	const read = (name: string) => hexToRgb(style.getPropertyValue(name)) ?? [1, 1, 1];
	const strength = parseFloat(style.getPropertyValue("--blob-strength")) / 100;
	return {
		core: read(PAIRS[soup][0]),
		rim: read(PAIRS[soup][1]),
		ground: read("--cream-100"),
		strength: Number.isFinite(strength) ? strength : 1,
	};
}

function compile(gl: WebGLRenderingContext, type: number, source: string) {
	const shader = gl.createShader(type);
	if (!shader) return null;
	gl.shaderSource(shader, source);
	gl.compileShader(shader);
	if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) return shader;
	gl.deleteShader(shader);
	return null;
}

/**
 * The soup field behind a header: drawn in WebGL, it moves slowly, leans towards the mouse and
 * fades in over the CSS blob, which stays underneath for when WebGL is missing. It draws one
 * still frame under reduced motion, pauses off screen and in a hidden tab, and follows the theme.
 */
export function SoupField({
	soup,
	shape = "gocce",
	className,
}: {
	soup: Soup;
	shape?: FieldShape;
	className?: string;
}) {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const [ready, setReady] = useState(false);

	useEffect(() => {
		const canvas = canvasRef.current;
		const gl = canvas?.getContext("webgl", {
			alpha: false,
			antialias: false,
			depth: false,
			stencil: false,
			powerPreference: "low-power",
		});
		if (!canvas || !gl) return;

		const vertex = compile(gl, gl.VERTEX_SHADER, VERTEX);
		const fragment = compile(gl, gl.FRAGMENT_SHADER, FRAGMENT);
		const program = gl.createProgram();
		if (!vertex || !fragment || !program) return;
		gl.attachShader(program, vertex);
		gl.attachShader(program, fragment);
		gl.linkProgram(program);
		if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return;
		gl.useProgram(program);

		// One triangle that covers the whole canvas.
		const buffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
		gl.bufferData(
			gl.ARRAY_BUFFER,
			new Float32Array([-1, -1, 3, -1, -1, 3]),
			gl.STATIC_DRAW
		);
		const position = gl.getAttribLocation(program, "aPosition");
		gl.enableVertexAttribArray(position);
		gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

		const at = (name: string) => gl.getUniformLocation(program, name);
		const u = {
			size: at("uSize"),
			time: at("uTime"),
			core: at("uCore"),
			rim: at("uRim"),
			ground: at("uGround"),
			strength: at("uStrength"),
			pointer: at("uPointer"),
			shape: at("uShape"),
		};

		const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
		const pointer = { x: 0.5, y: 0.5, sx: 0.5, sy: 0.5, on: 0, target: 0 };
		let colours = readColours(soup);
		let time = Math.random() * 40;
		let last = 0;
		let raf = 0;
		let visible = true;

		function draw() {
			gl!.uniform2f(u.size, canvas!.width, canvas!.height);
			gl!.uniform1f(u.time, time);
			gl!.uniform3fv(u.core, colours.core);
			gl!.uniform3fv(u.rim, colours.rim);
			gl!.uniform3fv(u.ground, colours.ground);
			gl!.uniform1f(u.strength, colours.strength);
			gl!.uniform3f(u.pointer, pointer.sx, pointer.sy, pointer.on);
			gl!.uniform1f(u.shape, shape === "onda" ? 1 : 0);
			gl!.drawArrays(gl!.TRIANGLES, 0, 3);
		}

		// Thirty frames a second is plenty for something this slow, and half the battery.
		function frame(now: number) {
			raf = 0;
			if (!visible || document.hidden) return;
			const dt = last ? Math.min((now - last) / 1000, 0.1) : 1 / 30;
			if (now - last < 1000 / 31) {
				raf = requestAnimationFrame(frame);
				return;
			}
			last = now;
			time += dt * 0.5;
			const follow = 1 - Math.exp(-dt / 0.25);
			pointer.sx += (pointer.x - pointer.sx) * follow;
			pointer.sy += (pointer.y - pointer.sy) * follow;
			pointer.on += (pointer.target - pointer.on) * follow;
			draw();
			raf = requestAnimationFrame(frame);
		}

		function wake() {
			if (still) return draw();
			if (!raf && visible && !document.hidden) raf = requestAnimationFrame(frame);
		}

		function resize() {
			const ratio = Math.min(window.devicePixelRatio || 1, 1.5);
			canvas!.width = Math.max(1, Math.round(canvas!.clientWidth * ratio));
			canvas!.height = Math.max(1, Math.round(canvas!.clientHeight * ratio));
			gl!.viewport(0, 0, canvas!.width, canvas!.height);
			draw();
		}

		function onPointer(event: PointerEvent) {
			if (event.pointerType !== "mouse" || still) return;
			const rect = canvas!.getBoundingClientRect();
			const x = (event.clientX - rect.left) / rect.width;
			const y = 1 - (event.clientY - rect.top) / rect.height;
			const inside = x >= 0 && x <= 1 && y >= 0 && y <= 1;
			pointer.target = inside ? 1 : 0;
			if (inside) {
				pointer.x = x;
				pointer.y = y;
			}
		}

		// The theme lives on <html data-theme> or in the system setting: follow both.
		function onTheme() {
			colours = readColours(soup);
			draw();
		}
		const themeObserver = new MutationObserver(onTheme);
		themeObserver.observe(document.documentElement, {
			attributeFilter: ["data-theme"],
		});
		const scheme = window.matchMedia("(prefers-color-scheme: dark)");
		scheme.addEventListener("change", onTheme);

		const resizeObserver = new ResizeObserver(resize);
		resizeObserver.observe(canvas);
		const intersection = new IntersectionObserver(entries => {
			visible = entries.some(entry => entry.isIntersecting);
			if (visible) wake();
		});
		intersection.observe(canvas);
		const onVisibility = () => wake();
		document.addEventListener("visibilitychange", onVisibility);
		window.addEventListener("pointermove", onPointer, { passive: true });

		resize();
		wake();
		setReady(true);

		return () => {
			cancelAnimationFrame(raf);
			themeObserver.disconnect();
			scheme.removeEventListener("change", onTheme);
			resizeObserver.disconnect();
			intersection.disconnect();
			document.removeEventListener("visibilitychange", onVisibility);
			window.removeEventListener("pointermove", onPointer);
			gl.deleteBuffer(buffer);
			gl.deleteProgram(program);
			gl.deleteShader(vertex);
			gl.deleteShader(fragment);
		};
	}, [soup, shape]);

	return (
		<canvas
			ref={canvasRef}
			aria-hidden
			className={cn(
				"fade-foot pointer-events-none absolute inset-0 -z-10 block size-full transition-opacity duration-700 ease-out",
				ready ? "opacity-100" : "opacity-0",
				className
			)}
		/>
	);
}
