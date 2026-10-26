import { useId, useRef, useState } from "react";

import { Link } from "@tanstack/react-router";

import { EXACT_SEARCH } from "@/lib/catalog/schemas";
import type { FacetValue } from "@/lib/catalog/types";
import { MARCHE, count } from "@/lib/plural";
import { cn } from "@/lib/utils";

const fold = (text: string) =>
	text
		.normalize("NFD")
		.replace(/\p{Diacritic}/gu, "")
		.toLowerCase();

/**
 * The brand filter: a disclosure that opens in the flow of the panel, not over it, with a
 * search field above the brands, most stocked first. Every brand is a link, like every other
 * filter; typing only narrows the list. Escape closes it and gives focus back to its button.
 */
export function BrandPicker({
	brands,
	current,
}: {
	brands: FacetValue[];
	current?: string;
}) {
	const [open, setOpen] = useState(false);
	const [text, setText] = useState("");
	const button = useRef<HTMLButtonElement>(null);
	const panelId = useId();
	const shown = text
		? brands.filter(brand => fold(brand.value).includes(fold(text)))
		: brands;

	function close() {
		setOpen(false);
		setText("");
		button.current?.focus();
	}

	const row =
		"text-body flex min-h-11 items-center justify-between gap-3 px-3 no-underline transition-[background-color] duration-150";

	return (
		<div
			className="flex flex-col gap-2"
			onKeyDown={event => {
				if (event.key === "Escape" && open) {
					event.stopPropagation();
					close();
				}
			}}
		>
			<span
				className="font-condensed text-lead font-extrabold uppercase"
				id={`${panelId}-label`}
			>
				Marca
			</span>
			<button
				ref={button}
				type="button"
				aria-expanded={open}
				aria-controls={panelId}
				aria-describedby={`${panelId}-label`}
				onClick={() => (open ? close() : setOpen(true))}
				className={cn(
					"text-body flex min-h-12 w-full items-center justify-between gap-3 px-3 text-left font-semibold",
					current ? "bg-text text-ground" : "bg-ground hover:bg-text/10"
				)}
			>
				<span className="truncate">{current ?? "Tutte le marche"}</span>
				{/* A chevron drawn in the ink, turning when the list is open. */}
				<svg
					aria-hidden
					viewBox="0 0 12 8"
					className={cn(
						"size-3 shrink-0 transition-[rotate] duration-150",
						open && "rotate-180"
					)}
				>
					<path d="M1 1.5l5 5 5-5" fill="none" stroke="currentColor" strokeWidth="2" />
				</svg>
			</button>

			{open && (
				<div id={panelId} className="bg-ground flex flex-col">
					<label className="sr-only" htmlFor={`${panelId}-search`}>
						Cerca una marca
					</label>
					<input
						id={`${panelId}-search`}
						type="search"
						autoFocus
						value={text}
						onChange={event => setText(event.target.value)}
						placeholder="Esselunga, Knorr…"
						autoComplete="off"
						className="bg-ground-raised text-body placeholder:text-text-soft border-text m-2 min-h-11 border-b-[3px] px-3"
					/>
					<p className="sr-only" aria-live="polite">
						{count(shown.length, MARCHE)}
					</p>
					<ul className="max-h-72 overflow-y-auto overscroll-contain pb-2">
						{!text && (
							<li>
								<Link
									to="/"
									activeOptions={EXACT_SEARCH}
									search={prev => ({ ...prev, marca: undefined, pagina: undefined })}
									aria-current={!current ? "true" : undefined}
									onClick={() => setOpen(false)}
									className={cn(
										row,
										!current ? "bg-text text-ground" : "hover:bg-text/10"
									)}
								>
									Tutte le marche
								</Link>
							</li>
						)}
						{shown.map(({ value, count }) => {
							const active = current === value;
							return (
								<li key={value}>
									<Link
										to="/"
										activeOptions={EXACT_SEARCH}
										search={prev => ({
											...prev,
											marca: active ? undefined : value,
											pagina: undefined,
										})}
										aria-current={active ? "true" : undefined}
										onClick={() => {
											setOpen(false);
											setText("");
										}}
										className={cn(
											row,
											active ? "bg-text text-ground" : "hover:bg-text/10"
										)}
									>
										<span>{value}</span>
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
						{shown.length === 0 && (
							<li className="text-body px-3 py-2">Nessuna marca con «{text}».</li>
						)}
					</ul>
				</div>
			)}
		</div>
	);
}
