import { VOTI, count } from "@/lib/plural";
import { MIN_VOTES_TO_RANK } from "@/lib/ranking/rules";
import { cn } from "@/lib/utils";

type Props = {
	rebuyPercent: number;
	votesCount: number;
	size?: "label" | "page";
	className?: string;
};

/**
 * The verdict, set where a shelf label sets its price: one big condensed figure and its unit
 * underneath. Until a product has enough votes the figure is a dash, never a misleading 100%.
 */
export function Verdict({
	rebuyPercent,
	votesCount,
	size = "label",
	className,
}: Props) {
	const ranked = votesCount >= MIN_VOTES_TO_RANK;
	const big = size === "page";

	// Where a new product would carry a "novità" tag: no figure yet, and the reason why.
	if (!ranked) {
		return (
			<p
				className={cn(
					"font-condensed bg-field text-on-field flex flex-col items-center px-3 py-2 text-center",
					className
				)}
			>
				<span
					className={cn(
						"leading-none font-black uppercase",
						big ? "text-title" : "text-lead"
					)}
				>
					Da votare
				</span>
				<span className="text-small font-semibold">
					{votesCount === 0
						? "nessun voto"
						: `${count(votesCount, VOTI)} su ${MIN_VOTES_TO_RANK}`}
				</span>
			</p>
		);
	}

	return (
		<p className={cn("flex flex-col items-end text-right", className)}>
			<span
				className={cn(
					"font-condensed leading-[0.85] font-black tracking-[-0.03em] tabular-nums",
					big ? "text-figure" : "text-figure-sm"
				)}
			>
				{rebuyPercent}
				<span className="text-[0.5em]">%</span>
			</span>
			<span className="text-small font-semibold">
				la ricompra · {count(votesCount, VOTI)}
			</span>
		</p>
	);
}
