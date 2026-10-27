import { useId } from "react";

import { cn } from "@/lib/utils";

// The official Nutri-Score colours, so the grade reads as it does on the pack.
const GRADES: Record<string, { fill: string; ink: string }> = {
	a: { fill: "#038141", ink: "#ffffff" },
	b: { fill: "#85bb2f", ink: "#16120f" },
	c: { fill: "#fecb02", ink: "#16120f" },
	d: { fill: "#ee8100", ink: "#16120f" },
	e: { fill: "#e63e11", ink: "#ffffff" },
};

// A seal of soft scallops: points on a circle, each pair joined by an outward arc.
function scallops(count: number, radius: number, bulge: number) {
	const at = (i: number) => {
		const angle = (2 * Math.PI * i) / count - Math.PI / 2;
		return `${(100 + radius * Math.cos(angle)).toFixed(2)} ${(100 + radius * Math.sin(angle)).toFixed(2)}`;
	};
	const arcs = Array.from(
		{ length: count },
		(_, i) => `A${bulge} ${bulge} 0 0 1 ${at(i + 1)}`
	);
	return `M${at(0)} ${arcs.join(" ")}Z`;
}

const SHAPE = scallops(16, 84, 18);
// A full circle for the text to run along, starting at the top.
const RING = "M100 38 a62 62 0 1 1 0 124 a62 62 0 1 1 0 -124";

/**
 * The Nutri-Score as a printed seal: the grade large and still in the middle, «NUTRI-SCORE»
 * running round the edge and turning slowly, as the posters bend their words around a shape.
 * Under it, the five grades of the official scale with this one raised. The words are the
 * accessible name; the turning stops under reduced motion.
 */
export function NutriScore({
	grade,
	className,
}: {
	grade: string;
	className?: string;
}) {
	const id = useId();
	const key = grade.toLowerCase();
	const colours = GRADES[key] ?? GRADES.c;

	return (
		<figure className={cn("flex flex-col items-center gap-4", className)}>
			<svg
				role="img"
				aria-label={`Nutri-Score ${grade.toUpperCase()}, su una scala da A a E`}
				viewBox="0 0 200 200"
				className="size-56"
			>
				<defs>
					<path id={`${id}-ring`} d={RING} />
				</defs>
				<path d={SHAPE} fill={colours.fill} />
				<g
					className="origin-center [transform-box:view-box] motion-safe:animate-[spin_24s_linear_infinite]"
					fill={colours.ink}
					fontFamily="var(--font-display)"
					fontWeight="600"
					fontSize="15"
					letterSpacing="2.4"
				>
					<text>
						<textPath href={`#${id}-ring`} textLength="384" lengthAdjust="spacing">
							NUTRI-SCORE • NUTRI-SCORE • NUTRI-SCORE •
						</textPath>
					</text>
				</g>
				<text
					x="100"
					y="102"
					fill={colours.ink}
					fontFamily="var(--font-display)"
					fontWeight="600"
					fontSize="76"
					textAnchor="middle"
					dominantBaseline="central"
				>
					{grade.toUpperCase()}
				</text>
			</svg>
			<ol aria-hidden className="flex items-center gap-1">
				{Object.entries(GRADES).map(([letter, { fill, ink }]) => {
					const current = letter === key;
					return (
						<li
							key={letter}
							style={{ background: fill, color: ink }}
							className={cn(
								"font-display flex items-center justify-center rounded-full font-semibold uppercase transition-[scale]",
								current ? "text-lead size-11" : "text-small size-7 opacity-55"
							)}
						>
							{letter}
						</li>
					);
				})}
			</ol>
		</figure>
	);
}
