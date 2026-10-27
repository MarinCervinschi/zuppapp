import { useRef } from "react";

import { Link } from "@tanstack/react-router";

import { Button } from "@/components/ds/button";
import { subtypeLabel, zuppe } from "@/lib/catalog/labels";
import {
	ALLERGEN_FILTERS,
	type BrowseParams,
	NUTRISCORES,
	listParam,
} from "@/lib/catalog/schemas";
import { EXACT_SEARCH } from "@/lib/catalog/schemas";
import type { Facets } from "@/lib/catalog/types";
import { cn } from "@/lib/utils";

import { BrandPicker } from "./brand-picker";

// Every filter is a link: a URL to share, the back button undoes it, and it works before
// the JavaScript arrives. The brand, a long list, adds a search field above its links.

const chip =
	"text-body inline-flex min-h-11 items-center gap-2 rounded-full px-4 no-underline transition-[background-color] duration-150";
const on = "bg-text text-ground";
// A tint of the ink, not a surface: it reads on the page (sidebar) and on the sheet alike.
const off = "bg-text/[0.06] hover:bg-text/10";

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
			<Group title="Tipo">
				<ul className="flex flex-wrap gap-2">
					<li>
						<Link
							to="/"
							activeOptions={EXACT_SEARCH}
							search={prev => ({ ...prev, tipo: undefined, pagina: undefined })}
							aria-current={!params.tipo ? "true" : undefined}
							className={cn(chip, !params.tipo ? on : off)}
						>
							Tutte
						</Link>
					</li>
					{facets.subtypes.map(({ value, count }) => {
						const active = params.tipo === value;
						return (
							<li key={value}>
								<Link
									to="/"
									activeOptions={EXACT_SEARCH}
									search={prev => ({
										...prev,
										tipo: active ? undefined : value,
										pagina: undefined,
									})}
									aria-current={active ? "true" : undefined}
									className={cn(chip, active ? on : off)}
								>
									{subtypeLabel(value)}
									<span
										className={cn(
											"text-small tabular-nums",
											active ? "text-ground/80" : "text-text-soft"
										)}
									>
										{count}
									</span>
								</Link>
							</li>
						);
					})}
				</ul>
			</Group>

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
										active ? on : off
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
									className={cn(chip, active ? on : off)}
								>
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
	if (items.length === 0) return null;

	return (
		<ul aria-label="Filtri attivi" className="flex flex-wrap items-center gap-2">
			{items.map(item => (
				<li key={item.label}>
					<Link
						to="/"
						activeOptions={EXACT_SEARCH}
						search={prev => ({ ...item.search(prev), pagina: undefined })}
						className={cn(chip, on, "hover:bg-text/85")}
					>
						{item.label}
						<span aria-hidden>×</span>
						<span className="sr-only">: togli il filtro</span>
					</Link>
				</li>
			))}
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
		</ul>
	);
}

/**
 * On a phone the panel opens as a sheet from the bottom: a native dialog, so focus, Escape
 * and the backdrop behave as the platform does.
 */
export function FilterSheet({
	params,
	facets,
	active,
}: {
	params: BrowseParams;
	facets: Facets;
	active: number;
}) {
	const dialog = useRef<HTMLDialogElement>(null);
	return (
		<>
			<Button onClick={() => dialog.current?.showModal()} className="lg:hidden">
				<svg
					aria-hidden
					viewBox="0 0 24 24"
					className="size-5"
					fill="none"
					stroke="currentColor"
					strokeWidth="1.8"
					strokeLinecap="round"
				>
					<path d="M4 7h10M18 7h2M4 17h2M10 17h10" />
					<circle cx="16" cy="7" r="2" />
					<circle cx="8" cy="17" r="2" />
				</svg>
				Filtri{active > 0 && <span className="tabular-nums"> ({active})</span>}
			</Button>
			<dialog
				ref={dialog}
				aria-labelledby="filter-sheet-title"
				className="bg-ground-raised text-text m-0 mt-auto max-h-[85dvh] w-full max-w-none overflow-y-auto overscroll-contain rounded-t-[var(--radius-card)] p-0 backdrop:bg-black/50"
				onClick={event => {
					if (event.target === dialog.current) dialog.current.close();
				}}
			>
				<div className="bg-ground-raised sticky top-0 z-10 flex items-center justify-between px-4 pt-4 pb-3">
					<h2 id="filter-sheet-title" className="font-display text-title font-semibold">
						Filtri
					</h2>
					<Button variant="ink" onClick={() => dialog.current?.close()}>
						Mostra {zuppe(facets.total)}
					</Button>
				</div>
				<div className="px-4 pb-8">
					<FilterPanel params={params} facets={facets} />
				</div>
			</dialog>
		</>
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
