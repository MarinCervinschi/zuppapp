import zxingWasmUrl from "zxing-wasm/reader/zxing_reader.wasm?url";

// Browser only. Chrome on Android has a native BarcodeDetector; Safari on iPhone doesn't, so
// there the same API comes from zxing compiled to WebAssembly. The .wasm is served by us, not
// by jsDelivr as the package would by default: no third party learns who scans.

const FORMATS = ["ean_13", "ean_8", "upc_a"] as const;

type Ponyfill = typeof import("barcode-detector/ponyfill");

export type Detector = {
	detect: (source: HTMLVideoElement) => Promise<{ rawValue: string }[]>;
};

export async function createDetector(): Promise<Detector> {
	const Native = (globalThis as { BarcodeDetector?: Ponyfill["BarcodeDetector"] })
		.BarcodeDetector;
	if (Native) {
		const supported: readonly string[] = await Native.getSupportedFormats().catch(
			() => []
		);
		if (FORMATS.every(format => supported.includes(format)))
			return new Native({ formats: [...FORMATS] });
	}
	const { BarcodeDetector, prepareZXingModule } =
		await import("barcode-detector/ponyfill");
	prepareZXingModule({
		overrides: {
			locateFile: (path: string, prefix: string) =>
				path.endsWith(".wasm") ? zxingWasmUrl : prefix + path,
		},
	});
	return new BarcodeDetector({ formats: [...FORMATS] });
}
