import type { Nutrition } from "@/lib/catalog/types";

const ROWS: { key: keyof Nutrition; label: string; unit: string; sub?: boolean }[] = [
	{ key: "energyKcal", label: "Energia", unit: "kcal" },
	{ key: "fat", label: "Grassi", unit: "g" },
	{ key: "saturatedFat", label: "di cui acidi grassi saturi", unit: "g", sub: true },
	{ key: "carbohydrates", label: "Carboidrati", unit: "g" },
	{ key: "sugars", label: "di cui zuccheri", unit: "g", sub: true },
	{ key: "proteins", label: "Proteine", unit: "g" },
	{ key: "salt", label: "Sale", unit: "g" },
];

const number = new Intl.NumberFormat("it-IT", { maximumFractionDigits: 1 });

/**
 * The EU nutrition declaration as it is printed on the pack: a real table, so it keeps its
 * rules — a heavy one under the heading, thin ones between nutrients (`data-ui` tells the
 * design lint that these lines are the table's own).
 */
export function NutritionLabel({ nutrition }: { nutrition: Nutrition }) {
	return (
		<table data-ui className="text-body w-full border-collapse">
			<caption className="font-condensed border-rule text-lead border-b-[6px] pb-1 text-left font-black uppercase">
				Dichiarazione nutrizionale
			</caption>
			<thead>
				<tr className="border-rule text-small border-b-2">
					<th scope="col" className="py-1 text-left font-semibold">
						Valori medi
					</th>
					<th scope="col" className="py-1 text-right font-semibold">
						per 100 g
					</th>
				</tr>
			</thead>
			<tbody>
				{ROWS.filter(row => nutrition[row.key] !== null).map(row => (
					<tr key={row.key} className="nutrient-row">
						<th
							scope="row"
							className={
								row.sub
									? "py-1.5 pl-4 text-left font-normal"
									: "py-1.5 text-left font-semibold"
							}
						>
							{row.label}
						</th>
						<td className="py-1.5 text-right tabular-nums">
							{number.format(nutrition[row.key]!)} {row.unit}
						</td>
					</tr>
				))}
			</tbody>
		</table>
	);
}
