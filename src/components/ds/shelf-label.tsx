import { useId } from "react";

import { Link } from "@tanstack/react-router";

import { cn } from "@/lib/utils";

import { Barcode } from "./barcode";
import { Verdict } from "./verdict";

export type ShelfLabelProduct = {
	ean: string;
	name: string;
	brand: string | null;
	subtype: string | null;
	quantity?: string | null;
	votesCount: number;
	rebuyPercent: number;
};

/**
 * The cartellino on the shelf edge: what it is on the left, the verdict where the price
 * would be, the barcode underneath. In a list the whole label is the link, named by the
 * product alone; the details and the verdict are its description.
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
				// On its own page the name takes the full width; the verdict drops beside the barcode.
				className={cn(
					"grid grid-cols-[1fr_auto] gap-x-4 gap-y-3 p-4 sm:p-5",
					stamp && "pb-8 sm:pb-8"
				)}
			>
				<span className={cn("flex min-w-0 flex-col gap-1", page && "col-span-2")}>
					{heading ? (
						<h1 id={nameId} className={nameClass}>
							{product.name}
						</h1>
					) : (
						<span id={nameId} className={nameClass}>
							{product.name}
						</span>
					)}
					{details && <span className="text-small text-text-soft">{details}</span>}
				</span>
				<span id={describeId} className={page ? "contents" : "row-span-2 self-start"}>
					{!page && details && <span className="sr-only">{details}. </span>}
					<Verdict
						rebuyPercent={product.rebuyPercent}
						votesCount={product.votesCount}
						size={page ? "page" : "label"}
						className={page ? "col-start-2 row-start-2 self-end" : undefined}
					/>
				</span>
				{/* The EAN is for the eye and the scanner; in a list it would be read on every link. */}
				<Barcode
					ean={product.ean}
					aria-hidden={!page}
					className={cn("self-end", page && "col-start-1 row-start-2")}
				/>
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
			aria-describedby={describeId}
			className={cn(
				classes,
				"hover:bg-text/10 transition-[scale,background-color] duration-150 ease-out motion-safe:active:scale-[0.96]"
			)}
		>
			{body}
		</Link>
	);
}
