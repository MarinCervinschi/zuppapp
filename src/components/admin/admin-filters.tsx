import { useEffect, useRef, useState } from "react";

import { Link, useNavigate } from "@tanstack/react-router";

import { CloseIcon, SearchIcon } from "@/components/ds/icons";
import { type AdminListParams, NO_SUBTYPE } from "@/lib/admin/schemas";
import { subtypeLabel } from "@/lib/catalog/labels";
import { cn } from "@/lib/utils";

const SEARCH_DELAY_MS = 300;

const SORTS = [
	["", "Prima senza tipo"],
	["nome", "Nome, A–Z"],
	["voti", "Più votati"],
	["recenti", "Aggiunti di recente"],
	["modificati", "Modificati di recente"],
] as const;

const YES_NO = {
	foto: ["Foto", "Con foto", "Senza foto"],
	voti: ["Voti", "Con voti", "Senza voti"],
	corretti: ["Correzioni", "Corretti", "Mai corretti"],
} as const;

const select =
	"bg-ground-raised text-small sm:text-body min-h-11 w-full rounded-full border-0 py-0 pr-8 pl-4 font-medium sm:w-auto sm:pr-9 data-[on=true]:bg-text data-[on=true]:text-ground";

/**
 * The admin's search and filters, all in the URL like the public catalogue. The search follows
 * the typing after a short pause; it is still a GET form, so Enter works before JavaScript too.
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
	const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

	// A link or the back button changed the search: the field follows.
	useEffect(() => setText(params.q ?? ""), [params.q]);
	useEffect(() => () => clearTimeout(timer.current), []);

	function set(patch: Partial<AdminListParams>) {
		navigate({
			search: current => ({ ...current, ...patch, pagina: undefined }),
			replace: true,
		});
	}

	function type(value: string) {
		setText(value);
		clearTimeout(timer.current);
		timer.current = setTimeout(
			() => set({ q: value.trim() || undefined }),
			SEARCH_DELAY_MS
		);
	}

	const filtered = Boolean(
		params.q ||
		params.tipo ||
		params.foto ||
		params.voti ||
		params.corretti ||
		params.ordine
	);

	return (
		<div className="flex flex-col gap-3">
			<form
				role="search"
				method="get"
				action="/admin"
				onSubmit={event => {
					event.preventDefault();
					clearTimeout(timer.current);
					set({ q: text.trim() || undefined });
				}}
			>
				{params.stato && <input type="hidden" name="stato" value={params.stato} />}
				<label htmlFor="admin-search" className="sr-only">
					Cerca per nome, marca o EAN
				</label>
				<div className="bg-ground-raised focus-within:ring-text flex min-h-12 items-center gap-2 rounded-full pr-0.5 pl-4 focus-within:ring-2">
					<SearchIcon className="text-text-soft size-5 shrink-0" />
					<input
						id="admin-search"
						type="search"
						name="q"
						value={text}
						onChange={event => type(event.target.value)}
						placeholder="Nome, marca o EAN"
						autoComplete="off"
						className="text-body placeholder:text-text-soft min-h-12 w-full bg-transparent outline-none [&::-webkit-search-cancel-button]:hidden"
					/>
					{text && (
						<button
							type="button"
							onClick={() => {
								clearTimeout(timer.current);
								setText("");
								set({ q: undefined });
							}}
							className="hover:bg-text/10 grid size-11 shrink-0 place-items-center rounded-full"
						>
							<CloseIcon className="size-5" />
							<span className="sr-only">Svuota la ricerca</span>
						</button>
					)}
				</div>
			</form>

			<div className="grid grid-cols-2 items-center gap-2 sm:flex sm:flex-wrap">
				<label className="sr-only" htmlFor="admin-tipo">
					Tipo
				</label>
				<select
					id="admin-tipo"
					value={params.tipo ?? ""}
					onChange={event => set({ tipo: event.target.value || undefined })}
					data-on={Boolean(params.tipo)}
					className={select}
				>
					<option value="">Ogni tipo</option>
					{subtypes.map(({ value, count }) => (
						<option key={value} value={value}>
							{value === NO_SUBTYPE ? "Senza tipo" : subtypeLabel(value)} ({count})
						</option>
					))}
				</select>

				{(Object.keys(YES_NO) as (keyof typeof YES_NO)[]).map(key => {
					const [label, yes, no] = YES_NO[key];
					return (
						<span key={key}>
							<label className="sr-only" htmlFor={`admin-${key}`}>
								{label}
							</label>
							<select
								id={`admin-${key}`}
								value={params[key] ?? ""}
								onChange={event =>
									set({ [key]: (event.target.value || undefined) as "si" | "no" })
								}
								data-on={Boolean(params[key])}
								className={select}
							>
								<option value="">{label}</option>
								<option value="si">{yes}</option>
								<option value="no">{no}</option>
							</select>
						</span>
					);
				})}

				<label className="sr-only" htmlFor="admin-ordine">
					Ordine
				</label>
				<select
					id="admin-ordine"
					value={params.ordine ?? ""}
					onChange={event =>
						set({
							ordine: (event.target.value || undefined) as AdminListParams["ordine"],
						})
					}
					className={cn(select, "col-span-2")}
				>
					{SORTS.map(([value, label]) => (
						<option key={value} value={value}>
							{label}
						</option>
					))}
				</select>

				{filtered && (
					<Link
						to="/admin"
						search={{ stato: params.stato }}
						className="text-body col-span-2 inline-flex min-h-11 items-center gap-1 justify-self-start px-2 font-medium underline"
					>
						<CloseIcon className="size-4" />
						Togli tutti i filtri
					</Link>
				)}
			</div>
		</div>
	);
}
