import { useId, useState } from "react";

import * as m from "motion/react-m";

import { packGrams } from "@/lib/catalog/pack";
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
		label: "di cui saturi",
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

// The level is a word first; the tint only repeats it, so no one has to read a colour.
const LEVEL_TINT: Record<Level, string> = {
	basso: "bg-soup-pea/30",
	medio: "bg-soup-corn/40",
	alto: "bg-soup-tomato/25",
};

function LevelTag({ level }: { level: Level }) {
	return (
		<span
			className={cn(
				"text-small text-text inline-flex w-fit items-center rounded-full px-2 leading-5 font-medium",
				LEVEL_TINT[level]
			)}
		>
			{level}
		</span>
	);
}

/**
 * A thin bar that grows to its length when it scrolls into view. Over 100% of the daily
 * intake it fills and turns tomato red, and the figure beside it says how far over it is.
 */
function Bar({ percent }: { percent: number }) {
	const over = percent > 100;
	return (
		<span
			aria-hidden
			className="bg-text/10 block h-1.5 w-full overflow-hidden rounded-full"
		>
			<m.span
				className={cn(
					"block h-full origin-left rounded-full",
					over ? "bg-soup-tomato" : "bg-text"
				)}
				style={{ width: `${Math.min(100, Math.max(percent, 2))}%` }}
				initial={{ scaleX: 0 }}
				whileInView={{ scaleX: 1 }}
				viewport={{ once: true }}
				transition={{ duration: 0.7, ease: [0.2, 0, 0, 1] }}
			/>
		</span>
	);
}

function IntakeCell({ percent }: { percent: number }) {
	const over = percent > 100;
	return (
		<td className="w-24 py-3 pr-5 pl-3 text-right align-middle">
			<span className="flex flex-col items-end gap-1.5">
				<span className={cn("text-small tabular-nums", over && "font-semibold")}>
					{whole.format(percent)}%
				</span>
				<Bar percent={percent} />
			</span>
		</td>
	);
}

/** Where the calories come from: fat at 9 kcal a gram, carbohydrates and protein at 4. */
function EnergySplit({ nutrition }: { nutrition: Nutrition }) {
	const { fat, carbohydrates, proteins } = nutrition;
	if (fat === null || carbohydrates === null || proteins === null) return null;
	const parts = [
		{ label: "Grassi", kcal: fat * 9, tint: "bg-soup-pumpkin" },
		{ label: "Carboidrati", kcal: carbohydrates * 4, tint: "bg-soup-corn" },
		{ label: "Proteine", kcal: proteins * 4, tint: "bg-soup-pea" },
	];
	const total = parts.reduce((sum, part) => sum + part.kcal, 0);
	if (total <= 0) return null;

	return (
		<div className="flex flex-col gap-2 px-5 pt-1 pb-4">
			<p className="text-small text-text-soft">Da dove vengono le calorie</p>
			<span aria-hidden className="flex h-2.5 gap-0.5 overflow-hidden rounded-full">
				{parts.map((part, index) => (
					<m.span
						key={part.label}
						className={cn("block h-full origin-left", part.tint)}
						style={{ width: `${(part.kcal / total) * 100}%` }}
						initial={{ scaleX: 0 }}
						whileInView={{ scaleX: 1 }}
						viewport={{ once: true }}
						transition={{ duration: 0.6, delay: index * 0.12, ease: [0.2, 0, 0, 1] }}
					/>
				))}
			</span>
			{/* The figures in words, so the bar is never the only place they live. */}
			<ul className="text-small flex flex-wrap gap-x-4 gap-y-1">
				{parts.map(part => (
					<li key={part.label} className="inline-flex items-center gap-1.5">
						<span aria-hidden className={cn("size-2 rounded-full", part.tint)} />
						{part.label}
						<span className="tabular-nums">
							{whole.format((part.kcal / total) * 100)}%
						</span>
					</li>
				))}
			</ul>
		</div>
	);
}

/**
 * The EU nutrition declaration on a sheet under a black tab. Per 100 g as on the pack, or for the
 * whole pack when its weight is known: a soup is usually eaten whole, and that is the figure
 * that tells you something. The energy is large, with where it comes from; each nutrient has
 * its level (per 100 g, as the thresholds are) and its share of an adult's daily intake.
 */
export function NutritionLabel({
	nutrition,
	quantity = null,
}: {
	nutrition: Nutrition;
	/** The pack as Open Food Facts writes it, «620 g»: offers the values for the whole pack. */
	quantity?: string | null;
}) {
	const id = useId();
	const pack = packGrams(quantity);
	const [perPack, setPerPack] = useState(false);
	const factor = perPack && pack ? pack / 100 : 1;
	const basis = perPack && pack ? `la confezione (${whole.format(pack)} g)` : "100 g";
	const rows = ROWS.filter(row => nutrition[row.key] !== null);
	const kcal = nutrition.energyKcal === null ? null : nutrition.energyKcal * factor;

	return (
		<section
			aria-labelledby={`${id}-title`}
			className="bg-ground-raised rounded-panel overflow-hidden"
		>
			{/* The title and its note as a heading and a line, not one caption in two faces. */}
			<header className="bg-ink text-on-ink flex flex-col gap-3 px-5 pt-4 pb-4">
				<div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
					<h2 id={`${id}-title`} className="font-display text-lead font-medium">
						Valori nutrizionali
					</h2>
					{pack && (
						<div
							role="group"
							aria-label="Valori per"
							className="bg-on-ink/10 inline-flex rounded-full p-1"
						>
							{[
								{ value: false, label: "100 g" },
								{ value: true, label: `Confezione · ${whole.format(pack)} g` },
							].map(option => (
								<button
									key={option.label}
									type="button"
									aria-pressed={perPack === option.value}
									onClick={() => setPerPack(option.value)}
									className={cn(
										"text-small min-h-9 rounded-full px-3 font-medium transition-[background-color,color] duration-150",
										perPack === option.value
											? "bg-on-ink text-ink"
											: "text-on-ink/80 hover:text-on-ink"
									)}
								>
									{option.label}
								</button>
							))}
						</div>
					)}
				</div>
				<p id={`${id}-note`} className="text-small text-on-ink/70">
					Per {basis}. % AR: quota dell’assunzione di riferimento giornaliera di un
					adulto.
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
							Per {basis}
						</th>
						<th scope="col" className="text-right">
							% AR
						</th>
					</tr>
				</thead>
				<tbody>
					{kcal !== null && (
						<tr>
							<th
								scope="row"
								className="pt-5 pb-3 pl-5 text-left align-middle font-medium"
							>
								Energia
							</th>
							<td className="pt-5 pb-3 pl-3 text-right align-middle">
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
					{kcal !== null && (
						<tr className="nutrient-row">
							<td colSpan={3} className="p-0">
								<EnergySplit nutrition={nutrition} />
							</td>
						</tr>
					)}
					{rows.map(row => {
						const per100 = nutrition[row.key]!;
						const value = per100 * factor;
						return (
							<tr key={row.key} className="nutrient-row last:border-b-0">
								<th
									scope="row"
									className={cn(
										"py-3 text-left align-middle",
										row.sub
											? "text-small text-text-soft pl-9 font-normal"
											: "pl-5 font-medium"
									)}
								>
									<span className="flex flex-col gap-1">
										{row.label}
										{row.levels && <LevelTag level={levelOf(per100, row.levels)} />}
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
			<p className="text-small text-text-soft bg-text/[0.04] px-5 py-3">
				Livelli per 100 g, con le soglie FSA. Leggi sempre l’etichetta.
			</p>
		</section>
	);
}
