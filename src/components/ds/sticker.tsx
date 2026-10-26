import { cn } from "@/lib/utils";

export type StickerTone = "positive" | "negative" | "neutral";

// Meaning is told three ways, so no single one has to carry it: the group the sticker sits in,
// its sign, and its ink. A reason in favour is inked in the stamp's red, the colour of
// "La ricompro"; a reason against and a plain description in black.
const SIGN: Record<StickerTone, string> = {
	positive: "+",
	negative: "−",
	neutral: "·",
};

type Props = {
	tone: StickerTone;
	children: React.ReactNode;
	pressed?: boolean;
	disabled?: boolean;
	onClick?: () => void;
};

/**
 * A price-gun sticker: notched ends, condensed type. As a toggle it inks in when pressed.
 * The notched shape is a background layer, so it never clips the focus ring of the button.
 */
export function Sticker({ tone, children, pressed, disabled, onClick }: Props) {
	const interactive = onClick !== undefined;
	const Tag = interactive ? "button" : "span";

	return (
		<Tag
			{...(interactive
				? { type: "button" as const, "aria-pressed": pressed, disabled, onClick }
				: {})}
			className={cn(
				"group font-semicondensed text-body relative isolate inline-flex min-h-11 items-center gap-1.5 px-4 font-semibold",
				pressed
					? tone === "positive"
						? "text-on-accent"
						: "text-ground"
					: "text-text",
				interactive &&
					"transition-[scale] duration-150 ease-out disabled:opacity-40 motion-safe:enabled:active:scale-[0.96]"
			)}
		>
			<span
				aria-hidden
				className={cn(
					"absolute inset-0 -z-10 transition-[background-color,opacity] duration-150 ease-out",
					"[clip-path:polygon(8px_0,calc(100%-8px)_0,100%_50%,calc(100%-8px)_100%,8px_100%,0_50%)]",
					pressed
						? tone === "positive"
							? "bg-accent"
							: "bg-text"
						: "bg-ground-raised",
					interactive &&
						(pressed
							? "group-enabled:group-hover:opacity-90"
							: "group-enabled:group-hover:bg-text/15")
				)}
			/>
			<span
				aria-hidden
				className={cn(
					"w-2 text-center font-black",
					!pressed && tone === "positive" && "text-accent"
				)}
			>
				{SIGN[tone]}
			</span>
			{children}
		</Tag>
	);
}
