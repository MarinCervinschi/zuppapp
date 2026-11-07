import {
	useCallback,
	useEffect,
	useId,
	useLayoutEffect,
	useRef,
	useState,
} from "react";

import { SHEET_TOASTER, sheetOpened } from "@/lib/toast";
import { cn } from "@/lib/utils";

import { CloseIcon } from "./icons";
import { AppToaster } from "./toaster";
import { FLICK_MS, useSheetDrag } from "./use-sheet-drag";

const CLOSE_MS = 320;
// How much wheel it takes to move the sheet one step, and how long it then ignores the wheel.
const WHEEL_PX = 60;
const WHEEL_LOCK_MS = 600;

type Props = {
	/** The sheet's name, its h2: what a screen reader hears when it opens. */
	title: React.ReactNode;
	/** A line under the title. */
	subtitle?: React.ReactNode;
	/** A picture before the title (a pack's photo); the title then steps down a size. */
	media?: React.ReactNode;
	/** Controls before the close button («Azzera»). */
	actions?: React.ReactNode;
	/** Called once the sheet has slid away: the owner unmounts it (or goes back in history). */
	onClosed: () => void;
	/**
	 * Two heights on a phone: a preview, as tall as the element marked `data-sheet-peek`, and the
	 * whole screen. Dragged up it grows into the full sheet, dragged down it goes back, then closes.
	 */
	detents?: boolean;
	/** On a wide screen: a panel along the right edge, or a popup in the middle. */
	wide?: "panel" | "popup";
	children: (close: () => void) => React.ReactNode;
};

type Mode = "bottom" | "right" | "center";

/**
 * A sheet from the bottom edge, the phone's own way to show more without leaving the page. A native
 * modal dialog, so focus stays inside, Escape closes it and the page behind is inert. Its position
 * is one transform the code sets: it enters, stops and leaves on the same transition, and while a
 * finger drags it follows the finger with none. On a wide screen it is a panel from the right or a
 * popup in the middle; with reduced motion it only fades.
 *
 * Every sheet has the same top: the handle, then the header with the title and the close button.
 * Both drag the sheet; on a sheet with two heights a tap on the header opens it all, as the
 * handle's button does for the keyboard.
 */
export function Sheet({
	title,
	subtitle,
	media,
	actions,
	onClosed,
	detents = false,
	wide = "panel",
	children,
}: Props) {
	const titleId = useId();
	const dialog = useRef<HTMLDialogElement>(null);
	const panel = useRef<HTMLDivElement>(null);
	const scroller = useRef<HTMLDivElement>(null);
	const [closing, setClosing] = useState(false);
	const [full, setFull] = useState(false);
	// Where the sheet rests, in px from its own top: 0 is fully open.
	const rest = useRef(0);
	// Whether it is fully open, for listeners that outlive a render.
	const fullNow = useRef(false);

	const mode = useCallback((): Mode => {
		if (!window.matchMedia("(min-width: 64rem)").matches) return "bottom";
		return wide === "panel" ? "right" : "center";
	}, [wide]);

	/** How far the panel must move to be out of sight. */
	const hiddenOffset = useCallback(() => {
		const element = panel.current;
		if (!element) return 0;
		return mode() === "right" ? element.offsetWidth + 24 : element.offsetHeight;
	}, [mode]);

	/** The offset of the preview: the full height less the peek's, within sensible bounds. */
	const peekOffset = useCallback(() => {
		const element = panel.current;
		const peek = element?.querySelector<HTMLElement>("[data-sheet-peek]");
		if (!element) return 0;
		const height = element.offsetHeight;
		// Nothing marked yet: half the screen, never the whole sheet.
		if (!peek) return height * 0.5;
		// Measured as if the content were scrolled to the top, where the preview always shows it.
		const shown =
			peek.getBoundingClientRect().bottom -
			element.getBoundingClientRect().top +
			(scroller.current?.scrollTop ?? 0) +
			24;
		// About half the screen: never so short it looks like a toast, never so tall it is the
		// whole sheet already.
		return Math.max(0, height - Math.min(Math.max(shown, height * 0.4), height * 0.68));
	}, []);

	const place = useCallback(
		(offset: number) => {
			const element = panel.current;
			// The popup in the middle does not travel: it fades and rises a little (data-shown).
			if (!element || mode() === "center") return;
			element.style.setProperty(mode() === "right" ? "--x" : "--y", `${offset}px`);
		},
		[mode]
	);

	/** Where entering starts and leaving ends: out of sight, or, with reduced motion, right here. */
	const away = useCallback(
		() =>
			window.matchMedia("(prefers-reduced-motion: reduce)").matches
				? rest.current
				: hiddenOffset(),
		[hiddenOffset]
	);

	// Open, then in: the dialog must be open before anything is measured (closed, it has no size),
	// and the sheet starts out of sight and moves to its resting place on the next frame, so the
	// transition runs.
	useLayoutEffect(() => {
		const modal = dialog.current;
		const element = panel.current;
		if (!modal || !element) return;
		// Out of sight before anything is measured: a measurement fixes the style the transition
		// starts from, and the sheet would slide in from fully open (from the top) instead.
		if (mode() === "right") element.style.setProperty("--x", "calc(100% + 24px)");
		else element.style.setProperty("--y", "100%");
		// Whoever opened the sheet gets the focus back when it goes, however it goes (a button, the
		// back button, a drag): the dialog is unmounted, not closed, so the browser would not do it.
		const opener = document.activeElement as HTMLElement | null;
		if (!modal.open) {
			modal.showModal();
			// The dialog itself, not its first control: a screen reader hears the sheet's name.
			modal.focus();
		}
		// The page under a modal must not scroll along with the sheet.
		document.documentElement.classList.add("overflow-hidden");
		// Toasts go to the toaster inside the sheet while it is open: the page behind is inert.
		const sheetClosed = sheetOpened();
		element.dataset.shown = "false";
		rest.current = detents && mode() === "bottom" ? peekOffset() : 0;
		place(away());
		const frame = requestAnimationFrame(() =>
			requestAnimationFrame(() => {
				rest.current = detents && mode() === "bottom" ? peekOffset() : 0;
				place(rest.current);
				element.dataset.shown = "true";
			})
		);
		return () => {
			cancelAnimationFrame(frame);
			sheetClosed();
			document.documentElement.classList.remove("overflow-hidden");
			// While the modal is open the page behind is inert and refuses the focus: close it first.
			if (modal.open) modal.close();
			if (opener?.isConnected) opener.focus({ preventScroll: true });
		};
	}, [away, detents, mode, peekOffset, place]);

	// The peek grows when its content arrives (the soup loads after the sheet opens): follow it.
	useEffect(() => {
		const element = panel.current;
		if (!detents || !element) return;
		const observer = new ResizeObserver(() => {
			// The ref, not the state: a resize can land between expand() and the render it causes.
			if (fullNow.current || closing || element.dataset.dragging || mode() !== "bottom")
				return;
			rest.current = peekOffset();
			place(rest.current);
		});
		const peek = element.querySelector("[data-sheet-peek]");
		if (peek) observer.observe(peek);
		observer.observe(element);
		return () => observer.disconnect();
	});

	function close() {
		if (closing) return;
		setClosing(true);
		const element = panel.current;
		if (element) element.dataset.shown = "false";
		place(away());
		setTimeout(onClosed, CLOSE_MS);
	}

	function expand(open: boolean) {
		fullNow.current = open;
		setFull(open);
		rest.current = open ? 0 : peekOffset();
		place(rest.current);
		if (!open) scroller.current?.scrollTo({ top: 0 });
	}

	/** A tap on the header of the preview opens it all; the click that ends a drag is not a tap. */
	function openFull() {
		if (!detents || mode() !== "bottom" || fullNow.current) return;
		if (panel.current?.dataset.dragged) return;
		expand(true);
	}

	/** Let go where a flick would land: the nearest stop wins. */
	function settle(projected: number) {
		const height = panel.current?.offsetHeight ?? 0;
		const stops = detents ? [0, peekOffset(), height] : [0, height];
		const target = stops.reduce((best, stop) =>
			Math.abs(stop - projected) < Math.abs(best - projected) ? stop : best
		);
		if (target === height) close();
		else if (detents) expand(target === 0);
		else place(rest.current);
	}
	const settleNow = useRef(settle);
	settleNow.current = settle;

	useSheetDrag(panel, {
		enabled: () => mode() === "bottom",
		// While the preview shows, the whole sheet drags; once full, only its handle, so the content scrolls.
		anywhere: () => detents && !full,
		rest: () => rest.current,
		place,
		release: settle,
	});

	// The preview grows into the full sheet with the wheel too; and once full, a finger pulling down
	// from the top of the content takes the sheet down with it, as the handle does.
	useEffect(() => {
		const element = panel.current;
		const content = scroller.current;
		if (!detents || !element || !content) return;
		let from: number | null = null;
		let pulling = false;
		let last = { y: 0, t: 0 };
		let speed = 0;

		// A trackpad sends a stream of small deltas, momentum included: they add up to a gesture,
		// and after a snap the sheet ignores the wheel for a moment, so one flick moves it one step.
		let travel = 0;
		let idle: ReturnType<typeof setTimeout> | undefined;
		let lockedUntil = 0;
		function wheel(event: WheelEvent) {
			if (mode() !== "bottom") return;
			const atTop = content!.scrollTop <= 0;
			// Full and scrolled into the content: the wheel scrolls it, as usual.
			if (fullNow.current && (!atTop || event.deltaY > 0)) return;
			event.preventDefault();
			if (event.timeStamp < lockedUntil) return;
			travel += event.deltaY;
			clearTimeout(idle);
			idle = setTimeout(() => (travel = 0), 200);
			const step =
				!fullNow.current && travel > WHEEL_PX
					? true
					: fullNow.current && travel < -WHEEL_PX
						? false
						: null;
			if (step === null) return;
			travel = 0;
			lockedUntil = event.timeStamp + WHEEL_LOCK_MS;
			expand(step);
		}
		function start(event: TouchEvent) {
			if (mode() !== "bottom" || !fullNow.current || event.touches.length !== 1) return;
			from = event.touches[0].clientY;
			pulling = false;
			last = { y: from, t: event.timeStamp };
			speed = 0;
		}
		function move(event: TouchEvent) {
			if (from === null) return;
			const y = event.touches[0].clientY;
			const dy = y - from;
			if (!pulling) {
				// Only from the very top and only downwards: anything else is the content scrolling.
				if (content!.scrollTop > 0 || dy < 0) {
					from = null;
					return;
				}
				if (dy < 6) return;
				pulling = true;
				element!.dataset.dragging = "true";
			}
			if (event.cancelable) event.preventDefault();
			speed = (y - last.y) / Math.max(1, event.timeStamp - last.t);
			last = { y, t: event.timeStamp };
			place(dy);
		}
		function end() {
			if (from === null) return;
			const dy = last.y - from;
			from = null;
			if (!pulling) return;
			pulling = false;
			delete element!.dataset.dragging;
			settleNow.current(dy + speed * FLICK_MS);
		}

		element.addEventListener("wheel", wheel, { passive: false });
		content.addEventListener("touchstart", start, { passive: true });
		content.addEventListener("touchmove", move, { passive: false });
		content.addEventListener("touchend", end);
		content.addEventListener("touchcancel", end);
		return () => {
			clearTimeout(idle);
			element.removeEventListener("wheel", wheel);
			content.removeEventListener("touchstart", start);
			content.removeEventListener("touchmove", move);
			content.removeEventListener("touchend", end);
			content.removeEventListener("touchcancel", end);
		};
		// expand reads only refs and stable callbacks: the first render's copy is as good as any.
	}, [detents, mode, place]);

	return (
		<dialog
			ref={dialog}
			aria-labelledby={titleId}
			tabIndex={-1}
			onCancel={event => {
				event.preventDefault();
				close();
			}}
			data-closing={closing}
			// A modal dialog scrolls by default, and a sheet pushed down (or right) by its transform would
			// let the browser scroll it back into view: the sheet would jump. It never scrolls.
			onScroll={event => event.currentTarget.scrollTo(0, 0)}
			className="sheet group m-0 h-dvh max-h-none w-full max-w-none overflow-hidden bg-transparent p-0 outline-none backdrop:bg-transparent"
		>
			{/* The page behind, dimmed: tapping it closes the sheet. Not a control of its own for a
			    screen reader, which has the close button and Escape. */}
			<div
				aria-hidden
				onClick={close}
				className="scrim animate-fade absolute inset-0 transition-opacity duration-300 group-data-[closing=true]:opacity-0"
			/>
			<div
				ref={panel}
				data-wide={wide}
				data-detents={detents || undefined}
				className={cn(
					// Fixed, not absolute: out of the dialog's scrollable area, however far its transform
					// moves it. Where it stands on a phone is in globals.css (.sheet-panel).
					"sheet-panel sheet-surface fixed inset-x-0 flex flex-col overflow-hidden rounded-t-[2rem]",
					!detents && "max-h-[92dvh]",
					wide === "panel"
						? "lg:inset-y-3 lg:top-3 lg:right-3 lg:left-auto lg:max-h-none lg:w-[28rem] lg:rounded-[2rem]"
						: "lg:inset-0 lg:m-auto lg:h-fit lg:max-h-[85dvh] lg:w-[32rem] lg:rounded-[2rem]"
				)}
			>
				{/* The top, the same on every sheet: the handle, where a thumb grabs it (a button too, for
				    whoever cannot drag), and the header, which drags it as well. */}
				<div data-drag className="shrink-0 touch-none select-none">
					<div className="px-4 pt-2 lg:hidden">
						{detents ? (
							<button
								type="button"
								onClick={() => {
									// The handle is dragged too: the click that ends a drag is not a tap.
									if (panel.current?.dataset.dragged) return;
									expand(!full);
								}}
								data-handle
								aria-expanded={full}
								className="mx-auto flex h-7 w-24 items-center justify-center"
							>
								<span aria-hidden className="bg-text/25 h-1.5 w-10 rounded-full" />
								<span className="sr-only">
									{full ? "Riduci il foglio" : "Apri tutto il foglio"}
								</span>
							</button>
						) : (
							<span
								aria-hidden
								className="mx-auto flex h-6 w-20 items-center justify-center"
							>
								<span className="bg-text/25 h-1.5 w-10 rounded-full" />
							</span>
						)}
					</div>
					<header
						// A tap on the header of a preview opens it all; its buttons keep their own taps.
						onClick={event => {
							if (!(event.target as HTMLElement).closest("button, a")) openFull();
						}}
						className={cn(
							"flex gap-3 px-4 pt-2 pb-4 lg:px-6 lg:pt-6",
							media ? "items-start" : "items-center",
							detents && !full && "cursor-pointer lg:cursor-auto"
						)}
					>
						{media}
						<div className="flex min-w-0 flex-1 flex-col gap-1">
							<h2
								id={titleId}
								className={cn(
									"font-display font-semibold text-balance",
									media ? "text-lead leading-tight" : "text-title"
								)}
							>
								{title}
							</h2>
							{subtitle && <div className="text-small text-text-soft">{subtitle}</div>}
						</div>
						<div className="flex shrink-0 items-center gap-1">
							{actions}
							<button
								type="button"
								onClick={close}
								className="bg-ground-raised hover:bg-text/10 grid size-11 place-items-center rounded-full transition-[scale] duration-150 motion-safe:active:scale-[0.94]"
							>
								<CloseIcon className="size-5" />
								<span className="sr-only">Chiudi</span>
							</button>
						</div>
					</header>
				</div>
				<div
					ref={scroller}
					className={cn(
						"overscroll-contain px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] lg:overflow-y-auto lg:px-6",
						// The preview does not scroll: it is dragged, and shows what fits.
						detents && !full
							? "touch-none overflow-hidden select-none lg:touch-auto lg:select-auto"
							: "overflow-y-auto"
					)}
				>
					{children(close)}
				</div>
			</div>
			{/* Inside the dialog, so its toasts are in the top layer too, and their buttons work. */}
			<AppToaster id={SHEET_TOASTER} />
		</dialog>
	);
}
