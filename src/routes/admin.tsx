import { useState } from "react";

import { useQuery } from "@tanstack/react-query";
import { Link, createFileRoute, notFound } from "@tanstack/react-router";

import { ProductRow } from "@/components/admin/product-row";
import { Button } from "@/components/ds/button";
import { NotFoundPage } from "@/components/error/error-pages";
import { isAdminFn } from "@/lib/admin/api";
import { useSetProductsStatus } from "@/lib/admin/mutations";
import { adminQueries } from "@/lib/admin/queries";
import { adminListSchema } from "@/lib/admin/schemas";
import { PRODOTTI, SELEZIONATI, count } from "@/lib/plural";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin")({
	validateSearch: adminListSchema,
	// To anyone but an admin this page does not exist; the server functions check again.
	beforeLoad: async () => {
		if (!(await isAdminFn())) throw notFound();
	},
	loaderDeps: ({ search }) => search,
	loader: ({ context, deps }) =>
		context.queryClient.ensureQueryData(adminQueries.list(deps)),
	head: () => ({ meta: [{ title: "Gestione prodotti · Zuppapp" }] }),
	notFoundComponent: NotFoundPage,
	component: AdminPage,
});

const TABS = [
	["draft", "Bozze"],
	["published", "Pubblicati"],
	["archived", "Archiviati"],
] as const;

// What can be done to a selection, by the tab it was made in. The first is the one to do.
const ACTIONS = {
	draft: [
		["published", "Pubblica"],
		["archived", "Archivia"],
	],
	published: [
		["archived", "Archivia"],
		["draft", "Rimetti in bozza"],
	],
	archived: [
		["published", "Ripubblica"],
		["draft", "Rimetti in bozza"],
	],
} as const;

// What each tab means when it is empty, and where its products come from.
const EMPTY = {
	draft:
		"Nessuna bozza da approvare. I prodotti nuovi arrivano con l’import da Open Food Facts.",
	published: "Nessun prodotto pubblicato. Approva le bozze per metterle in classifica.",
	archived: "Nessun prodotto archiviato.",
} as const;

const tab =
	"text-body inline-flex min-h-11 items-center gap-2 rounded-full px-4 font-medium no-underline";

function AdminPage() {
	const params = Route.useSearch();
	const { data: page, isFetching } = useQuery(adminQueries.list(params));
	const setStatus = useSetProductsStatus();
	const [selected, setSelected] = useState<Set<string>>(new Set());

	if (!page) return null;
	const ids = page.items.map(item => item.id);
	const chosen = ids.filter(id => selected.has(id));
	const allChosen = ids.length > 0 && chosen.length === ids.length;

	function select(id: string, on: boolean) {
		setSelected(current => {
			const next = new Set(current);
			if (on) next.add(id);
			else next.delete(id);
			return next;
		});
	}

	return (
		<>
			<main className="mx-auto flex max-w-3xl flex-col gap-6 px-4 pt-14">
				<h1 className="font-display text-display font-semibold">Gestione prodotti</h1>

				<nav aria-label="Stato dei prodotti">
					<ul className="flex flex-wrap gap-2">
						{TABS.map(([status, label]) => {
							const active = page.status === status;
							return (
								<li key={status}>
									<Link
										to="/admin"
										search={{ stato: status === "draft" ? undefined : status }}
										aria-current={active ? "page" : undefined}
										onClick={() => setSelected(new Set())}
										className={cn(
											tab,
											active
												? "bg-text text-ground"
												: "bg-ground-raised hover:bg-text/10"
										)}
									>
										{label}
										<span
											className={cn(
												"text-small tabular-nums",
												active ? "text-ground/80" : "text-text-soft"
											)}
										>
											{page.counts[status]}
										</span>
									</Link>
								</li>
							);
						})}
					</ul>
				</nav>

				{/* A plain GET form: the search is in the URL like everything else. */}
				<form
					role="search"
					method="get"
					action="/admin"
					className="flex flex-col gap-2"
				>
					{params.stato && <input type="hidden" name="stato" value={params.stato} />}
					<label htmlFor="admin-search" className="text-body font-semibold">
						Cerca tra questi prodotti
					</label>
					<div className="flex gap-2">
						<input
							id="admin-search"
							type="search"
							name="q"
							defaultValue={params.q ?? ""}
							className="bg-ground-raised text-body min-h-12 w-full rounded-full px-5"
						/>
						<Button type="submit">Cerca</Button>
					</div>
				</form>

				<div className="bg-ground-raised rounded-panel sticky top-2 z-10 flex flex-wrap items-center gap-3 p-3">
					<label className="text-body flex min-h-11 items-center gap-2 font-semibold">
						<input
							type="checkbox"
							checked={allChosen}
							onChange={event =>
								setSelected(event.target.checked ? new Set(ids) : new Set())
							}
							className="accent-text size-6"
						/>
						Tutti in questa pagina
					</label>
					<span className="text-body tabular-nums" aria-live="polite">
						{count(chosen.length, SELEZIONATI)}
					</span>
					<span className="flex flex-wrap gap-2 sm:ml-auto">
						{ACTIONS[page.status].map(([status, label], index) => (
							<Button
								key={status}
								variant={index === 0 ? "ink" : "paper"}
								disabled={chosen.length === 0 || setStatus.isPending}
								onClick={() =>
									setStatus.mutate(
										{ ids: chosen, status, from: page.status },
										{ onSuccess: () => setSelected(new Set()) }
									)
								}
							>
								{label}
							</Button>
						))}
					</span>
				</div>

				<p className="text-body">
					{count(page.total, PRODOTTI)}
					{page.status === "draft" && page.total > 0 && ", prima quelli senza tipo"}
				</p>

				{page.items.length === 0 ? (
					<p className="text-body">
						{params.q
							? `Nessun prodotto per «${params.q}» in questa scheda. Prova nelle altre o cambia parola.`
							: EMPTY[page.status]}
					</p>
				) : (
					<ul className={cn("flex flex-col gap-3", isFetching && "opacity-60")}>
						{page.items.map(product => (
							<ProductRow
								key={product.id}
								product={product}
								selected={selected.has(product.id)}
								onSelect={on => select(product.id, on)}
							/>
						))}
					</ul>
				)}

				{page.pageCount > 1 && (
					<nav aria-label="Pagine" className="flex items-center justify-between gap-3">
						{page.page > 1 ? (
							<Link
								to="/admin"
								search={{ ...params, pagina: page.page - 1 }}
								className="text-body min-h-11 content-center underline"
							>
								Precedente
							</Link>
						) : (
							<span />
						)}
						<p className="text-body tabular-nums">
							Pagina {page.page} di {page.pageCount}
						</p>
						{page.page < page.pageCount ? (
							<Link
								to="/admin"
								search={{ ...params, pagina: page.page + 1 }}
								className="text-body min-h-11 content-center underline"
							>
								Successiva
							</Link>
						) : (
							<span />
						)}
					</nav>
				)}
			</main>
		</>
	);
}
