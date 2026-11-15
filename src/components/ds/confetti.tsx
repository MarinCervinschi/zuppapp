import { useEffect, useRef, useState } from "react";

import { createPortal } from "react-dom";

// A burst of soup drops and gold stars out of one element, thrown up and falling away: five stars
// given, the soup at the top of the podium. Drawn on the whole screen, over everything; inside an
// open sheet when there is one, since a modal <dialog> sits above anything else in the page.

const COLOURS = [
	"var(--soup-tomato)",
	"var(--soup-pumpkin)",
	"var(--soup-corn)",
	"var(--soup-pea)",
	"var(--soup-beet)",
];

/** How long the longest piece flies, delay included: then the burst is taken away. */
const LIFETIME_MS = 1700;

type Piece = {
	star: boolean;
	style: React.CSSProperties;
};

function makePieces(count: number): Piece[] {
	return Array.from({ length: count }, (_, i) => {
		// A fan upwards, wider than a half circle, so a few drops fly out sideways and low.
		const angle = (-200 + Math.random() * 220) * (Math.PI / 180);
		const reach = 90 + Math.random() * 190;
		const dx = Math.cos(angle) * reach;
		const dy = Math.sin(angle) * reach;
		const star = i % 4 === 0;
		return {
			star,
			style: {
				"--c": COLOURS[i % COLOURS.length],
				"--s": `${star ? 18 + Math.random() * 8 : 7 + Math.random() * 7}px`,
				"--dx": `${dx}px`,
				"--dy": `${dy}px`,
				// Where it ends: further out, and well below where it peaked.
				"--ex": `${dx * 1.35}px`,
				"--ey": `${dy + 220 + Math.random() * 260}px`,
				"--r": `${(Math.random() - 0.5) * 720}deg`,
				"--t": `${1000 + Math.random() * 500}ms`,
				"--d": `${Math.random() * 90}ms`,
			} as React.CSSProperties,
		};
	});
}

/** Thrown from the middle of `anchor` once, when mounted; `onDone` when the last piece is gone. */
export function Confetti({
	anchor,
	count = 28,
	onDone,
}: {
	anchor: HTMLElement;
	count?: number;
	onDone?: () => void;
}) {
	const [burst] = useState(() => {
		const rect = anchor.getBoundingClientRect();
		return {
			x: rect.left + rect.width / 2,
			y: rect.top + rect.height / 2,
			container: anchor.closest("dialog[open]") ?? document.body,
			pieces: makePieces(count),
		};
	});
	const done = useRef(onDone);
	done.current = onDone;

	useEffect(() => {
		const timer = setTimeout(() => done.current?.(), LIFETIME_MS);
		return () => clearTimeout(timer);
	}, []);

	return createPortal(
		<div aria-hidden className="confetti" style={{ left: burst.x, top: burst.y }}>
			{burst.pieces.map((piece, i) => (
				<i key={i} className={piece.star ? "is-star" : undefined} style={piece.style}>
					{piece.star && (
						<svg viewBox="0 0 24 24">
							<path
								d="M12 2.6l2.82 5.9 6.48.86-4.73 4.5 1.18 6.43L12 17.2l-5.75 3.09 1.18-6.43-4.73-4.5 6.48-.86z"
								fill="currentColor"
							/>
						</svg>
					)}
				</i>
			))}
		</div>,
		burst.container
	);
}
