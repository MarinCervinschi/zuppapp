import type { ComponentProps } from "react";

import { BowlLoader } from "@/components/ds/bowl-loader";
import { cn } from "@/lib/utils";

type Props = ComponentProps<"button"> & {
	/** `ink` is the one action of a view; `paper` is every other. */
	variant?: "ink" | "paper";
	/** Its action is under way: the bowl stirs before the label, which says what is happening. */
	pending?: boolean;
};

/** A pill, flat, one fill. Presses down to 0.96. */
export function Button({
	variant = "paper",
	pending,
	className,
	children,
	...props
}: Props) {
	return (
		<button
			type="button"
			aria-busy={pending || undefined}
			{...props}
			// Pending, it stays at full strength: the bowl is the sign it is busy, not a faded pill.
			className={cn(
				buttonClass(variant),
				pending && "disabled:cursor-wait disabled:opacity-100",
				className
			)}
		>
			{pending && <BowlLoader className="size-5" />}
			{children}
		</button>
	);
}

/** The same look for a link that acts as a button. */
export function buttonClass(variant: "ink" | "paper" = "paper") {
	return cn(
		"text-body inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-5 font-medium no-underline",
		"transition-[scale,background-color] duration-150 ease-out motion-safe:not-disabled:active:scale-[0.96]",
		"disabled:cursor-not-allowed disabled:opacity-50",
		variant === "ink"
			? "bg-text text-ground hover:bg-text/85 ink-sheen"
			: "bg-ground-raised text-text hover:bg-text/10"
	);
}

/**
 * A `paper` button on a raised surface (a card, the admin's action bar) would be the same colour
 * as what's under it: this steps it back down to the ground.
 */
export const paperOnRaised = "bg-ground hover:bg-text/10";
