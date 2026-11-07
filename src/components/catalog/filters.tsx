import { Link } from "@tanstack/react-router";
import { AnimatePresence } from "motion/react";
import * as m from "motion/react-m";

import { chip, chipOff, chipOn } from "@/components/ds/chip";
import { subtypeLabel } from "@/lib/catalog/labels";
import {
	ALLERGEN_FILTERS,
	type BrowseParams,
	NUTRISCORES,
	listParam,
} from "@/lib/catalog/schemas";
import { EXACT_SEARCH } from "@/lib/catalog/schemas";
import type { Facets } from "@/lib/catalog/types";
import { cn } from "@/lib/utils";

import { AllergenIcon } from "./allergen-icons";
import { BrandPicker } from "./brand-picker";

// Every filter is a link: a URL to share, the back button undoes it, and it works before
// the JavaScript arrives. The brand, a long list, adds a search field above its links.

function toggled(list: string | undefined, item: string) {
	const items = listParam(list);
	const next = items.includes(item) ? items.filter(i => i !== item) : [...items, item];
	return next.length > 0 ? next.join(",") : undefined;
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
	return (
		<fieldset className="flex flex-col gap-3">
			<legend className="font-display text-lead mb-3 font-medium">{title}</legend>
			{children}
		</fieldset>
	);
}

export function FilterPanel({
	params,
	facets,
}: {
	params: BrowseParams;
	facets: Facets;
}) {
	const nutri = listParam(params.nutri);
	const without = listParam(params.senza);
	const counts = Object.fromEntries(facets.nutriscores.map(f => [f.value, f.count]));

	return (
		<div className="flex flex-col gap-8">
			<Group title="Nutri-Score">
				<ul className="grid grid-cols-5 gap-1">
					{NUTRISCORES.map(grade => {
						const active = nutri.includes(grade);
						return (
							<li key={grade}>
								<Link
									to="/"
									activeOptions={EXACT_SEARCH}
									search={prev => ({
										...prev,
										nutri: toggled(prev.nutri, grade),
										pagina: undefined,
									})}
									aria-current={active ? "true" : undefined}
									aria-label={`Nutri-Score ${grade.toUpperCase()}, ${counts[grade] ?? 0} zuppe`}
									className={cn(
										"rounded-thumb flex min-h-14 flex-col items-center justify-center no-underline transition-[background-color] duration-150",
										active ? chipOn : chipOff
									)}
								>
									<span className="font-display text-title leading-none font-semibold uppercase">
										{grade}
									</span>
									<span
										className={cn(
											"text-small tabular-nums",
											active ? "text-ground/80" : "text-text-soft"
										)}
									>
										{counts[grade] ?? 0}
									</span>
								</Link>
							</li>
						);
					})}
				</ul>
			</Group>

			<Group title="Senza">
				<ul className="flex flex-wrap gap-2">
					{ALLERGEN_FILTERS.map(allergen => {
						const active = without.includes(allergen);
						return (
							<li key={allergen}>
								<Link
									to="/"
									activeOptions={EXACT_SEARCH}
									search={prev => ({
										...prev,
										senza: toggled(prev.senza, allergen),
										pagina: undefined,
									})}
									aria-current={active ? "true" : undefined}
									className={cn(chip, "pl-3", active ? chipOn : chipOff)}
								>
									{/* A minus: the ingredient is taken away, the soups that have it leave the list. */}
									<span aria-hidden className="font-semibold">
										−
									</span>
									<AllergenIcon allergen={allergen} className="size-5" />
									{allergen.charAt(0).toUpperCase() + allergen.slice(1)}
								</Link>
							</li>
						);
					})}
				</ul>
				<p className="text-small text-text-soft">
					Esclude le zuppe che dichiarano l’allergene. Leggi sempre l’etichetta.
				</p>
			</Group>

			<BrandPicker brands={facets.brands} current={params.marca} />
		</div>
	);
}

/** The removable chips of what is filtered right now, each a link back to the list without it. */
export function ActiveFilters({ params }: { params: BrowseParams }) {
	const items: { label: string; search: (prev: BrowseParams) => BrowseParams }[] = [];
	if (params.tipo)
		items.push({
			label: subtypeLabel(params.tipo),
			search: prev => ({ ...prev, tipo: undefined }),
		});
	if (params.marca)
		items.push({
			label: params.marca,
			search: prev => ({ ...prev, marca: undefined }),
		});
	for (const grade of listParam(params.nutri)) {
		items.push({
			label: `Nutri-Score ${grade.toUpperCase()}`,
			search: prev => ({ ...prev, nutri: toggled(prev.nutri, grade) }),
		});
	}
	for (const allergen of listParam(params.senza)) {
		items.push({
			label: `Senza ${allergen}`,
			search: prev => ({ ...prev, senza: toggled(prev.senza, allergen) }),
		});
	}
	// A chip pops in when its filter is set and shrinks away when it is taken off; the whole row
	// leaves with the last one.
	const chipMotion = {
		initial: { opacity: 0, scale: 0.85 },
		animate: { opacity: 1, scale: 1 },
		exit: { opacity: 0, scale: 0.85 },
		transition: { duration: 0.18, ease: [0.2, 0, 0, 1] as const },
	};

	return (
		<AnimatePresence initial={false}>
			{items.length > 0 && (
				<m.ul
					key="active-filters"
					aria-label="Filtri attivi"
					className="flex flex-wrap items-center gap-2"
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					exit={{ opacity: 0 }}
				>
					<AnimatePresence initial={false}>
						{items.map(item => (
							<m.li key={item.label} {...chipMotion}>
								<Link
									to="/"
									activeOptions={EXACT_SEARCH}
									search={prev => ({ ...item.search(prev), pagina: undefined })}
									className={cn(chip, chipOn, "hover:bg-text/85")}
								>
									{item.label}
									<span aria-hidden>×</span>
									<span className="sr-only">: togli il filtro</span>
								</Link>
							</m.li>
						))}
					</AnimatePresence>
					<li>
						<Link
							to="/"
							activeOptions={EXACT_SEARCH}
							search={{
								q: params.q,
								tipo: undefined,
								marca: undefined,
								nutri: undefined,
								senza: undefined,
							}}
							className="text-body min-h-11 content-center px-2 underline"
						>
							Togli tutti i filtri
						</Link>
					</li>
				</m.ul>
			)}
		</AnimatePresence>
	);
}

export function activeFilterCount(params: BrowseParams) {
	return (
		(params.tipo ? 1 : 0) +
		(params.marca ? 1 : 0) +
		listParam(params.nutri).length +
		listParam(params.senza).length
	);
}
