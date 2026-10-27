import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

type Props = ComponentProps<"button"> & {
	/** `ink` is the one action of a view; `paper` is every other. */
	variant?: "ink" | "paper";
};

/** A pill, flat, one fill. Presses down to 0.96. */
export function Button({ variant = "paper", className, ...props }: Props) {
	return (
		<button type="button" {...props} className={cn(buttonClass(variant), className)} />
	);
}

/** The same look for a link that acts as a button. */
export function buttonClass(variant: "ink" | "paper" = "paper") {
	return cn(
		"text-body inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-5 font-medium no-underline",
		"transition-[scale,background-color] duration-150 ease-out motion-safe:not-disabled:active:scale-[0.96]",
		"disabled:cursor-not-allowed disabled:opacity-50",
		variant === "ink"
			? "bg-text text-ground hover:bg-text/85"
			: "bg-ground-raised text-text hover:bg-text/10"
	);
}
