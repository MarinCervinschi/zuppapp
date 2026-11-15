import { forwardRef, useRef, useState } from "react";

import { AnimatePresence } from "motion/react";
import * as m from "motion/react-m";

import { Confetti } from "@/components/ds/confetti";
import { formatStars } from "@/lib/format";
import { VOTI, count } from "@/lib/plural";
import {
	SCORES,
	SCORE_LABELS,
	type Score,
	missingVotesLabel,
} from "@/lib/ranking/rules";
import { cn } from "@/lib/utils";

/** One rounded star: filled, or drawn as an outline. */
export function StarIcon({
	filled = true,
	className,
	style,
}: {
	filled?: boolean;
	className?: string;
	style?: React.CSSProperties;
}) {
	return (
		<svg
			aria-hidden
			viewBox="0 0 24 24"
			style={style}
			className={cn("shrink-0", className)}
		>
			<path
				d="M12 2.6l2.82 5.9 6.48.86-4.73 4.5 1.18 6.43L12 17.2l-5.75 3.09 1.18-6.43-4.73-4.5 6.48-.86z"
				fill={filled ? "currentColor" : "none"}
				stroke="currentColor"
				strokeWidth={filled ? 0 : 1.6}
				strokeLinejoin="round"
			/>
		</svg>
	);
}

/** The reader's own vote, an ink pill with a gold star: «★ 4». */
export function MyScoreBadge({
	score,
	className,
}: {
	score: number;
	className?: string;
}) {
	return (
		<span
			className={cn(
				"bg-ink text-on-ink text-small inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 font-semibold tabular-nums",
				className
			)}
		>
			<StarIcon className="text-star size-3.5" />
			{score}
			<span className="sr-only">
				{score === 1 ? " stella, il tuo voto" : " stelle, il tuo voto"}
			</span>
		</span>
	);
}

/** A soup still short of the ranking, a corn pill: «Manca 1 voto alla classifica». */
export function MissingVotesBadge({
	votesCount,
	className,
}: {
	votesCount: number;
	className?: string;
}) {
	const label = missingVotesLabel(votesCount);
	if (!label) return null;
	return (
		<span
			className={cn(
				"text-small bg-field text-on-field inline-flex rounded-full px-2.5 py-0.5 font-semibold",
				className
			)}
		>
			{label}
		</span>
	);
}

/**
 * The green badge with the mean of the stars: «★ 4,7». With no votes it says so instead of
 * showing a zero. `label` is the accessible reading, when the badge stands alone.
 */
export function RatingBadge({
	mean,
	votesCount,
	size = "md",
	className,
}: {
	mean: number | null;
	votesCount: number;
	size?: "sm" | "md";
	className?: string;
}) {
	if (mean === null) {
		return (
			<span
				className={cn(
					"bg-ground-raised text-small text-text-soft inline-flex items-center rounded-full px-2.5 py-1 font-medium",
					className
				)}
			>
				Nessun voto
			</span>
		);
	}
	return (
		<span
			className={cn(
				"bg-badge-good inline-flex items-center gap-1 rounded-full font-semibold text-[#16120f] tabular-nums",
				size === "sm" ? "text-small px-2 py-0.5" : "text-body px-2.5 py-0.5",
				className
			)}
		>
			<StarIcon className={size === "sm" ? "size-3" : "size-3.5"} />
			{/* A new mean rolls in from below, the old one out above: the vote just counted. */}
			<span aria-hidden className="relative inline-flex overflow-hidden">
				<AnimatePresence mode="popLayout" initial={false}>
					<m.span
						key={mean}
						initial={{ y: "100%", opacity: 0 }}
						animate={{ y: 0, opacity: 1 }}
						exit={{ y: "-100%", opacity: 0 }}
						transition={{ duration: 0.3, ease: [0.2, 0, 0, 1] }}
					>
						{formatStars(mean)}
					</m.span>
				</AnimatePresence>
			</span>
			<span className="sr-only">
				{formatStars(mean)} stelle su 5, {count(votesCount, VOTI)}
			</span>
		</span>
	);
}

type PickerProps = {
	value: Score | null;
	onPick: (score: Score) => void;
	/** Told the star under the mouse, and null when it leaves: nothing is saved until a click. */
	onPreview?: (score: Score | null) => void;
	/** The product's name, for the group's accessible name in a list. */
	label?: string;
	size?: "lg" | "sm";
};

/**
 * A short buzz on phones that have one (not iPhones). Only once the page has been touched: before
 * that the browser refuses it, and complains in the console.
 */
function buzz(pattern: number | number[]) {
	if (navigator.userActivation?.hasBeenActive) navigator.vibrate?.(pattern);
}

/** The star under a point along the row: past either end, the first or the last. */
function scoreAt(group: HTMLElement, x: number): Score {
	const stars = Array.from(group.children);
	let index = 0;
	stars.forEach((star, i) => {
		if (star.getBoundingClientRect().left <= x) index = i;
	});
	return SCORES[index];
}

/**
 * Five stars, one tap, or a finger slid along them: the stars light up to the finger and lifting
 * it picks. A real radio group: arrow keys move between stars and each one's
 * accessible name is its words («4 stelle, Buona»). It is never disabled while a vote is
 * saving, so focus stays where the keyboard put it; the vote itself is debounced upstream.
 * Drawn for the black panel: filled stars in yellow, empty ones as a cream outline.
 */
export const StarPicker = forwardRef<HTMLDivElement, PickerProps>(function StarPicker(
	{ value, onPick, onPreview, label = "Il tuo voto", size = "lg" },
	ref
) {
	// With a mouse, hovering previews the stars up to the pointer; only a click saves them.
	const [hover, setHover] = useState<Score | null>(null);
	const preview = (score: Score | null) => {
		setHover(score);
		onPreview?.(score);
	};
	// Counts the reader's own picks: nothing animates on first render, and each pick replays the
	// stars filling in one after the other.
	const [picks, setPicks] = useState(0);
	// Five stars, «La ricompro»: drops and stars burst out of the fifth, over the whole screen.
	const [cheer, setCheer] = useState<{ key: number; star: HTMLElement } | null>(null);
	const pick = (score: Score, star?: HTMLElement) => {
		setPicks(n => n + 1);
		onPick(score);
		if (score === 5 && star) {
			setCheer({ key: Date.now(), star });
			buzz([12, 50, 24]);
		}
	};
	// A finger on a star: it can slide along the row before it lifts. Up and down stays a scroll
	// (`touch-pan-y`), which cancels the gesture. The lift picks, so the click that follows is skipped.
	const sliding = useRef<number | null>(null);
	const slidPickAt = useRef(-Infinity);
	const slideTo = (score: Score) => {
		if (score !== hover) buzz(8);
		preview(score);
	};
	const endSlide = () => {
		sliding.current = null;
		preview(null);
	};

	return (
		<div
			ref={ref}
			role="radiogroup"
			aria-label={label}
			onPointerLeave={event => {
				if (event.pointerType === "mouse") preview(null);
			}}
			onPointerDown={event => {
				if (event.pointerType === "mouse" || event.button !== 0) return;
				if (!(event.target as HTMLElement).closest("[role=radio]")) return;
				sliding.current = event.pointerId;
				// Held, so the finger is followed past the row and beyond the star it started on.
				try {
					event.currentTarget.setPointerCapture(event.pointerId);
				} catch {
					// A pointer the browser does not track (a synthetic one) cannot be held.
				}
				slideTo(scoreAt(event.currentTarget, event.clientX));
			}}
			onPointerMove={event => {
				if (sliding.current !== event.pointerId) return;
				slideTo(scoreAt(event.currentTarget, event.clientX));
			}}
			onPointerUp={event => {
				if (sliding.current !== event.pointerId) return;
				const score = scoreAt(event.currentTarget, event.clientX);
				endSlide();
				slidPickAt.current = event.timeStamp;
				pick(score, event.currentTarget.children[SCORES.indexOf(score)] as HTMLElement);
			}}
			onPointerCancel={endSlide}
			className={cn(
				"flex touch-pan-y justify-between select-none",
				size === "lg" ? "gap-1" : "gap-0.5"
			)}
		>
			{SCORES.map(score => {
				const selected = value === score;
				const filled = value !== null && score <= value;
				const lit = hover !== null ? score <= hover : filled;
				return (
					<button
						key={score}
						type="button"
						role="radio"
						aria-checked={selected}
						aria-label={`${score} ${score === 1 ? "stella" : "stelle"}, ${SCORE_LABELS[score].label}`}
						tabIndex={selected || (value === null && score === 1) ? 0 : -1}
						onClick={event => {
							// The click a slide's lift sends: the lift has picked already.
							if (event.timeStamp - slidPickAt.current < 600) return;
							pick(score, event.currentTarget);
						}}
						onPointerEnter={event => {
							if (event.pointerType === "mouse") preview(score);
						}}
						onKeyDown={event => {
							const step = { ArrowRight: 1, ArrowUp: 1, ArrowLeft: -1, ArrowDown: -1 }[
								event.key
							];
							if (!step) return;
							event.preventDefault();
							const index = Math.min(
								SCORES.length - 1,
								Math.max(0, SCORES.indexOf(score) + step)
							);
							const next = event.currentTarget.parentElement?.children[index] as
								HTMLElement | undefined;
							pick(SCORES[index], next);
							next?.focus();
						}}
						className={cn(
							"relative flex cursor-pointer items-center justify-center rounded-full transition-[scale] duration-150 ease-out motion-safe:active:scale-90",
							size === "lg" ? "size-14 sm:size-16" : "size-12"
						)}
					>
						<StarIcon
							key={picks > 0 && filled ? `${picks}-${value}` : "still"}
							filled={lit}
							style={
								picks > 0 && filled
									? { animationDelay: `${(score - 1) * 45}ms` }
									: undefined
							}
							className={cn(
								size === "lg" ? "size-12 sm:size-14" : "size-9",
								lit ? "text-star" : "text-current opacity-80",
								hover === score && "scale-110 transition-[scale] duration-150",
								picks > 0 && filled && "motion-safe:animate-pop"
							)}
						/>
					</button>
				);
			})}
			{cheer && (
				<Confetti key={cheer.key} anchor={cheer.star} onDone={() => setCheer(null)} />
			)}
		</div>
	);
});
