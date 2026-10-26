import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

type Props = ComponentProps<"button"> & {
	/** `ink` is the one action of a view; `paper` is every other. */
	variant?: "ink" | "paper";
};

/** Square, flat, one fill. Presses down to 0.96 like a key on a till. */
export function Button({ variant = "paper", className, ...props }: Props) {
	return (
		<button
			type="button"
			{...props}
			className={cn(
				"text-body inline-flex min-h-12 items-center justify-center gap-2 px-5 font-semibold",
				"transition-[scale,background-color] duration-150 ease-out motion-safe:enabled:active:scale-[0.96]",
				"disabled:cursor-not-allowed disabled:opacity-50",
				variant === "ink"
					? "bg-text text-ground hover:bg-text/90"
					: "bg-ground-raised text-text hover:bg-text/10",
				className
			)}
		/>
	);
}
