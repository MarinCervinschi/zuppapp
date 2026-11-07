import { useEffect, useRef, useState } from "react";

import { Link, useNavigate } from "@tanstack/react-router";

import { buttonClass } from "@/components/ds/button";
import { CloseIcon, SearchIcon, SettingsIcon } from "@/components/ds/icons";
import { Sheet } from "@/components/ds/sheet";
import { type AdminListParams, NO_SUBTYPE } from "@/lib/admin/schemas";
import { subtypeLabel } from "@/lib/catalog/labels";
import { cn } from "@/lib/utils";

const SEARCH_DELAY_MS = 300;

const SORTS = [
	[undefined, "Prima senza tipo"],
	["nome", "Nome, A–Z"],
	["voti", "Più votati"],
	["recenti", "Aggiunti di recente"],
	["modificati", "Modificati di recente"],
] as const;

const YES_NO = [
	["foto", "Foto", "Con foto", "Senza foto"],
	["voti", "Voti", "Con voti", "Senza voti"],
	["corretti", "Correzioni", "Corrette a mano", "Mai corrette"],
] as const;

type Patch = Partial<AdminListParams>;

const chip =
	"text-body inline-flex min-h-11 items-center gap-2 rounded-full px-4 no-underline transition-[background-color,color] duration-150";
const on = "bg-text text-ground";
const off = "bg-text/[0.06] hover:bg-text/10";

/**
 * The admin's search, the «Filtri» button and the chips of what is filtered, all in the URL like
 * the public catalogue. The search follows the typing after a short pause; it is still a GET form,
 * so Enter works before JavaScript too. The filters open in a sheet, each option a link.
 */
export function AdminFilters({
	params,
	subtypes,
}: {
	params: AdminListParams;
	subtypes: { value: string; count: number }[];
}) {
	const navigate = useNavigate({ from: "/admin" });
	const [text, setText] = useState(params.q ?? "");
	const [sheet, setSheet] = useState(false);
	const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
	const input = useRef<HTMLInputElement>(null);

	// A link or the back button changed the search: the field follows.
	// Not while typing: the URL holds the trimmed text of the last pause, and writing it back would
	// eat a trailing space («minestrone » → «minestronedi»).
	useEffect(() => {
		if (document.activeElement !== input.current) setText(params.q ?? "");
	}, [params.q]);
	useEffect(() => () => clearTimeout(timer.current), []);

	function setQuery(value: string) {
		clearTimeout(timer.current);
		navigate({
			search: current => ({
				...current,
				q: value.trim() || undefined,
				pagina: undefined,
			}),
			replace: true,
			resetScroll: false,
		});
	}

	const chips = activeChips(params);

	return (
		<div className="flex flex-col gap-3">
			<div className="flex gap-2">
				<form
					role="search"
					method="get"
					action="/admin"
					className="min-w-0 flex-1"
					onSubmit={event => {
						event.preventDefault();
						setQuery(text);
					}}
				>
					{params.stato && <input type="hidden" name="stato" value={params.stato} />}
					<label htmlFor="admin-search" className="sr-only">
						Cerca per nome, marca o EAN
					</label>
					<div className="bg-ground-raised focus-within:ring-text flex min-h-12 items-center gap-2 rounded-full pr-0.5 pl-4 focus-within:ring-2">
						<SearchIcon className="text-text-soft size-5 shrink-0" />
						<input
							ref={input}
							id="admin-search"
							type="search"
							name="q"
							value={text}
							onChange={event => {
								const value = event.target.value;
								setText(value);
								clearTimeout(timer.current);
								timer.current = setTimeout(() => setQuery(value), SEARCH_DELAY_MS);
							}}
							placeholder="Nome, marca o EAN"
							autoComplete="off"
							enterKeyHint="search"
							className="text-body placeholder:text-text-soft min-h-12 w-full min-w-0 bg-transparent outline-none [&::-webkit-search-cancel-button]:hidden"
						/>
						{text && (
							<button
								type="button"
								onClick={() => {
									setText("");
									setQuery("");
									input.current?.focus();
								}}
								className="hover:bg-text/10 grid size-11 shrink-0 place-items-center rounded-full"
							>
								<CloseIcon className="size-5" />
								<span className="sr-only">Svuota la ricerca</span>
							</button>
						)}
					</div>
				</form>
				<button
					type="button"
					onClick={() => setSheet(true)}
					className={cn(buttonClass(), "min-h-12 shrink-0 px-4")}
				>
					<SettingsIcon className="size-5" />
					<span className="max-sm:sr-only">Filtri</span>
					{chips.length > 0 && (
						<span className="bg-field text-on-field text-small grid min-w-6 place-items-center rounded-full px-1.5 font-semibold tabular-nums">
							{chips.length}
							<span className="sr-only"> attivi</span>
						</span>
					)}
				</button>
			</div>

			{chips.length > 0 && (
				<ul aria-label="Filtri attivi" className="flex flex-wrap gap-2">
					{chips.map(({ label, patch }) => (
						<li key={label}>
							<Link
								to="/admin"
								search={current => ({ ...current, ...patch, pagina: undefined })}
								className={cn(chip, on, "min-h-10 pr-3 text-[0.9375rem]")}
							>
								{label}
								<CloseIcon className="size-4" />
								<span className="sr-only">: togli il filtro</span>
							</Link>
						</li>
					))}
				</ul>
			)}

			{sheet && (
				<FilterSheet
					params={params}
					subtypes={subtypes}
					onClosed={() => setSheet(false)}
				/>
			)}
		</div>
	);
}

/** What is filtered right now, each with the change that takes it off. */
function activeChips(params: AdminListParams) {
	const chips: { label: string; patch: Patch }[] = [];
	if (params.tipo)
		chips.push({
			label: params.tipo === NO_SUBTYPE ? "Senza tipo" : subtypeLabel(params.tipo),
			patch: { tipo: undefined },
		});
	for (const [key, , yes, no] of YES_NO) {
		const value = params[key];
		if (value)
			chips.push({ label: value === "si" ? yes : no, patch: { [key]: undefined } });
	}
	if (params.ordine) {
		const sort = SORTS.find(([value]) => value === params.ordine);
		if (sort) chips.push({ label: sort[1], patch: { ordine: undefined } });
	}
	return chips;
}

/** Every filter as tappable options, grouped; each is a link, so the list changes behind at once. */
function FilterSheet({
	params,
	subtypes,
	onClosed,
}: {
	params: AdminListParams;
	subtypes: { value: string; count: number }[];
	onClosed: () => void;
}) {
	const option = (
		patch: Patch,
		active: boolean,
		label: React.ReactNode,
		key: string
	) => (
		<li key={key}>
			<Link
				to="/admin"
				search={current => ({ ...current, ...patch, pagina: undefined })}
				replace
				resetScroll={false}
				aria-current={active ? "true" : undefined}
				className={cn(chip, active ? on : off)}
			>
				{label}
			</Link>
		</li>
	);

	return (
		<Sheet
			title="Filtri"
			actions={
				<Link
					to="/admin"
					search={{ stato: params.stato, q: params.q }}
					replace
					resetScroll={false}
					className="text-body min-h-11 content-center px-2 font-medium underline"
				>
					Azzera
				</Link>
			}
			onClosed={onClosed}
			wide="panel"
		>
			{close => (
				<div className="flex flex-col gap-6">
					<Group title="Tipo">
						{option({ tipo: undefined }, !params.tipo, "Ogni tipo", "any")}
						{subtypes.map(({ value, count }) =>
							option(
								{ tipo: value },
								params.tipo === value,
								<>
									{value === NO_SUBTYPE ? "Senza tipo" : subtypeLabel(value)}
									<span className="text-small tabular-nums opacity-70">{count}</span>
								</>,
								value
							)
						)}
					</Group>

					{YES_NO.map(([key, title, yes, no]) => (
						<Group key={key} title={title}>
							{option({ [key]: undefined }, !params[key], "Tutti", "all")}
							{option({ [key]: "si" }, params[key] === "si", yes, "si")}
							{option({ [key]: "no" }, params[key] === "no", no, "no")}
						</Group>
					))}

					<Group title="Ordine">
						{SORTS.map(([value, label]) =>
							option(
								{ ordine: value },
								params.ordine === value,
								label,
								value ?? "queue"
							)
						)}
					</Group>

					<button
						type="button"
						onClick={close}
						className={cn(buttonClass("ink"), "w-full")}
					>
						Fatto
					</button>
				</div>
			)}
		</Sheet>
	);
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
	return (
		<section className="flex flex-col gap-3">
			<h3 className="font-display text-lead font-medium">{title}</h3>
			<ul className="flex flex-wrap gap-2">{children}</ul>
		</section>
	);
}
