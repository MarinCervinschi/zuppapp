import { useEffect, useRef } from "react";

// How far ahead a flick carries the sheet when the finger lets go, in ms of its speed.
export const FLICK_MS = 160;

/**
 * Drag a sheet by its handle or anything marked `data-drag` (by any spot that is not a control, when
 * `anywhere`): it follows the finger and, let go, `release` gets where it would land if the flick
 * carried on, to pick a stop. The position is set on the element itself while the finger moves,
 * never through React state.
 */
export function useSheetDrag(
	panel: React.RefObject<HTMLDivElement | null>,
	handlers: {
		enabled: () => boolean;
		anywhere: () => boolean;
		rest: () => number;
		place: (offset: number) => void;
		release: (projected: number) => void;
	}
) {
	const latest = useRef(handlers);
	latest.current = handlers;

	useEffect(() => {
		const element = panel.current;
		if (!element) return;
		let start: { y: number; t: number; rest: number } | null = null;
		let last = { y: 0, t: 0 };
		let speed = 0;

		function down(event: PointerEvent) {
			const h = latest.current;
			if (!h.enabled() || event.button !== 0) return;
			const target = event.target as HTMLElement;
			// Controls keep their taps, except the handle's own button, which is also what a thumb grabs.
			if (
				!target.closest("[data-handle]") &&
				target.closest("button, a, input, select, textarea, label, [role=radio]")
			)
				return;
			if (!h.anywhere() && !target.closest("[data-drag]")) return;
			start = { y: event.clientY, t: event.timeStamp, rest: h.rest() };
			last = { y: event.clientY, t: event.timeStamp };
			speed = 0;
		}
		function move(event: PointerEvent) {
			if (!start) return;
			const dy = event.clientY - start.y;
			// A tap is not a drag: the sheet waits for a few pixels before it moves.
			if (!element!.dataset.dragging && Math.abs(dy) < 4) return;
			if (!element!.dataset.dragging) {
				// Captured only once it is a drag: a capture from the press would send the tap's click to the
				// panel instead of what was tapped. A pointer the browser does not track (a synthetic one)
				// cannot be captured, and the drag still works without it.
				try {
					element!.setPointerCapture(event.pointerId);
				} catch {}
			}
			element!.dataset.dragging = "true";
			const dt = Math.max(1, event.timeStamp - last.t);
			speed = (event.clientY - last.y) / dt;
			last = { y: event.clientY, t: event.timeStamp };
			let offset = start.rest + dy;
			// Above the top it resists, like a sheet that is already as tall as it gets.
			if (offset < 0) offset /= 3;
			latest.current.place(offset);
		}
		function up() {
			if (!start) return;
			const moved = Boolean(element!.dataset.dragging);
			const offset = start.rest + (last.y - start.y);
			start = null;
			delete element!.dataset.dragging;
			if (moved) {
				// Tells the click that follows a drag apart from a tap, until that click has passed.
				element!.dataset.dragged = "true";
				setTimeout(() => delete element!.dataset.dragged, 0);
				latest.current.release(offset + speed * FLICK_MS);
			}
		}

		element.addEventListener("pointerdown", down);
		element.addEventListener("pointermove", move);
		element.addEventListener("pointerup", up);
		element.addEventListener("pointercancel", up);
		return () => {
			element.removeEventListener("pointerdown", down);
			element.removeEventListener("pointermove", move);
			element.removeEventListener("pointerup", up);
			element.removeEventListener("pointercancel", up);
		};
	}, [panel]);
}
