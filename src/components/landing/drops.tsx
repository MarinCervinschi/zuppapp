import { useMemo, useRef } from "react";

import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

import {
	auroraBand,
	auroraClock,
	calmHem,
	dripA,
	dripB,
	dripCalm,
	dripFreeze,
} from "./aurora";
import { LIGHT, flatMat } from "./packs/materials";
import { C } from "./palette";
import { soupState } from "./soup-bowl";
import { BOWL, director, reduced } from "./story";

// Drops of corn that gather on the aurora's hem and fall into the pumpkin soup, after slow-motion
// footage of glycerol dripping and of drops landing in viscous baths (ricerca/14):
//   swell   a lobe grows under the hem, one piece with it;
//   pear    the bulb sinks, its shoulders sloping into a concave meniscus;
//   neck    the neck stretches into a thread, thinnest a third of the way down, to 1-2 px;
//   break   in one frame, with no satellite; the stub springs back into a little cone;
//   fall    at real gravity (153 units/s²: 1 unit is 6.4 cm), rounding off from a pear;
//   land    a hollow twice as wide as the drop, closing from the bottom, no crown, no jet;
//   after   a spot of corn about three drops wide, which stays: in a velvet soup a colour moves
//           a third of a millimetre a minute, until the spoon draws it out into filaments.
// The sizes are drawn bigger than life (a real drop would be 8-10 px on a phone, 14 is the least
// that reads); the times and the order of events are the real ones. The scroll only decides
// whether drops may start (scene 1, at rest); the clock runs them.

const GRAVITY = 153;
const UP = new THREE.Vector3(0, 1, 0);
const SWELL = 0.8;
const PEAR = 0.3;
const NECK = 0.65;
const RECOIL = 0.05;
const SPREAD = 0.07;
const CALM_IN = 1.2;
const CALM_OUT = 3;
/** How fast the hem goes on rolling where a drop hangs: slowly, so it has little to catch up. */
const HELD_RATE = 0.3;
/** The drop's diameter on screen, as a share of the bowl's width, kept between 16 and 34 px. */
const SIZE = 0.05;
/** How far the bulb's centre ends up below the hem, in drop diameters: bulb, thread 1.5 D. */
const REACH = 2.2;

type Drop = {
	phase: "idle" | "settle" | "swell" | "pear" | "neck" | "fall" | "spread";
	t: number;
	x: number;
	D: number;
	c: number;
	uv: THREE.Vector2;
	pos: THREE.Vector3;
	vy: number;
	size: number;
	stub: number;
	/** Seconds since the thread broke, for the stub. */
	since: number;
	/** How calm the hem is around it, eased: the curtain never jumps. */
	calm: number;
	/** The calm's own clock, 0..1, before easing. */
	calmT: number;
	/** The curtain's time at which the hem holds still around it. */
	freeze: number;
};

export function Drops() {
	// Corn, flat like everything else, with no outline: nothing changes when it lets go of the
	// hem. Over the soup its shadow tells how high it is.
	const body = useMemo(() => flatMat(C.corn, [1, 0.62, 0.2]), []);
	const groups = [useRef<THREE.Group>(null), useRef<THREE.Group>(null)];
	const st = useMemo(
		() => ({
			drops: [0, 1].map((): Drop => ({
				phase: "idle",
				t: 0,
				x: 0,
				D: 0,
				c: 0,
				uv: new THREE.Vector2(),
				pos: new THREE.Vector3(),
				vy: 0,
				size: 0.05,
				stub: 0,
				since: 0,
				calm: 0,
				calmT: 0,
				freeze: 0,
			})),
			next: 2,
			v: new THREE.Vector3(),
			w: new THREE.Vector3(),
			spot: new THREE.Vector3(),
		}),
		[]
	);

	useFrame((state, frameDt) => {
		const dt = Math.min(frameDt, 1 / 20);
		const cam = state.camera as THREE.PerspectiveCamera;
		const { width: W, height: H } = state.size;
		const dpr = state.viewport.dpr;
		const band = auroraBand(W / H > 1.1);
		const R = soupState.radius;
		const soupY = soupState.at.y + soupState.level;

		const screen = (p: THREE.Vector3) => {
			const n = st.v.copy(p).project(cam);
			return [(n.x * 0.5 + 0.5) * W * dpr, (n.y * 0.5 + 0.5) * H * dpr] as const;
		};
		// The calm hem's height on screen above a given x, exactly as the shader draws it, at the
		// curtain's time t (a drop's own held time, where it hangs).
		const hemPx = (x: number, t = auroraClock.t) => {
			const xb = ((x / (W * dpr) - 0.5) * (W / H)) / band;
			return (1 - band + band * calmHem(xb, t, director.speedSoft)) * H * dpr;
		};
		// The point over a spot of soup that sits at a given height on the screen.
		const above = (base: THREE.Vector3, y: number, out: THREE.Vector3) => {
			let lo = 0;
			let hi = 10;
			for (let i = 0; i < 24; i++) {
				const mid = (lo + hi) / 2;
				out.copy(base).addScaledVector(UP, mid);
				if (screen(out)[1] < y) lo = mid;
				else hi = mid;
			}
			return out.copy(base).addScaledVector(UP, (lo + hi) / 2);
		};
		const spotOf = (uv: THREE.Vector2, out: THREE.Vector3) =>
			out.set(
				soupState.at.x + (uv.x - 0.5) * 2 * R,
				soupY,
				soupState.at.z - (uv.y - 0.5) * 2 * R
			);
		// The bowl's width on screen, to size the drop.
		const left = screen(
			st.w.set(soupState.at.x - BOWL.rim, soupState.at.y + BOWL.rimY, soupState.at.z)
		)[0];
		const right = screen(
			st.w.set(soupState.at.x + BOWL.rim, soupState.at.y + BOWL.rimY, soupState.at.z)
		)[0];
		const D = THREE.MathUtils.clamp(SIZE * Math.abs(right - left), 16 * dpr, 34 * dpr);

		const G = director.G;
		const may =
			!reduced &&
			// Until the curtain starts to climb away: while the spoon stirs, a drop that lands is drawn
			// out into filaments with the cream.
			G < 1.68 &&
			director.morph >= 1 &&
			director.settle >= 1 &&
			soupState.heat > 0.5;
		st.next -= dt;
		soupState.dropShadow.set(0, 0, 0, 0);
		soupState.dye.set(0, 0, 0);
		const calmWidth = 200 * dpr;

		st.drops.forEach((d, i) => {
			const g = groups[i].current!;
			const a = dripA[i];
			const b = dripB[i];

			// The hem calms down around a drop and back, never at once.
			const wantCalm =
				d.phase === "idle" || (d.phase === "spread" && b.y < 0.5) ? 0 : 1;
			// Eased at both ends (slow, then a little faster, then slow again), never the sudden
			// start of an exponential: the hem relaxes instead of jumping. Calming takes 1.2 s,
			// letting go 1.6 s.
			d.calmT = THREE.MathUtils.clamp(
				d.calmT + (wantCalm ? dt / CALM_IN : -dt / CALM_OUT),
				0,
				1
			);
			d.calm = d.calmT * d.calmT * (3 - 2 * d.calmT);
			if (i === 0) dripCalm.x = d.calm;
			else dripCalm.y = d.calm;
			// Once the drop hangs, the hem under it keeps rolling, slowly: when it lets go there is
			// little left to catch up, and the curtain never snaps.
			if (d.phase !== "idle" && d.phase !== "settle")
				d.freeze += Math.min(frameDt, 0.1) * 0.5 * HELD_RATE;
			if (i === 0) dripFreeze.x = d.freeze;
			else dripFreeze.y = d.freeze;

			if (d.phase === "idle") {
				g.visible = false;
				b.set(0, 0, 0, calmWidth);
				if (!may || st.next > 0 || d.calm > 0) return;
				// Where it will land, and the x on the hem above it: a few tries, keeping the first
				// spot where the whole drop and its thread hang clear of the bowl's rim at that x.
				const rimAt = (x: number) => {
					let best = Infinity;
					let y = 0;
					for (let j = 0; j <= 24; j++) {
						const th = (j / 24) * Math.PI;
						const [sx, sy] = screen(
							st.w.set(
								soupState.at.x + BOWL.rim * Math.cos(th),
								soupState.at.y + BOWL.rimY,
								soupState.at.z - BOWL.rim * Math.sin(th)
							)
						);
						if (Math.abs(sx - x) < best) [best, y] = [Math.abs(sx - x), sy];
					}
					return y;
				};
				// A drop forms where the liquid runs to and stays: a low point of the hem, or a stretch
				// of it that is nearly flat. The hem will hold still once the calm is complete (in
				// CALM_IN), so look at the hem it will have then.
				const freeze = auroraClock.t + CALM_IN * 0.5;
				const step = 3 * dpr;
				const lows: number[] = [];
				const x0 = Math.min(left, right);
				const x1 = Math.max(left, right);
				for (let xx = x0 + step; xx < x1 - step; xx += step) {
					const h = hemPx(xx, freeze);
					const hl = hemPx(xx - step, freeze);
					const hr = hemPx(xx + step, freeze);
					const slope = (hr - hl) / (2 * step);
					// Not on a hump: from a crest the liquid runs off on both sides.
					const bend = (hl + hr - 2 * h) / (step * step);
					if (
						Math.abs(slope) < 0.3 &&
						bend > -0.0015 &&
						h - D * (REACH + 1.6) > rimAt(xx)
					)
						lows.push(xx);
				}
				let x = -1;
				if (lows.length) {
					const xm = lows[Math.floor(Math.random() * lows.length)];
					// The spot of soup straight under it: along the bowl's width as the camera sees it.
					const right3 = new THREE.Vector3().setFromMatrixColumn(cam.matrixWorld, 0);
					right3.y = 0;
					right3.normalize();
					let best = Infinity;
					const centre = new THREE.Vector3(soupState.at.x, soupY, soupState.at.z);
					for (let k = -0.85; k <= 0.85; k += 0.05) {
						const spot = centre.clone().addScaledVector(right3, k * R);
						const p = above(spot, hemPx(xm, freeze) - D * REACH, new THREE.Vector3());
						const err = Math.abs(screen(p)[0] - xm);
						if (err < best) {
							best = err;
							d.uv.set(
								(spot.x - soupState.at.x) / (2 * R) + 0.5,
								-(spot.z - soupState.at.z) / (2 * R) + 0.5
							);
						}
					}
					if (best < 8 * dpr) x = xm;
				}
				d.freeze = freeze;
				st.next = 0.5;
				if (x < 0) return;
				st.next = 2.4 + Math.random() * 1.6;
				d.x = x;
				d.D = D;
				d.t = 0;
				d.phase = "settle";
				a.set(d.x, d.D, 0, 0);
				return;
			}
			if (d.phase === "settle") {
				// The drop starts only once the hem around it has stopped rolling.
				g.visible = false;
				if (!may) d.phase = "idle";
				else if (d.calm >= 1) [d.phase, d.t] = ["swell", 0];
				return;
			}

			const R2 = d.D / 2;
			if (d.phase === "swell" || d.phase === "pear" || d.phase === "neck") {
				g.visible = false;
				if (!may && d.phase === "swell") {
					d.phase = "idle";
					return;
				}
				d.t += dt;
				let bulb = R2 * 1.1;
				let neck = 0.3 * d.D;
				if (d.phase === "swell") {
					// A lobe grows under the hem, its centre still inside it.
					const k = Math.min(d.t / SWELL, 1);
					bulb = R2 * 1.1 * (1 - Math.pow(1 - k, 3));
					d.c = bulb * (0.1 + 0.45 * k);
					neck = Math.max(bulb, 0.3 * d.D);
					if (k >= 1) [d.phase, d.t] = ["pear", 0];
				} else if (d.phase === "pear") {
					// The bulb sinks; the shoulders slope and the neck starts.
					const k = Math.min(d.t / PEAR, 1);
					d.c = R2 * 0.55 + (0.9 * d.D - R2 * 0.55) * k;
					neck = 0.3 * d.D - 0.06 * d.D * k;
					if (k >= 1) [d.phase, d.t] = ["neck", 0];
				} else {
					// The neck stretches into a thread, thinning as a viscous thread does, faster near
					// the end, down to a pixel or two.
					const k = Math.min(d.t / NECK, 1);
					d.c = 0.9 * d.D + (REACH - 0.9) * d.D * Math.pow(k, 1.5);
					neck = 0.24 * d.D * Math.pow(1 - k, 0.6) + 0.75 * dpr;
					if (k >= 1) {
						// The break: the drop is on its own in the scene; the stub springs back.
						const centre = hemPx(d.x, d.freeze) - d.c;
						above(spotOf(d.uv, st.spot), centre, d.pos);
						const depth = d.pos.distanceTo(cam.position);
						d.size =
							(R2 / (H * dpr)) * 2 * depth * Math.tan(((cam.fov / 2) * Math.PI) / 180);
						d.vy = 0;
						d.stub = (d.c - R2) / 3;
						d.since = 0;
						d.t = 0;
						d.phase = "fall";
						a.set(d.x, d.D, 0, 0);
						b.set(d.stub, 2, 0, calmWidth);
						return;
					}
				}
				a.set(d.x, d.D, d.c, neck);
				b.set(0, 1, bulb, calmWidth);
				return;
			}

			// The stub goes home in 50 ms and settles into a little cone, then into the hem.
			d.since += dt;
			const recoil = Math.min(d.since / RECOIL, 1);
			const stub =
				d.stub * (1 - recoil) +
				0.14 * d.D * recoil * Math.max(0, 1 - (d.since - RECOIL) / 0.2);
			a.set(d.x, d.D, 0, 0);
			b.set(stub, stub > 0.3 ? 2 : 0, 0, calmWidth);

			if (d.phase === "fall") {
				d.t += dt;
				// Falling at g, rounding off from the pear it was in a few frames.
				d.vy -= GRAVITY * dt;
				d.pos.y += d.vy * dt;
				const stretch = 1 + 0.3 * Math.exp(-d.t / 0.03);
				g.visible = true;
				g.position.copy(d.pos);
				g.scale.set(
					d.size / Math.sqrt(stretch),
					d.size * stretch,
					d.size / Math.sqrt(stretch)
				);
				// Its shadow on the soup, closing in and sharpening along the light as it comes down.
				const height = Math.max(d.pos.y - soupY, 0);
				const sx = d.pos.x - (LIGHT.x / LIGHT.y) * height;
				const sz = d.pos.z - (LIGHT.z / LIGHT.y) * height;
				soupState.dropShadow.set(
					(sx - soupState.at.x) / (2 * R) + 0.5,
					-(sz - soupState.at.z) / (2 * R) + 0.5,
					(d.size / (2 * R)) * (1 + height * 0.6),
					Math.max(0, 1 - height / 3)
				);
				if (d.pos.y > soupY + d.size * 0.3) return;
				// It lands: a hollow twice its width, which the soup closes from the bottom.
				g.visible = false;
				d.uv.set(
					(d.pos.x - soupState.at.x) / (2 * R) + 0.5,
					-(d.pos.z - soupState.at.z) / (2 * R) + 0.5
				);
				soupState.kick.uv.copy(d.uv);
				soupState.kick.radius = (2 * d.size) / (2 * R);
				soupState.kick.pending = true;
				soupState.dyeSeed = Math.random() * 100;
				d.t = 0;
				d.phase = "spread";
				return;
			}

			// The corn spreads to about three drops wide in a few tens of milliseconds and stays.
			d.t += dt;
			const k = Math.min(d.t / SPREAD, 1);
			const spot = ((0.5 + 0.9 * Math.sqrt(k)) * 2 * d.size) / (2 * R);
			soupState.dye.set(d.uv.x, d.uv.y, spot);
			if (d.t > SPREAD + 0.1 && b.y < 0.5) d.phase = "idle";
		});
	});

	return (
		<>
			{groups.map((ref, i) => (
				<group key={i} ref={ref} visible={false}>
					<mesh material={body}>
						<sphereGeometry args={[1, 20, 14]} />
					</mesh>
				</group>
			))}
		</>
	);
}
