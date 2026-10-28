import { useEffect, useRef, useState } from "react";

import { createDetector } from "@/lib/barcode/detector";
import { isValidGtin } from "@/lib/barcode/ean13";

type State = "starting" | "scanning" | "denied" | "unavailable";

const MESSAGES: Record<State, string> = {
	starting: "Accendo la fotocamera…",
	scanning: "Inquadra il codice a barre della confezione, in orizzontale.",
	denied:
		"La fotocamera è bloccata. Permettila dalle impostazioni del browser, o scrivi le cifre qui sotto.",
	unavailable: "Qui la fotocamera non si accende: scrivi le cifre qui sotto.",
};

// A frame every 150 ms is plenty for a code held still, and leaves the phone cool.
const FRAME_MS = 150;

/**
 * The back camera in a frame. A code counts when it is read twice in a row and its check digit
 * holds: one misread bar can't send anyone to the wrong soup. The camera turns off on the way out.
 */
export function Scanner({ onCode }: { onCode: (code: string) => void }) {
	const video = useRef<HTMLVideoElement>(null);
	const [state, setState] = useState<State>("starting");
	const found = useRef(onCode);
	found.current = onCode;

	useEffect(() => {
		let stream: MediaStream | null = null;
		let stopped = false;
		let timer: ReturnType<typeof setTimeout> | undefined;
		const stop = () => {
			stopped = true;
			clearTimeout(timer);
			stream?.getTracks().forEach(track => track.stop());
		};

		(async () => {
			if (!navigator.mediaDevices?.getUserMedia) return setState("unavailable");
			try {
				stream = await navigator.mediaDevices.getUserMedia({
					video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 } },
					audio: false,
				});
			} catch (error) {
				if (!stopped)
					setState(
						error instanceof DOMException && error.name === "NotAllowedError"
							? "denied"
							: "unavailable"
					);
				return;
			}
			const element = video.current;
			if (stopped || !element) return stop();
			element.srcObject = stream;
			await element.play().catch(() => {});
			const detector = await createDetector().catch(() => null);
			if (stopped) return;
			if (!detector) return setState("unavailable");
			setState("scanning");

			let last = "";
			const tick = async () => {
				if (stopped) return;
				if (element.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
					const codes = await detector.detect(element).catch(() => []);
					const code = codes.map(item => item.rawValue).find(isValidGtin) ?? "";
					if (code && code === last) {
						stop();
						navigator.vibrate?.(40);
						found.current(code);
						return;
					}
					last = code;
				}
				timer = setTimeout(tick, FRAME_MS);
			};
			tick();
		})();
		return stop;
	}, []);

	const live = state === "starting" || state === "scanning";

	return (
		<div className="flex flex-col gap-3">
			{live && (
				<div className="rounded-card relative aspect-[3/4] w-full overflow-hidden bg-black sm:aspect-[4/3]">
					<video
						ref={video}
						muted
						playsInline
						aria-hidden
						className="absolute inset-0 size-full object-cover"
					/>
					{/* The guide: a clear slot the shape of a barcode, the rest dimmed around it. */}
					<div
						aria-hidden
						className="viewfinder rounded-thumb absolute inset-x-[12%] top-1/2 h-[28%] -translate-y-1/2 border-2 border-white/90"
					/>
				</div>
			)}
			<p role="status" className="text-body text-center">
				{MESSAGES[state]}
			</p>
		</div>
	);
}
