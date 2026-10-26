import { useId } from "react";

import { Link } from "@tanstack/react-router";

import type { Score } from "@/lib/ranking/rules";
import { cn } from "@/lib/utils";

import { PackPhoto } from "./pack-photo";
import { ScoreSpread } from "./score-spread";
import { Verdict } from "./verdict";

export type ShelfLabelProduct = {
	ean: string;
	name: string;
	brand: string | null;
	subtype: string | null;
	quantity?: string | null;
	imageUrl?: string | null;
	/** Position in the ranking, printed above the name when there is one. */
	rank?: number | null;
	votesCount: number;
	rebuyPercent: number;
	/** Votes per face; on the product page the label draws their spread under the name. */
	scoreCounts?: Record<Score, number>;
};

/**
 * The cartellino on the shelf edge: what it is on the left, the verdict where the price
 * would be. The barcode is not here: it identifies the pack for a scanner, not for a person
 * choosing a soup, so it lives at the bottom of the product page. In a list the whole label
 * is the link, named by the product alone; the details and the verdict are its description.
 */
export function ShelfLabel({
	product,
	as = "link",
	heading = as === "static",
	stamp,
	className,
}: {
	product: ShelfLabelProduct;
	as?: "link" | "static";
	/** On the product page the name is the h1; a specimen elsewhere keeps it plain text. */
	heading?: boolean;
	/** Something inked over the label's edge, like the reader's own vote. */
	stamp?: React.ReactNode;
	className?: string;
}) {
	const nameId = useId();
	const describeId = useId();
	const detailsId = useId();
	const details = [product.brand, product.subtype, product.quantity]
		.filter(Boolean)
		.join(" · ");
	const page = as === "static";
	const nameClass = page
		? "font-semicondensed text-title font-extrabold tracking-[-0.02em] text-balance"
		: "font-semicondensed text-lead font-bold text-balance";

	const body = (
		<>
			{/* The yellow strip of the shelf edge the label clips onto. */}
			<span aria-hidden className="bg-field block h-2" />
			<span
				// On its own page the name takes the full width; the verdict drops beside the spread.
				className={cn(
					"grid grid-cols-[1fr_auto] gap-x-4 gap-y-3 p-4 sm:p-5",
					stamp && "pb-8 sm:pb-8"
				)}
			>
				<span className={cn("flex min-w-0 gap-3", page && "col-span-2")}>
					{/* In a list the pack sits beside its name, to be recognised by sight; the name says it in words. */}
					{!page && <PackPhoto src={product.imageUrl ?? null} alt="" size="thumb" />}
					<span className="flex min-w-0 flex-col gap-1">
						{product.rank && (
							<span className="label-caps text-small">
								{product.rank}° in classifica
							</span>
						)}
						{heading ? (
							<h1 id={nameId} className={nameClass}>
								{product.name}
							</h1>
						) : (
							<span id={nameId} className={nameClass}>
								{product.name}
							</span>
						)}
						{details && (
							<span id={detailsId} className="text-small text-text-soft">
								{details}
							</span>
						)}
					</span>
				</span>
				<span id={describeId} className={page ? "contents" : "row-span-2 self-start"}>
					<Verdict
						rebuyPercent={product.rebuyPercent}
						votesCount={product.votesCount}
						size={page ? "page" : "label"}
						className={page ? "col-start-2 row-start-2 self-end" : undefined}
					/>
				</span>
				{page && product.scoreCounts && (
					<ScoreSpread
						counts={product.scoreCounts}
						className="col-start-1 row-start-2 max-w-64 self-end"
					/>
				)}
			</span>
			{/* Inked across the label's bottom edge, half on the paper, as a hand stamp lands. */}
			{stamp && <span className="absolute right-4 -bottom-5 z-10">{stamp}</span>}
		</>
	);

	const classes = cn("bg-ground-raised relative block", className);

	if (page) return <div className={classes}>{body}</div>;
	return (
		<Link
			to="/prodotti/$ean"
			params={{ ean: product.ean }}
			aria-labelledby={nameId}
			aria-describedby={details ? `${detailsId} ${describeId}` : describeId}
			className={cn(
				classes,
				"hover:bg-text/10 transition-[scale,background-color] duration-150 ease-out motion-safe:active:scale-[0.96]"
			)}
		>
			{body}
		</Link>
	);
}
