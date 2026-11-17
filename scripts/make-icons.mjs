// `pnpm icons`: renders Zuppapp's icons into public/. Drawn for Zuppapp: a pumpkin soup seen from
// above, with its swirl of cream and a few seeds, on corn yellow. Nothing to credit.
import { Resvg } from "@resvg/resvg-js";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { inflateSync } from "node:zlib";

const out = new URL("../public", import.meta.url).pathname;
mkdirSync(out, { recursive: true });

// DESIGN.md: ink, corn (`field`), pumpkin, pea, and the raised paper for the cream and the rim.
const INK = "#16120f";
const CORN = "#ffc93c";
const PUMPKIN = "#ff6a13";
const PEA = "#8fd16a";
const CREAM = "#f8f2ea";

// The bowl on a 64 grid, centred: ink rim, paper band, soup, the swirl from the middle out, seeds.
const BOWL = `<circle cx="32" cy="32" r="26" fill="${INK}"/><circle cx="32" cy="32" r="23" fill="${CREAM}"/><circle cx="32" cy="32" r="19.5" fill="${PUMPKIN}"/><path d="M30.5 32a1.5 1.5 0 1 1 3 0a4.5 4.5 0 1 1-9 0a7.5 7.5 0 1 1 15 0a10.5 10.5 0 1 1-21 0" fill="none" stroke="${CREAM}" stroke-width="2.6" stroke-linecap="round"/><ellipse cx="42" cy="23" rx="1.6" ry="2.8" transform="rotate(30 42 23)" fill="${PEA}"/><ellipse cx="45" cy="27" rx="1.6" ry="2.8" transform="rotate(70 45 27)" fill="${PEA}"/><ellipse cx="37" cy="46" rx="1.6" ry="2.8" transform="rotate(-60 37 46)" fill="${PEA}"/>`;

// Tab size, on a 32 grid: no seeds and one turn less of cream, or they melt at 16 px.
const SMALL_BOWL = `<circle cx="16" cy="16" r="13.5" fill="${INK}"/><circle cx="16" cy="16" r="10" fill="${PUMPKIN}"/><path d="M15 16a1 1 0 1 1 2 0a3.2 3.2 0 1 1-6.4 0a5.5 5.5 0 1 1 11 0" fill="none" stroke="${CREAM}" stroke-width="2" stroke-linecap="round"/>`;

// `rounded` for the icons shown as they are; the system rounds the Apple and maskable ones itself,
// so those fill the square. `scale` keeps a maskable bowl inside the safe circle.
function icon({ rounded, scale = 1 }) {
	const offset = (64 * (1 - scale)) / 2;
	return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64"${rounded ? ' rx="14"' : ""} fill="${CORN}"/><g transform="translate(${offset} ${offset}) scale(${scale})">${BOWL}</g></svg>`;
}

const png = (svg, size) =>
	new Resvg(svg, { fitTo: { mode: "width", value: size } }).render().asPng();

const small = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="7" fill="${CORN}"/>${SMALL_BOWL}</svg>`;
const regular = icon({ rounded: true });
const square = icon({ rounded: false });
const maskable = icon({ rounded: false, scale: 0.78 });

writeFileSync(`${out}/favicon.svg`, `${small}\n`);
writeFileSync(`${out}/apple-touch-icon.png`, png(square, 180));
writeFileSync(`${out}/icon-192.png`, png(regular, 192));
writeFileSync(`${out}/icon-512.png`, png(regular, 512));
writeFileSync(`${out}/icon-maskable-512.png`, png(maskable, 512));

// An ICO whose entries are PNGs: every browser since IE Vista reads them.
const sizes = [16, 32, 48];
const images = sizes.map(size => png(size < 48 ? small : regular, size));
const header = Buffer.alloc(6 + 16 * sizes.length);
header.writeUInt16LE(0, 0);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(sizes.length, 4);
let offset = header.length;
sizes.forEach((size, i) => {
	const at = 6 + 16 * i;
	header.writeUInt8(size, at);
	header.writeUInt8(size, at + 1);
	header.writeUInt16LE(1, at + 4);
	header.writeUInt16LE(32, at + 6);
	header.writeUInt32LE(images[i].length, at + 8);
	header.writeUInt32LE(offset, at + 12);
	offset += images[i].length;
});
writeFileSync(`${out}/favicon.ico`, Buffer.concat([header, ...images]));

// The preview of a shared link and of the home in search results, 1200 × 630. Poppins, not Clash
// Display: Clash's licence lets us use it from Fontshare, and this has to render offline.
const poppins = weight => {
	const woff = readFileSync(
		new URL(
			`../node_modules/@fontsource/poppins/files/poppins-latin-${weight}-normal.woff`,
			import.meta.url
		)
	);
	const path = `${tmpdir()}/zuppapp-poppins-${weight}.ttf`;
	writeFileSync(path, woffToSfnt(woff));
	return path;
};

const og = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630"><rect width="1200" height="630" fill="${CORN}"/><g transform="translate(700 75) scale(7.5)">${BOWL}</g><text x="80" y="300" font-family="Poppins" font-weight="700" font-size="112" fill="${INK}">Zuppapp</text><text font-family="Poppins" font-weight="500" font-size="44" fill="${INK}"><tspan x="84" y="385">Le zuppe pronte,</tspan><tspan x="84" y="443">votate con le stelle.</tspan></text></svg>`;
writeFileSync(
	`${out}/og.png`,
	new Resvg(og, {
		font: { loadSystemFonts: false, fontFiles: [poppins(700), poppins(500)] },
	})
		.render()
		.asPng()
);

/** WOFF 1.0 to the TrueType it wraps: resvg reads only the latter, @fontsource ships only the former. */
function woffToSfnt(woff) {
	const numTables = woff.readUInt16BE(12);
	const tables = Array.from({ length: numTables }, (_, i) => {
		const at = 44 + 20 * i;
		const offset = woff.readUInt32BE(at + 4);
		const compLength = woff.readUInt32BE(at + 8);
		const origLength = woff.readUInt32BE(at + 12);
		const raw = woff.subarray(offset, offset + compLength);
		return {
			tag: woff.subarray(at, at + 4),
			checksum: woff.readUInt32BE(at + 16),
			data: compLength < origLength ? inflateSync(raw) : raw,
		};
	});
	const pow = 2 ** Math.floor(Math.log2(numTables));
	const head = Buffer.alloc(12 + 16 * numTables);
	woff.copy(head, 0, 4, 8);
	head.writeUInt16BE(numTables, 4);
	head.writeUInt16BE(pow * 16, 6);
	head.writeUInt16BE(Math.log2(pow), 8);
	head.writeUInt16BE((numTables - pow) * 16, 10);
	const parts = [head];
	let offset = head.length;
	tables.forEach(({ tag, checksum, data }, i) => {
		const at = 12 + 16 * i;
		tag.copy(head, at);
		head.writeUInt32BE(checksum, at + 4);
		head.writeUInt32BE(offset, at + 8);
		head.writeUInt32BE(data.length, at + 12);
		const padded = Buffer.alloc((data.length + 3) & ~3);
		data.copy(padded);
		parts.push(padded);
		offset += padded.length;
	});
	return Buffer.concat(parts);
}
