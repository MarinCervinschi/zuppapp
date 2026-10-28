import { useEffect, useId, useRef, useState } from "react";

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
	const panel = useRef<HTMLDivElement>(null);
	const search = useRef<HTMLInputElement>(null);
	const panelId = useId();
	const shown = text
		? brands.filter(brand => fold(brand.value).includes(fold(text)))
		: brands;

	// Opening shows the list, ready to scroll; the search field waits until it is tapped, so a
	// phone's keyboard never comes up over the list. The panel scrolls to the top of the sheet.
	useEffect(() => {
		if (!open) return;
		panel.current?.scrollIntoView({ block: "start", behavior: "smooth" });
	}, [open]);

	/** Once the keyboard is up, the field goes to the top of what is left, the list under it. */
	function keepFieldInView() {
		if (window.matchMedia("(pointer: fine)").matches) return;
		setTimeout(
			() => search.current?.scrollIntoView({ block: "start", behavior: "smooth" }),
			300
		);
	}

	function close() {
		setOpen(false);
		setText("");
		button.current?.focus();
	}

	const row =
		"text-body flex min-h-11 items-center justify-between gap-3 rounded-full px-4 no-underline transition-[background-color] duration-150";

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
			<span className="font-display text-lead font-medium" id={`${panelId}-label`}>
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
					"text-body flex min-h-12 w-full items-center justify-between gap-3 rounded-full px-4 text-left",
					current ? "bg-text text-ground" : "bg-text/[0.06] hover:bg-text/10"
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
				<div
					ref={panel}
					id={panelId}
					className="bg-text/[0.06] rounded-panel motion-safe:animate-rise flex scroll-mt-24 flex-col gap-1 p-1.5"
				>
					<label className="sr-only" htmlFor={`${panelId}-search`}>
						Cerca una marca
					</label>
					<span className="relative flex items-center">
						<svg
							aria-hidden
							viewBox="0 0 24 24"
							className="text-text-soft pointer-events-none absolute left-4 size-4"
							fill="none"
							stroke="currentColor"
							strokeWidth="2"
							strokeLinecap="round"
						>
							<circle cx="11" cy="11" r="6.5" />
							<path d="M16 16l4.5 4.5" />
						</svg>
						<input
							ref={search}
							id={`${panelId}-search`}
							type="search"
							value={text}
							onFocus={keepFieldInView}
							onChange={event => setText(event.target.value)}
							placeholder="Esselunga, Knorr…"
							autoComplete="off"
							className="bg-ground-raised text-body placeholder:text-text-soft min-h-11 w-full scroll-mt-24 rounded-full pr-4 pl-10 focus-visible:outline-offset-0"
						/>
					</span>
					<p className="sr-only" aria-live="polite">
						{count(shown.length, MARCHE)}
					</p>
					<ul className="fade-bottom flex max-h-[min(18rem,38svh)] [scrollbar-width:thin] flex-col gap-0.5 overflow-y-auto overscroll-contain pb-6">
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
			{/* With a touch keyboard up, the sheet needs room below to lift the field to its top. */}
			{open && <div aria-hidden className="h-[45svh] pointer-fine:hidden" />}
		</div>
	);
}
