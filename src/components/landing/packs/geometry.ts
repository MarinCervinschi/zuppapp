import * as THREE from "three";

// The four packs, built in code. One unit is about 9 cm: the brick is 64×165×52 mm.

export const BRICK = { w: 0.7, h: 1.8, d: 0.57 };
export const POUCH = { w: 1.5, h: 2.05, t: 0.26 };
export const TRAY = { w: 2.0, d: 1.35, h: 0.62, r: 0.24, taper: 0.86 };
export const JAR = { r: 0.46, h: 1.12 };

/** The brick's ears: the triangles of carton folded flat against the sides at the top. */
export function earGeometry() {
	const s = new THREE.Shape();
	s.moveTo(-BRICK.d * 0.48, 0);
	s.lineTo(BRICK.d * 0.48, 0);
	s.lineTo(0, -0.24);
	s.closePath();
	const g = new THREE.ExtrudeGeometry(s, { depth: 0.012, bevelEnabled: false });
	g.rotateY(Math.PI / 2);
	return g;
}

/** A screw cap: a short cylinder with fine ribs on its side. */
export function capGeometry(r: number, h: number, ribs = 48) {
	const g = new THREE.CylinderGeometry(r, r, h, ribs * 2, 1);
	const p = g.attributes.position;
	for (let i = 0; i < p.count; i++) {
		const x = p.getX(i);
		const z = p.getZ(i);
		const rr = Math.hypot(x, z);
		if (rr > r * 0.98) {
			const a = Math.atan2(z, x);
			const k = 1 + 0.025 * Math.sign(Math.sin(a * ribs));
			p.setXYZ(i, x * k, p.getY(i), z * k);
		}
	}
	g.computeVertexNormals();
	return g;
}

/**
 * The stand-up pouch: two welded sheets. Flat at the side seals and along the top band, puffed in
 * the middle, open into a gusset at the bottom so it stands. Front, back and bottom are three
 * groups, each with its own vertices so the seams stay sharp.
 */
export function pouchGeometry(nx = 48, ny = 64) {
	const { w, h, t } = POUCH;
	const seal = 0.035;
	const pos: number[] = [];
	const uv: number[] = [];
	const idx: number[] = [];
	const thick = (u: number, v: number) => {
		const su = Math.pow(
			Math.sin(Math.PI * THREE.MathUtils.clamp((u - seal) / (1 - 2 * seal), 0, 1)),
			0.55
		);
		const top = 1 - THREE.MathUtils.smoothstep(v, 0.74, 0.9);
		const belly = 0.78 + 0.22 * Math.sin(Math.PI * Math.min(v / 0.7, 1));
		return t * su * top * belly;
	};
	const sheet = (side: 1 | -1) => {
		const base = pos.length / 3;
		for (let j = 0; j <= ny; j++) {
			for (let i = 0; i <= nx; i++) {
				const u = i / nx;
				const v = j / ny;
				// The sides draw in a little as the pouch fills, like a real one.
				const pinch =
					1 -
					0.05 *
						Math.sin(Math.PI * Math.min(v / 0.85, 1)) *
						(1 - Math.abs(u - 0.5) * 2);
				pos.push((u - 0.5) * w * pinch, v * h, side * thick(u, v));
				uv.push(side === 1 ? u : 1 - u, v);
			}
		}
		for (let j = 0; j < ny; j++) {
			for (let i = 0; i < nx; i++) {
				const a = base + j * (nx + 1) + i;
				const b = a + 1;
				const c = a + nx + 1;
				const d = c + 1;
				if (side === 1) idx.push(a, b, d, a, d, c);
				else idx.push(a, d, b, a, c, d);
			}
		}
		return base;
	};
	const g = new THREE.BufferGeometry();
	const front = sheet(1);
	const frontCount = idx.length;
	const back = sheet(-1);
	const backCount = idx.length - frontCount;
	// The bottom: a strip from the front's first row to the back's.
	const bottomStart = idx.length;
	const b0 = pos.length / 3;
	for (let i = 0; i <= nx; i++) {
		const f = (front + i) * 3;
		const k = (back + i) * 3;
		pos.push(pos[f], pos[f + 1], pos[f + 2], pos[k], pos[k + 1], pos[k + 2]);
		uv.push(i / nx, 0, i / nx, 1);
	}
	for (let i = 0; i < nx; i++) {
		const a = b0 + i * 2;
		idx.push(a, a + 1, a + 3, a, a + 3, a + 2);
	}
	g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
	g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
	g.setIndex(idx);
	g.addGroup(0, frontCount, 0);
	g.addGroup(frontCount, backCount, 1);
	g.addGroup(bottomStart, idx.length - bottomStart, 2);
	g.computeVertexNormals();
	return g;
}

function roundedRect(w: number, d: number, r: number, n = 16) {
	// Starts at the middle of the left side and runs forward, then right along the front: the
	// front's middle falls at a quarter of the outline, the back's at three quarters, so with the
	// sleeve repeated twice both long sides show the middle of the artwork.
	const pts: THREE.Vector2[] = [new THREE.Vector2(-w / 2, 0)];
	const arc = (cx: number, cz: number, a0: number, a1: number) => {
		for (let i = 0; i <= n; i++) {
			const a = a0 + ((a1 - a0) * i) / n;
			pts.push(new THREE.Vector2(cx + Math.cos(a) * r, cz + Math.sin(a) * r));
		}
	};
	arc(-w / 2 + r, d / 2 - r, Math.PI, Math.PI / 2);
	arc(w / 2 - r, d / 2 - r, Math.PI / 2, 0);
	arc(w / 2 - r, -d / 2 + r, 0, -Math.PI / 2);
	arc(-w / 2 + r, -d / 2 + r, -Math.PI / 2, -Math.PI);
	return pts;
}

/** The tray: a tapered rounded box whose walls carry the sleeve, a film on top, a rim. */
export function trayGeometry() {
	const { w, d, h, r, taper } = TRAY;
	const top = roundedRect(w, d, r);
	const bottom = roundedRect(w * taper, d * taper, r * taper);
	// Arc length along the outline, so the sleeve does not stretch at the corners.
	const len = [0];
	for (let i = 1; i < top.length; i++)
		len.push(len[i - 1] + top[i].distanceTo(top[i - 1]));
	const total = len[len.length - 1] + top[0].distanceTo(top[top.length - 1]);
	const pos: number[] = [];
	const uv: number[] = [];
	const idx: number[] = [];
	const n = top.length;
	for (let i = 0; i <= n; i++) {
		const k = i % n;
		const u = (i === n ? total : len[k]) / total;
		pos.push(bottom[k].x, 0, bottom[k].y, top[k].x, h, top[k].y);
		uv.push(u * 2, 0, u * 2, 1);
	}
	for (let i = 0; i < n; i++) {
		const a = i * 2;
		idx.push(a, a + 2, a + 3, a, a + 3, a + 1);
	}
	const walls = new THREE.BufferGeometry();
	walls.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
	walls.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
	walls.setIndex(idx);
	walls.computeVertexNormals();

	const film = new THREE.ShapeGeometry(
		new THREE.Shape(roundedRect(w - 0.12, d - 0.12, r - 0.06)),
		4
	);
	film.rotateX(-Math.PI / 2);
	film.translate(0, h + 0.012, 0);
	const fp = film.attributes.position;
	const fuv = film.attributes.uv;
	for (let i = 0; i < fp.count; i++)
		fuv.setXY(i, fp.getX(i) / (w - 0.12) + 0.5, -fp.getZ(i) / (d - 0.12) + 0.5);

	const rimShape = new THREE.Shape(roundedRect(w + 0.1, d + 0.1, r + 0.05));
	rimShape.holes.push(new THREE.Path(roundedRect(w - 0.1, d - 0.1, r - 0.05)));
	const rim = new THREE.ExtrudeGeometry(rimShape, {
		depth: 0.04,
		bevelEnabled: true,
		bevelSize: 0.012,
		bevelThickness: 0.012,
		bevelSegments: 2,
	});
	rim.rotateX(-Math.PI / 2);
	rim.translate(0, h - 0.02, 0);

	const base = new THREE.ShapeGeometry(new THREE.Shape(bottom), 4);
	base.rotateX(Math.PI / 2);
	return { walls, film, rim, base };
}

/** The jar: a lathe of glass, a label band, a ribbed lid. */
export function jarGeometry() {
	const { r, h } = JAR;
	const prof: [number, number][] = [
		[0, 0],
		[r * 0.86, 0],
		[r * 0.97, 0.03],
		[r, 0.12],
		[r, h * 0.84],
		[r * 0.94, h * 0.91],
		[r * 0.8, h * 0.95],
		[r * 0.78, h],
	];
	const glass = new THREE.LatheGeometry(
		prof.map(([x, y]) => new THREE.Vector2(x, y)),
		72
	);
	const band = new THREE.CylinderGeometry(
		r * 1.008,
		r * 1.008,
		h * 0.6,
		96,
		1,
		true,
		Math.PI,
		Math.PI * 2
	);
	band.translate(0, h * 0.47, 0);
	const lid = capGeometry(r * 0.83, 0.17, 60);
	lid.translate(0, h + 0.07, 0);
	const lidTop = new THREE.CircleGeometry(r * 0.83, 64);
	lidTop.rotateX(-Math.PI / 2);
	lidTop.translate(0, h + 0.156, 0);
	return { glass, band, lid, lidTop };
}
