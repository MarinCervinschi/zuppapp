import { cn } from "@/lib/utils";

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
	className,
}: {
	title: React.ReactNode;
	children?: React.ReactNode;
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
				blob && "blob-head relative isolate overflow-hidden",
				"px-4 pt-14 pb-8 text-center",
				className
			)}
		>
			{blob && <SoupField soup={blob} shape={shape} />}
			<div className="mx-auto flex max-w-xl flex-col items-center gap-4">
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
