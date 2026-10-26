import { cn } from "@/lib/utils";

/**
 * A till receipt: a raised paper slip with a torn zigzag bottom. Rows are label · dot
 * leader · value, the last one inverted as the total, the way every supermarket prints it.
 */
export function Receipt({
	title,
	children,
	className,
	headingLevel = 2,
}: {
	title: string;
	children: React.ReactNode;
	className?: string;
	/** h2 on a page of its own; h3 when it sits inside a section that already has a heading. */
	headingLevel?: 2 | 3;
}) {
	const Heading = headingLevel === 2 ? "h2" : "h3";
	return (
		<section className={cn("edge-zigzag bg-ground-raised px-5 pt-5", className)}>
			<Heading className="font-condensed text-lead mb-4 font-extrabold uppercase">
				{title}
			</Heading>
			<div className="flex flex-col gap-2">{children}</div>
		</section>
	);
}

export function ReceiptRow({
	label,
	value,
	children,
	emphasis = false,
}: {
	label: React.ReactNode;
	value: React.ReactNode;
	/** Drawn under the row, full width: a bar, a note. */
	children?: React.ReactNode;
	emphasis?: boolean;
}) {
	return (
		<div className="flex flex-col gap-1">
			<div
				className={cn(
					"text-body flex items-baseline gap-2",
					emphasis && "font-semibold"
				)}
			>
				<span className="shrink-0">{label}</span>
				<span aria-hidden className="leader-dots mb-[0.3em] min-w-4 grow opacity-50" />
				<span className="shrink-0 tabular-nums">{value}</span>
			</div>
			{children}
		</div>
	);
}

export function ReceiptTotal({
	label,
	value,
}: {
	label: string;
	value: React.ReactNode;
}) {
	return (
		<div className="bg-text text-body text-ground -mx-2 mt-3 flex min-h-11 items-center justify-between px-3 font-bold">
			<span className="font-condensed uppercase">{label}</span>
			<span className="tabular-nums">{value}</span>
		</div>
	);
}
