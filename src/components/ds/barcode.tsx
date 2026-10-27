import { barRuns, ean13Modules } from "@/lib/barcode/ean13";
import { cn } from "@/lib/utils";

/** The product's real EAN-13, drawn in ink; it scans. Anything that isn't 13 digits shows as text. */
export function Barcode({
	ean,
	className,
	"aria-hidden": hidden,
	caption,
}: {
	ean: string;
	className?: string;
	"aria-hidden"?: boolean;
	/** What the digits are; "EAN …" by default. */
	caption?: string;
}) {
	const modules = ean13Modules(ean);

	return (
		<figure
			aria-hidden={hidden || undefined}
			className={cn("inline-flex flex-col items-start gap-1", className)}
		>
			{modules && (
				// 11 modules of quiet zone around the 95 of the code, as the standard asks.
				<svg
					viewBox="-11 0 117 40"
					className="h-10 w-auto"
					preserveAspectRatio="none"
					aria-hidden
				>
					{/* Always black on white, in both themes: a scanner cannot read a barcode the other way round. */}
					<rect x="-11" width="117" height="40" fill="#ffffff" />
					{barRuns(modules).map(([x, width]) => (
						<rect key={x} x={x} width={width} height="40" fill="#16120f" />
					))}
				</svg>
			)}
			<figcaption className="text-small text-text-soft tabular-nums">
				{caption ?? `EAN ${ean}`}
			</figcaption>
		</figure>
	);
}
