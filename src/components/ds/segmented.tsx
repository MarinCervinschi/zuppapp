import { cn } from "@/lib/utils";

// The app's tabs: pills on one raised bar, the current one inked in, as on the home, «Le tue zuppe»
// and the admin. Only the look is shared: each page builds its own links, typed for its route,
// with `aria-current` on the current one.

/** The bar; add `grid grid-cols-N` or `flex`. */
export const segmentedBar = "bg-ground-raised gap-1 rounded-full p-1";

/** One tab. Below 360 px it tightens, so two long names still fit side by side. */
export function segment(active: boolean) {
	return cn(
		"text-body inline-flex min-h-11 items-center justify-center gap-1.5 rounded-full px-4 font-medium whitespace-nowrap no-underline transition-[background-color,color] duration-200 max-[359px]:px-3 max-[359px]:text-[0.9375rem]",
		active ? "bg-text text-ground" : "hover:bg-text/[0.06]"
	);
}

/** The count after a tab's name, quieter than the name. */
export function SegmentCount({
	n,
	active,
	className,
}: {
	n: number;
	active: boolean;
	className?: string;
}) {
	return (
		<span
			className={cn(
				"text-small tabular-nums",
				active ? "text-ground/75" : "text-text-soft",
				className
			)}
		>
			{n}
		</span>
	);
}
