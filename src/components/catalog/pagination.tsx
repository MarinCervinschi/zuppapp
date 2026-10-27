import { useId, useRef, useState } from "react";

import { Link } from "@tanstack/react-router";

import type { BrowseParams } from "@/lib/catalog/schemas";
import { EXACT_SEARCH } from "@/lib/catalog/schemas";
import { cn } from "@/lib/utils";

type PageParam = "pagina" | "posti";
/** The two screens that page through the catalogue, with the same URL params. */
export type CatalogRoute = "/" | "/classifica";

/** 1 … 4 5 6 … 38: the first, the last and the neighbours of the current page. */
export function pageWindow(page: number, pageCount: number): (number | "gap")[] {
	const pages = new Set([1, pageCount, page - 1, page, page + 1]);
	const sorted = [...pages].filter(p => p >= 1 && p <= pageCount).sort((a, b) => a - b);
	const result: (number | "gap")[] = [];
	for (const p of sorted) {
		const last = result.at(-1);
		if (typeof last === "number" && p - last > 1)
			result.push(p - last === 2 ? last + 1 : "gap");
		result.push(p);
	}
	return result;
}

const number = new Intl.NumberFormat("it-IT");

// Quiet by default, like the rest of the controls: plain numbers on the paper, the current page
// inked in. Every cell stays a 44px target even where it looks small.
const cell =
	"text-body inline-flex min-h-11 min-w-11 items-center justify-center rounded-full px-2 font-medium tabular-nums no-underline transition-[background-color] duration-150";
const step =
	"text-body inline-flex min-h-11 items-center gap-1.5 rounded-full px-3 font-medium no-underline transition-[background-color] duration-150";

function Chevron({ back }: { back?: boolean }) {
	return (
		<svg
			aria-hidden
			viewBox="0 0 8 12"
			className={cn("size-2.5 shrink-0", back && "rotate-180")}
		>
			<path d="M1.5 1l5 5-5 5" fill="none" stroke="currentColor" strokeWidth="2" />
		</svg>
	);
}

/**
 * One line under a list: the pages on the left («‹ Indietro 1 2 … 38 Avanti ›»), what this page
 * shows and how many per page on the right. Each page and each size is a URL; the link lands on
 * its own section, and changing the size starts again from the first page.
 */
export function Pagination({
	page,
	pageCount,
	pageSize,
	total,
	sizes,
	param,
	sizeParam,
	section,
	label,
	unit,
	firstNumber = 1,
	route = "/",
}: {
	page: number;
	pageCount: number;
	pageSize: number;
	total: number;
	/** The sizes on offer; the first is the default and stays out of the URL. */
	sizes: readonly number[];
	/** Which page of the home this moves: the ranking's or the shelf's. */
	param: PageParam;
	sizeParam: "mostra" | "righe";
	/** The id of the section to scroll back to. */
	section: string;
	label: string;
	/** What is being counted, in the plural: "zuppe", "posti". */
	unit: string;
	/** The number of the first item of page 1: 4 in the ranking, after the podium. */
	firstNumber?: number;
	route?: CatalogRoute;
}) {
	if (total <= 0) return null;
	const to = (p: number) => (prev: BrowseParams) => ({
		...prev,
		[param]: p === 1 ? undefined : p,
	});
	const first = firstNumber + (page - 1) * pageSize;
	const last = Math.min(firstNumber - 1 + total, first + pageSize - 1);
	const range =
		unit === "posti"
			? `Posti ${number.format(first)}–${number.format(last)} di ${number.format(firstNumber - 1 + total)}`
			: `${number.format(first)}–${number.format(last)} di ${number.format(total)} ${unit}`;

	return (
		<div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
			{pageCount > 1 ? (
				<nav aria-label={label}>
					<ul className="flex items-center gap-0.5">
						<li>
							{page > 1 ? (
								<Link
									to={route}
									activeOptions={EXACT_SEARCH}
									search={to(page - 1)}
									hash={section}
									className={cn(step, "hover:bg-text/10")}
								>
									<Chevron back />
									<span className="max-sm:sr-only">Indietro</span>
								</Link>
							) : (
								// Kept in place, faded, so the numbers never jump between pages.
								<span aria-hidden className={cn(step, "text-text-soft opacity-50")}>
									<Chevron back />
									<span className="max-sm:hidden">Indietro</span>
								</span>
							)}
						</li>
						{pageWindow(page, pageCount).map((item, index) =>
							item === "gap" ? (
								<li key={`gap-${index}`} aria-hidden className="text-text-soft px-1">
									…
								</li>
							) : (
								<li key={item}>
									<Link
										to={route}
										activeOptions={EXACT_SEARCH}
										search={to(item)}
										hash={section}
										aria-label={`Pagina ${item}`}
										aria-current={item === page ? "page" : undefined}
										className={cn(
											cell,
											item === page ? "bg-text text-ground" : "hover:bg-text/10"
										)}
									>
										{item}
									</Link>
								</li>
							)
						)}
						<li>
							{page < pageCount ? (
								<Link
									to={route}
									activeOptions={EXACT_SEARCH}
									search={to(page + 1)}
									hash={section}
									className={cn(step, "hover:bg-text/10")}
								>
									<span className="max-sm:sr-only">Avanti</span>
									<Chevron />
								</Link>
							) : (
								<span aria-hidden className={cn(step, "text-text-soft opacity-50")}>
									<span className="max-sm:hidden">Avanti</span>
									<Chevron />
								</span>
							)}
						</li>
					</ul>
				</nav>
			) : (
				<span />
			)}
			<div className="flex items-center gap-3">
				<p className="text-small text-text-soft tabular-nums">{range}</p>
				{total > sizes[0] && (
					<PageSizeMenu
						sizes={sizes}
						current={pageSize}
						param={param}
						sizeParam={sizeParam}
						section={section}
						unit={unit}
						route={route}
					/>
				)}
			</div>
		</div>
	);
}

/**
 * «Per pagina 10 ▾»: a small menu of links, opening upwards because it sits at the foot of a
 * list. It floats over the list, so it is the one thing in the system with a shadow. Escape and
 * a tap elsewhere close it; focus goes back to its button.
 */
function PageSizeMenu({
	sizes,
	current,
	param,
	sizeParam,
	section,
	unit,
	route,
}: {
	route: CatalogRoute;
	sizes: readonly number[];
	current: number;
	param: PageParam;
	sizeParam: "mostra" | "righe";
	section: string;
	unit: string;
}) {
	const [open, setOpen] = useState(false);
	const button = useRef<HTMLButtonElement>(null);
	const menuId = useId();
	const sized = (size: number) => (prev: BrowseParams) => ({
		...prev,
		[param]: undefined,
		[sizeParam]: size === sizes[0] ? undefined : size,
	});

	function close(refocus = true) {
		setOpen(false);
		if (refocus) button.current?.focus();
	}

	return (
		<div
			className="relative flex items-center gap-2"
			onKeyDown={event => {
				if (event.key === "Escape" && open) close();
			}}
			onBlur={event => {
				if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
			}}
		>
			<span className="text-small text-text-soft" id={`${menuId}-label`}>
				Per pagina
			</span>
			<button
				ref={button}
				type="button"
				aria-expanded={open}
				aria-controls={menuId}
				aria-label={`${current} ${unit} per pagina, cambia`}
				onClick={() => setOpen(value => !value)}
				className="bg-ground-raised text-body hover:bg-text/10 inline-flex min-h-11 items-center gap-2 rounded-full px-4 font-medium tabular-nums"
			>
				{current}
				<svg
					aria-hidden
					viewBox="0 0 12 8"
					className={cn(
						"size-2.5 transition-[rotate] duration-150",
						open && "rotate-180"
					)}
				>
					<path d="M1 6.5l5-5 5 5" fill="none" stroke="currentColor" strokeWidth="2" />
				</svg>
			</button>
			{open && (
				<ul
					id={menuId}
					aria-labelledby={`${menuId}-label`}
					className="glass rounded-thumb absolute right-0 bottom-full z-20 mb-1 flex min-w-full flex-col overflow-hidden py-1"
				>
					{sizes.map(size => (
						<li key={size}>
							<Link
								to={route}
								activeOptions={EXACT_SEARCH}
								search={sized(size)}
								hash={section}
								aria-current={size === current ? "true" : undefined}
								onClick={() => close(false)}
								className={cn(
									"text-body flex min-h-11 items-center px-4 font-medium tabular-nums no-underline",
									size === current ? "bg-text text-ground" : "hover:bg-text/10"
								)}
							>
								{size}
							</Link>
						</li>
					))}
				</ul>
			)}
		</div>
	);
}
