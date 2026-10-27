import { useId } from "react";

import type { Nutrition } from "@/lib/catalog/types";
import { cn } from "@/lib/utils";

/** A nutrient's level per 100 g, by the UK FSA front-of-pack thresholds for foods. */
type Level = "basso" | "medio" | "alto";

type Row = {
	key: keyof Nutrition;
	label: string;
	unit: string;
	sub?: boolean;
	/** The adult reference intake (EU Reg. 1169/2011, Annex XIII), for the «% AR» column. */
	intake: number;
	/** Upper limits of «basso» and «medio» per 100 g; above the second it is «alto». */
	levels?: [number, number];
};

const ROWS: Row[] = [
	{ key: "fat", label: "Grassi", unit: "g", intake: 70, levels: [3, 17.5] },
	{
		key: "saturatedFat",
		label: "di cui acidi grassi saturi",
		unit: "g",
		sub: true,
		intake: 20,
		levels: [1.5, 5],
	},
	{ key: "carbohydrates", label: "Carboidrati", unit: "g", intake: 260 },
	{
		key: "sugars",
		label: "di cui zuccheri",
		unit: "g",
		sub: true,
		intake: 90,
		levels: [5, 22.5],
	},
	{ key: "proteins", label: "Proteine", unit: "g", intake: 50 },
	{ key: "salt", label: "Sale", unit: "g", intake: 6, levels: [0.3, 1.5] },
];

const ENERGY_INTAKE_KCAL = 2000;
const KJ_PER_KCAL = 4.184;

const number = new Intl.NumberFormat("it-IT", { maximumFractionDigits: 1 });
const whole = new Intl.NumberFormat("it-IT", { maximumFractionDigits: 0 });

function levelOf(value: number, [low, medium]: [number, number]): Level {
	if (value <= low) return "basso";
	if (value <= medium) return "medio";
	return "alto";
}

// The level is a word first; the dot only repeats it, so no one has to read a colour.
const LEVEL_DOT: Record<Level, string> = {
	basso: "bg-soup-pea",
	medio: "bg-soup-corn",
	alto: "bg-soup-tomato",
};

function LevelTag({ level }: { level: Level }) {
	return (
		<span className="text-small text-text-soft inline-flex items-center gap-1.5">
			<span aria-hidden className={cn("size-2 rounded-full", LEVEL_DOT[level])} />
			{level}
		</span>
	);
}

/** The share of the daily reference intake, as a figure and a thin bar under it. */
function IntakeCell({ percent }: { percent: number }) {
	return (
		<td className="w-24 py-3 pr-4 pl-3 text-right align-middle">
			<span className="flex flex-col items-end gap-1.5">
				<span className="text-small tabular-nums">{whole.format(percent)}%</span>
				<span
					aria-hidden
					className="bg-text/10 block h-1.5 w-full overflow-hidden rounded-full"
				>
					<span
						className="bg-text block h-full rounded-full"
						style={{ width: `${Math.min(100, Math.max(percent, 2))}%` }}
					/>
				</span>
			</span>
		</td>
	);
}

/**
 * The EU nutrition declaration per 100 g, on a sheet under a black tab: the energy large, in
 * kcal and kJ, then each nutrient with its level and its share of an adult's daily reference
 * intake. A real table, so a screen reader reads it row by row.
 */
export function NutritionLabel({ nutrition }: { nutrition: Nutrition }) {
	const rows = ROWS.filter(row => nutrition[row.key] !== null);
	const kcal = nutrition.energyKcal;
	const id = useId();

	return (
		<section
			aria-labelledby={`${id}-title`}
			className="bg-ground-raised rounded-panel overflow-hidden"
		>
			{/* The title and its note as a heading and a line, not one caption in two faces. */}
			<header className="bg-ink text-on-ink px-5 pt-4 pb-3">
				<h2 id={`${id}-title`} className="font-display text-lead font-medium">
					Valori nutrizionali
				</h2>
				<p id={`${id}-note`} className="text-small text-on-ink/70">
					Per 100 g · % AR: quota dell’assunzione di riferimento di un adulto
				</p>
			</header>
			<table
				aria-labelledby={`${id}-title`}
				aria-describedby={`${id}-note`}
				className="text-body w-full border-collapse"
			>
				<thead className="sr-only">
					<tr>
						<th scope="col">Nutriente</th>
						<th scope="col" className="text-right">
							Per 100 g
						</th>
						<th scope="col" className="text-right">
							% AR
						</th>
					</tr>
				</thead>
				<tbody>
					{kcal !== null && (
						<tr className="nutrient-row">
							<th scope="row" className="py-4 pl-5 text-left align-middle font-medium">
								Energia
							</th>
							<td className="py-4 pl-3 text-right align-middle">
								<span className="font-display text-title block leading-none font-semibold whitespace-nowrap tabular-nums">
									{whole.format(kcal)}
									<span className="text-body font-medium"> kcal</span>
								</span>
								<span className="text-small text-text-soft tabular-nums">
									{whole.format(kcal * KJ_PER_KCAL)} kJ
								</span>
							</td>
							<IntakeCell percent={(kcal / ENERGY_INTAKE_KCAL) * 100} />
						</tr>
					)}
					{rows.map(row => {
						const value = nutrition[row.key]!;
						return (
							<tr key={row.key} className="nutrient-row last:border-b-0">
								<th
									scope="row"
									className={cn(
										"py-3 text-left align-middle",
										row.sub ? "text-small pl-9 font-normal" : "pl-5 font-medium"
									)}
								>
									<span className="flex flex-col gap-0.5">
										{row.label}
										{row.levels && <LevelTag level={levelOf(value, row.levels)} />}
									</span>
								</th>
								<td className="py-3 pl-3 text-right align-middle tabular-nums">
									{number.format(value)} {row.unit}
								</td>
								<IntakeCell percent={(value / row.intake) * 100} />
							</tr>
						);
					})}
				</tbody>
			</table>
		</section>
	);
}
