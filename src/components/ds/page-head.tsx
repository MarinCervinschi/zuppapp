import { cn } from "@/lib/utils";

import { BackButton } from "./app-bar";
import { type FieldShape, SoupField } from "./soup-field";

export type Soup = "tomato" | "pumpkin" | "corn" | "pea" | "beet";

// Each blob is two soups, the darker at the top: it fades into the paper below.
const BLOBS: Record<Soup, [string, string]> = {
	tomato: ["var(--soup-tomato)", "var(--soup-pumpkin)"],
	pumpkin: ["var(--soup-pumpkin)", "var(--soup-corn)"],
	corn: ["var(--soup-corn)", "color-mix(in oklab, var(--soup-corn) 50%, transparent)"],
	pea: ["var(--soup-pea)", "color-mix(in oklab, var(--soup-pea) 50%, transparent)"],
	beet: ["var(--soup-beet)", "var(--soup-tomato)"],
};

/**
 * The top of a screen: «ZUPPAPP» small, the page's one h1 large, a line under it. With a
 * `blob`, the poster's grainy soup colour spreads from the top edge into the paper: a living
 * `SoupField` in the given `shape`, over a still CSS gradient for when WebGL is missing.
 */
export function PageHead({
	title,
	children,
	blob,
	shape = "gocce",
	action,
	back,
	barWidth = "max-w-5xl",
	className,
}: {
	title: React.ReactNode;
	children?: React.ReactNode;
	/** A round button in the top right corner, for something about the whole page. */
	action?: React.ReactNode;
	/** An inner page: the way back in the top left corner, to this page when there is no history. */
	back?: "/" | "/profilo";
	/** The width the corner buttons line up with: the page's content below. */
	barWidth?: "max-w-xl" | "max-w-5xl";
	blob?: Soup;
	shape?: FieldShape;
	className?: string;
}) {
	return (
		<header
			style={
				blob
					? ({
							"--blob-from": BLOBS[blob][0],
							"--blob-to": BLOBS[blob][1],
						} as React.CSSProperties)
					: undefined
			}
			className={cn(
				blob && "blob-head isolate overflow-hidden",
				"relative",
				"px-4 pt-14 pb-8 text-center",
				className
			)}
		>
			{blob && <SoupField soup={blob} shape={shape} />}
			{(action || back) && (
				// Aligned with the page's content, not the far corners of a wide screen.
				<div
					className={cn(
						"pointer-events-none absolute inset-x-0 top-[max(1rem,env(safe-area-inset-top))] z-10 mx-auto flex items-center justify-between px-4",
						barWidth
					)}
				>
					{back ? (
						<BackButton fallback={back} className="pointer-events-auto" />
					) : (
						<span />
					)}
					{action && <div className="pointer-events-auto">{action}</div>}
				</div>
			)}
			<div className="stagger mx-auto flex max-w-xl flex-col items-center gap-4">
				<p
					className={cn(
						"wordmark text-wordmark",
						blob ? "text-text/75" : "text-text-soft"
					)}
				>
					Zuppapp
				</p>
				<h1 className="font-display text-display font-semibold tracking-[-0.01em]">
					{title}
				</h1>
				{children && <div className="text-body max-w-[34ch]">{children}</div>}
			</div>
		</header>
	);
}
