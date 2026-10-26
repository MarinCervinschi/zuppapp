import type { Score } from "@/lib/ranking/rules";
import { cn } from "@/lib/utils";

// The four verdicts drawn as a bowl seen from above, the face floating in the soup. Drawn,
// not emoji, so they look the same on every phone and take the palette's inks.

const SOUP: Record<Score, string> = {
	1: "var(--soup-1)",
	2: "var(--soup-2)",
	3: "var(--soup-3)",
	4: "var(--soup-4)",
};

function Face({ score }: { score: Score }) {
	switch (score) {
		case 1:
			return (
				<>
					<path d="M22 26l5 5m0-5l-5 5M37 26l5 5m0-5l-5 5" />
					<path d="M22 43c2.5-3 5-3 7.5 0s5 3 7.5 0 3.5-2.5 5 0" />
				</>
			);
		case 2:
			return (
				<>
					<circle cx="25" cy="29" r="2.2" className="fill-current stroke-none" />
					<circle cx="39" cy="29" r="2.2" className="fill-current stroke-none" />
					<path d="M24 41h16" />
				</>
			);
		case 3:
			return (
				<>
					<circle cx="25" cy="28" r="2.2" className="fill-current stroke-none" />
					<circle cx="39" cy="28" r="2.2" className="fill-current stroke-none" />
					<path d="M23 37c4 6 14 6 18 0" />
				</>
			);
		case 4:
			return (
				<>
					<path d="M21 29c1.5-3 5.5-3 7 0M36 29c1.5-3 5.5-3 7 0" />
					<path d="M21 35c3 10 19 10 22 0z" className="fill-current" />
					<path d="M40 41c0 3 3 5 3 7" />
				</>
			);
	}
}

type Props = {
	score: Score;
	className?: string;
	/** Decorative next to its label; give it a title when it stands alone. */
	title?: string;
};

export function BowlFace({ score, className, title }: Props) {
	return (
		<svg
			viewBox="0 0 64 64"
			className={cn("size-14", className)}
			role={title ? "img" : undefined}
			aria-hidden={title ? undefined : true}
			aria-label={title}
		>
			<circle
				cx="32"
				cy="32"
				r="29"
				fill="var(--color-bowl-rim)"
				stroke="currentColor"
				strokeWidth="3"
			/>
			<circle cx="32" cy="33" r="22" fill={SOUP[score]} />
			<g
				fill="none"
				stroke="currentColor"
				strokeWidth="3"
				strokeLinecap="round"
				strokeLinejoin="round"
			>
				<Face score={score} />
			</g>
		</svg>
	);
}
