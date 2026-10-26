// `pnpm icons`: renders Zuppapp's icons into public/ from the CC0 soup glyph (svgrepo.com/svg/453/soup): ink on shelf yellow.
import { Resvg } from "@resvg/resvg-js";
import { mkdirSync, writeFileSync } from "node:fs";

const out = new URL("../public", import.meta.url).pathname;
mkdirSync(out, { recursive: true });
const INK = "#1d1b19";
const FIELD = "#ffd21f";

const GLYPH = `<path d="M424.322,214.566C379.24,203.661,319.461,197.654,256,197.654s-123.239,6.006-168.322,16.911c-50.781,12.284-76.529,29.123-76.529,50.05c0,66.058,25.455,128.168,71.676,174.889C129.076,486.254,190.577,512,256,512s126.924-25.746,173.174-72.496c46.221-46.721,71.676-108.831,71.676-174.889C500.85,243.689,475.102,226.85,424.322,214.566zM256,491.602c-113.627,0-207.792-85.834-222.456-196.753c1.821,1.080,3.731,2.143,5.772,3.182C79.954,318.723,162.982,331.577,256,331.577c93.017,0,176.045-12.854,216.684-33.546c2.041-1.039,3.951-2.103,5.772-3.182C463.792,405.767,369.627,491.602,256,491.602zM71.257,288.943C113.821,275.180,182.423,266.706,256,266.706c73.575,0,142.178,8.474,184.743,22.237C398.178,302.706,329.572,311.179,256,311.179C182.427,311.179,113.822,302.706,71.257,288.943zM467.776,277.486c-42.172-19.300-122.358-31.178-211.776-31.178S86.395,258.186,44.223,277.486c-9.254-5.407-12.675-10.093-12.675-12.870c0-5.356,12.734-18.566,60.926-30.223c43.558-10.537,101.632-16.340,163.526-16.340s119.968,5.802,163.526,16.340c48.192,11.658,60.926,24.868,60.926,30.223C480.452,267.394,477.031,272.079,467.776,277.486z"/>
<path d="M233.336,155.401c-21.737,0-39.420-17.684-39.420-39.420c0-5.633-4.566-10.199-10.199-10.199s-10.199,4.567-10.199,10.199c0,32.984,26.835,59.818,59.818,59.818c5.633,0,10.199-4.567,10.199-10.199C243.536,159.968,238.969,155.401,233.336,155.401z"/>
<path d="M252.967,49.073c-5.633,0-10.199,4.567-10.199,10.199c0,5.632,4.566,10.199,10.199,10.199c21.737,0,39.421,17.684,39.421,39.420c0,5.632,4.567,10.199,10.199,10.199s10.199-4.567,10.199-10.199C312.786,75.908,285.951,49.073,252.967,49.073z"/>
<path d="M134.098,0c-5.633,0-10.199,4.567-10.199,10.199c0,5.632,4.566,10.199,10.199,10.199c21.737,0,39.420,17.684,39.420,39.420c0,5.632,4.566,10.199,10.199,10.199s10.199-4.567,10.199-10.199C193.916,26.834,167.081,0,134.098,0z"/>
<path d="M188.332,441.115c-31.290-12.281-58.833-32.958-79.649-59.797c-3.452-4.450-9.859-5.260-14.310-1.807c-4.451,3.452-5.261,9.859-1.808,14.310c23.066,29.740,53.606,52.660,88.315,66.283c1.224,0.480,2.484,0.708,3.724,0.708c4.072,0,7.919-2.456,9.497-6.476C196.158,449.091,193.576,443.173,188.332,441.115z"/>
<path d="M89.655,351.372c-2.739-5.361-5.249-10.914-7.461-16.508c-2.071-5.238-7.996-7.804-13.235-5.733c-5.238,2.070-7.804,7.997-5.734,13.236c2.451,6.196,5.231,12.348,8.265,18.287c1.804,3.530,5.380,5.561,9.091,5.561c1.561,0,3.146-0.360,4.632-1.119C90.229,362.532,92.218,356.388,89.655,351.372z"/>`;

// `scale` leaves room around the bowl; `bold` thickens the strokes for sizes where 20/512 of a
// line would melt into the yellow.
function icon({ scale, bold = 0 }) {
	const offset = ((1 - scale) * 512) / 2;
	const stroke = bold
		? ` stroke="${INK}" stroke-width="${bold}" stroke-linejoin="round"`
		: "";
	return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" fill="${FIELD}"/><g transform="translate(${offset} ${offset}) scale(${scale})" fill="${INK}"${stroke}>${GLYPH}</g></svg>`;
}

const png = (svg, size) =>
	new Resvg(svg, { fitTo: { mode: "width", value: size } }).render().asPng();

// Tab size: the same bowl redrawn on a 16 px grid, full of soup, because at 16 and 32 px the
// outlines of the original melt into the yellow.
const small = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><rect width="16" height="16" fill="${FIELD}"/><rect x="1" y="7" width="14" height="2" fill="${INK}"/><path d="M2 10h12a6 4.5 0 0 1-12 0z" fill="${INK}"/><path d="M6 1.5q1.25 1-0 2.25t0 2.25M10 1.5q1.25 1-0 2.25t0 2.25" fill="none" stroke="${INK}" stroke-width="1.5" stroke-linecap="square"/></svg>`;
const medium = icon({ scale: 0.84, bold: 12 });
const regular = icon({ scale: 0.7 });
const maskable = icon({ scale: 0.56 });

writeFileSync(
	`${out}/favicon.svg`,
	`<!-- After the CC0 soup of svgrepo.com/svg/453/soup -->\n${small}\n`
);
writeFileSync(`${out}/apple-touch-icon.png`, png(regular, 180));
writeFileSync(`${out}/icon-192.png`, png(regular, 192));
writeFileSync(`${out}/icon-512.png`, png(regular, 512));
writeFileSync(`${out}/icon-maskable-512.png`, png(maskable, 512));

// An ICO whose entries are PNGs: every browser since IE Vista reads them.
const sizes = [16, 32, 48];
const images = sizes.map(size => png(size < 48 ? small : medium, size));
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
