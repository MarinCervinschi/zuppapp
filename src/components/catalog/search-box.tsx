import { useEffect, useId, useRef, useState } from "react";

import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";

import { CloseIcon, SearchIcon } from "@/components/ds/icons";
import { PackPhoto } from "@/components/ds/pack-photo";
import { StarIcon } from "@/components/ds/stars";
import { useOpenSoup } from "@/components/product/soup-sheet";
import { subtypeLabel } from "@/lib/catalog/labels";
import { catalogQueries } from "@/lib/catalog/queries";
import { ZUPPE, count } from "@/lib/plural";
import { cn } from "@/lib/utils";

import { SubtypeIcon, subtypeColor } from "./type-icons";

const SUGGEST_PAUSE_MS = 150;

type Option =
	| {
			kind: "soup";
			key: string;
			ean: string;
			label: string;
			detail: string | null;
			image: string | null;
			mean: number | null;
	  }
	| { kind: "type"; key: string; value: string; count: number }
	| { kind: "brand"; key: string; value: string; count: number }
	| { kind: "all"; key: string };

/** The part of a name that matches what was typed, in bold: the reader sees why it came up. */
function Highlight({ text, query }: { text: string; query: string }) {
	const at = text.toLowerCase().indexOf(query.trim().toLowerCase());
	if (at < 0 || !query.trim()) return <>{text}</>;
	const end = at + query.trim().length;
	return (
		<>
			{text.slice(0, at)}
			<b className="font-semibold">{text.slice(at, end)}</b>
			{text.slice(end)}
		</>
	);
}

/**
 * The search, with suggestions while you type: soups (a tap opens their sheet), types and brands
 * (a tap filters), and «Tutti i risultati». The list follows the ARIA combobox pattern: arrows
 * move, Enter picks, Escape closes. The text becomes a search only on Enter or a choice, so the
 * list behind does not jump at every letter.
 */
export function SearchBox({
	value,
	listClassName,
}: {
	value: string;
	/** Where the suggestions reach sideways, when the row has more than the field. */
	listClassName?: string;
}) {
	const navigate = useNavigate({ from: "/" });
	const openSoup = useOpenSoup();
	const id = useId();
	const input = useRef<HTMLInputElement>(null);
	const [text, setText] = useState(value);
	const [asked, setAsked] = useState(value);
	const [open, setOpen] = useState(false);
	const [active, setActive] = useState(-1);

	// Back and forward change the URL under us: the field follows, unless the reader is typing.
	useEffect(() => {
		if (document.activeElement !== input.current) setText(value);
	}, [value]);
	useEffect(() => {
		const timer = setTimeout(() => setAsked(text.trim()), SUGGEST_PAUSE_MS);
		return () => clearTimeout(timer);
	}, [text]);

	const { data } = useQuery(catalogQueries.suggest(asked));
	const typed = text.trim();
	const options: Option[] =
		typed.length >= 2 && data
			? [
					...data.products.map(p => ({
						kind: "soup" as const,
						key: `soup-${p.ean}`,
						ean: p.ean,
						label: p.name,
						detail: p.brand,
						image: p.imageUrl,
						mean: p.mean,
					})),
					...data.subtypes.map(t => ({
						kind: "type" as const,
						key: `type-${t.value}`,
						...t,
					})),
					...data.brands.map(b => ({
						kind: "brand" as const,
						key: `brand-${b.value}`,
						...b,
					})),
					{ kind: "all" as const, key: "all" },
				]
			: [];
	const showList = open && options.length > 0;
	// The list changes under the arrows when new suggestions arrive: an index past its end is none.
	const activeOption =
		active >= 0 && active < options.length ? options[active] : undefined;
	useEffect(() => setActive(-1), [data]);

	function search(next: string) {
		setOpen(false);
		input.current?.blur();
		navigate({
			search: prev => ({ ...prev, q: next.trim() || undefined, pagina: undefined }),
			hash: next.trim() ? "risultati" : undefined,
		});
	}

	function pick(option: Option) {
		setOpen(false);
		setActive(-1);
		if (option.kind === "soup") return openSoup(option.ean);
		input.current?.blur();
		if (option.kind === "all") return search(text);
		setText("");
		navigate({
			search: prev => ({
				...prev,
				q: undefined,
				pagina: undefined,
				...(option.kind === "type" ? { tipo: option.value } : { marca: option.value }),
			}),
			hash: "risultati",
		});
	}

	return (
		<form
			role="search"
			onSubmit={event => {
				event.preventDefault();
				if (showList && activeOption) pick(activeOption);
				else search(text);
			}}
			className="relative w-full"
		>
			<label htmlFor={`${id}-input`} className="sr-only">
				Cerca una zuppa
			</label>
			<div
				className={cn(
					"bg-ground-raised float-shadow flex min-h-14 items-center gap-3 rounded-full pr-2 pl-5 transition-[box-shadow] duration-200",
					open && "ring-text ring-2"
				)}
			>
				<SearchIcon className="text-text size-5 shrink-0" />
				<input
					ref={input}
					id={`${id}-input`}
					type="search"
					name="q"
					role="combobox"
					aria-autocomplete="list"
					aria-expanded={showList}
					aria-controls={`${id}-list`}
					aria-activedescendant={
						showList && activeOption ? `${id}-${activeOption.key}` : undefined
					}
					value={text}
					autoComplete="off"
					enterKeyHint="search"
					placeholder="minestrone, ceci, Knorr…"
					onFocus={() => setOpen(true)}
					onBlur={() => setOpen(false)}
					onChange={event => {
						setText(event.target.value);
						setOpen(true);
						setActive(-1);
					}}
					onKeyDown={event => {
						if (event.key === "Escape" && showList) {
							event.preventDefault();
							setOpen(false);
						} else if (event.key === "ArrowDown" || event.key === "ArrowUp") {
							if (!options.length) return;
							event.preventDefault();
							setOpen(true);
							const step = event.key === "ArrowDown" ? 1 : -1;
							// From the field (-1) down to the last option and back round to the field.
							setActive(i => {
								const next = i + step;
								if (next >= options.length) return -1;
								if (next < -1) return options.length - 1;
								return next;
							});
						}
					}}
					className="text-text text-body placeholder:text-text-soft min-h-12 w-full min-w-0 bg-transparent outline-none [&::-webkit-search-cancel-button]:hidden"
				/>
				{text && (
					<button
						type="button"
						onMouseDown={event => event.preventDefault()}
						onClick={() => {
							setText("");
							setActive(-1);
							// The button goes with the text: the focus stays in the field, ready for new words.
							input.current?.focus();
							if (value)
								navigate({
									search: prev => ({ ...prev, q: undefined, pagina: undefined }),
									resetScroll: false,
								});
						}}
						className="hover:bg-text/10 grid size-11 shrink-0 place-items-center rounded-full transition-[scale] duration-150 motion-safe:active:scale-[0.92]"
					>
						<CloseIcon className="size-5" />
						<span className="sr-only">Svuota la ricerca</span>
					</button>
				)}
			</div>

			{/* Kept in the DOM, so aria-controls always points at something. */}
			<ul
				id={`${id}-list`}
				role="listbox"
				aria-label="Suggerimenti"
				hidden={!showList}
				className={cn(
					"bg-ground-raised motion-safe:animate-rise overlay-shadow absolute inset-x-0 top-full z-50 mt-2 flex flex-col overflow-hidden rounded-[1.75rem] p-2 text-left",
					listClassName
				)}
			>
				{options.map((option, index) => (
					<li
						key={option.key}
						id={`${id}-${option.key}`}
						role="option"
						aria-selected={index === active}
						// Pressing must not blur the field first, or the list closes under the finger.
						onMouseDown={event => event.preventDefault()}
						onClick={() => pick(option)}
						onMouseEnter={() => setActive(index)}
						className={cn(
							"flex min-h-14 cursor-pointer items-center gap-3 rounded-[1.25rem] px-2 py-1.5",
							index === active && "bg-text/[0.07]",
							option.kind === "all" && "mt-1"
						)}
					>
						{option.kind === "soup" ? (
							<>
								<span className="plate grid size-12 shrink-0 place-items-center overflow-hidden rounded-[0.875rem] bg-white">
									<PackPhoto
										src={option.image}
										alt=""
										size="thumb"
										className="size-full rounded-none object-cover"
									/>
								</span>
								<span className="flex min-w-0 flex-1 flex-col">
									<span className="text-body leading-snug">
										<Highlight text={option.label} query={typed} />
									</span>
									{option.detail && (
										<span className="text-small text-text-soft">{option.detail}</span>
									)}
								</span>
								{option.mean !== null && (
									<span className="bg-badge-good text-small inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 font-semibold text-[#16120f] tabular-nums">
										<StarIcon className="size-3" />
										{option.mean.toLocaleString("it-IT")}
										<span className="sr-only"> stelle</span>
									</span>
								)}
							</>
						) : option.kind === "type" ? (
							<>
								<span
									className={cn(
										"grid size-12 shrink-0 place-items-center rounded-full",
										subtypeColor(option.value)
									)}
								>
									<SubtypeIcon subtype={option.value} className="size-6" />
								</span>
								<span className="text-body flex-1">
									<Highlight text={subtypeLabel(option.value)} query={typed} />
								</span>
								<span className="text-small text-text-soft">
									{count(option.count, ZUPPE)}
								</span>
							</>
						) : option.kind === "brand" ? (
							<>
								<span className="bg-ground font-display text-lead grid size-12 shrink-0 place-items-center rounded-full font-semibold">
									{option.value.charAt(0)}
								</span>
								<span className="text-body flex-1">
									<Highlight text={option.value} query={typed} />
								</span>
								<span className="text-small text-text-soft">
									{count(option.count, ZUPPE)}
								</span>
							</>
						) : (
							<>
								<span className="bg-ground grid size-12 shrink-0 place-items-center rounded-full">
									<SearchIcon className="size-5" />
								</span>
								<span className="text-body flex-1">
									Tutti i risultati per «{typed}»
								</span>
							</>
						)}
					</li>
				))}
			</ul>
		</form>
	);
}
