import { useState } from "react";

import { useQuery } from "@tanstack/react-query";
import { Link, createFileRoute, notFound } from "@tanstack/react-router";

import { AdminFilters } from "@/components/admin/admin-filters";
import { AdminHeader } from "@/components/admin/admin-tabs";
import { ACTIONS, AdminProductSheet, ProductRow } from "@/components/admin/product-row";
import { CloseIcon } from "@/components/ds/icons";
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

// What each tab means when it is empty, and where its products come from.
const EMPTY = {
	draft:
		"Nessuna bozza da approvare. I prodotti nuovi arrivano con l’import da Open Food Facts.",
	published: "Nessun prodotto pubblicato. Approva le bozze per metterle in classifica.",
	archived: "Nessun prodotto archiviato.",
} as const;

function AdminPage() {
	const params = Route.useSearch();
	const { data: page, isFetching } = useQuery(adminQueries.list(params));
	const setStatus = useSetProductsStatus();
	const [selected, setSelected] = useState<Set<string>>(new Set());
	const [openId, setOpenId] = useState<string | null>(null);

	if (!page) return null;
	const filtered = Boolean(
		params.tipo || params.foto || params.voti || params.corretti
	);
	const ids = page.items.map(item => item.id);
	const chosen = ids.filter(id => selected.has(id));
	const allChosen = ids.length > 0 && chosen.length === ids.length;
	const open = page.items.find(item => item.id === openId);

	function select(id: string, on: boolean) {
		setSelected(current => {
			const next = new Set(current);
			if (on) next.add(id);
			else next.delete(id);
			return next;
		});
	}

	return (
		<main
			className={cn(
				"mx-auto flex max-w-3xl flex-col gap-6 px-4 pt-[max(2.5rem,env(safe-area-inset-top))]",
				// Room for the floating bar, so it never covers the last row or the pages.
				chosen.length > 0 && "pb-24"
			)}
		>
			<AdminHeader
				counts={page.counts}
				current={page.status}
				q={params.q}
				onChange={() => setSelected(new Set())}
			/>

			<AdminFilters params={params} subtypes={page.subtypes} />

			<div className="flex flex-wrap items-center justify-between gap-2">
				<p className="text-body" role="status">
					{count(page.total, PRODOTTI)}
					{page.status === "draft" &&
						page.total > 0 &&
						!params.ordine &&
						", prima quelli senza tipo"}
				</p>
				{ids.length > 0 && (
					<button
						type="button"
						onClick={() => setSelected(allChosen ? new Set() : new Set(ids))}
						className="text-body min-h-11 px-2 font-medium underline"
					>
						{allChosen ? "Deseleziona tutti" : "Seleziona tutti"}
					</button>
				)}
			</div>

			{page.items.length === 0 ? (
				<p className="bg-ground-raised text-body rounded-card p-6">
					{params.q
						? `Nessun prodotto per «${params.q}» in questa scheda. Prova nelle altre o cambia parola.`
						: filtered
							? "Nessun prodotto con questi filtri in questa scheda."
							: EMPTY[page.status]}
				</p>
			) : (
				<ul className={cn("stagger flex flex-col gap-2", isFetching && "opacity-60")}>
					{page.items.map(product => (
						<ProductRow
							key={product.id}
							product={product}
							selected={selected.has(product.id)}
							onSelect={on => select(product.id, on)}
							onOpen={() => setOpenId(product.id)}
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
							className="text-body min-h-11 content-center font-medium underline"
						>
							‹ Precedente
						</Link>
					) : (
						<span />
					)}
					<p className="text-small text-text-soft tabular-nums">
						Pagina {page.page} di {page.pageCount}
					</p>
					{page.page < page.pageCount ? (
						<Link
							to="/admin"
							search={{ ...params, pagina: page.page + 1 }}
							className="text-body min-h-11 content-center font-medium underline"
						>
							Successiva ›
						</Link>
					) : (
						<span />
					)}
				</nav>
			)}

			{/* The actions on many at once float above the tab bar, only while something is chosen. */}
			{chosen.length > 0 && (
				<div
					role="region"
					aria-label="Azioni sui selezionati"
					className="bg-ink text-on-ink overlay-shadow motion-safe:animate-rise fixed inset-x-3 bottom-[calc(6.5rem+env(safe-area-inset-bottom))] z-30 mx-auto flex max-w-2xl items-center gap-2 rounded-full p-2 pl-4"
				>
					<span
						className="text-body font-semibold whitespace-nowrap tabular-nums"
						aria-live="polite"
					>
						{count(chosen.length, SELEZIONATI)}
					</span>
					<span className="ml-auto flex gap-1.5">
						{ACTIONS[page.status].map(([status, label, Icon], index) => (
							<button
								key={status}
								type="button"
								disabled={setStatus.isPending}
								onClick={() =>
									setStatus.mutate(
										{ ids: chosen, status, from: page.status },
										{ onSuccess: () => setSelected(new Set()) }
									)
								}
								className={cn(
									"text-body inline-flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-full px-4 font-medium transition-[scale,background-color] duration-150 disabled:opacity-50 motion-safe:active:scale-[0.96] max-sm:px-3",
									index === 0
										? "bg-star hover:bg-star/85 text-[#16120f]"
										: "bg-on-ink/10 hover:bg-on-ink/20"
								)}
							>
								<Icon className="size-5" />
								{/* On a phone the bar keeps to one line: the second action shows its icon (below 360 px the first
								    too), its name stays for screen readers. */}
								<span
									className={index === 0 ? "max-[359px]:sr-only" : "max-sm:sr-only"}
								>
									{label}
								</span>
							</button>
						))}
						<button
							type="button"
							onClick={() => setSelected(new Set())}
							className="bg-on-ink/10 hover:bg-on-ink/20 grid size-11 place-items-center rounded-full"
						>
							<CloseIcon className="size-5" />
							<span className="sr-only">Annulla la selezione</span>
						</button>
					</span>
				</div>
			)}

			{open && (
				<AdminProductSheet
					key={open.id}
					product={open}
					onClosed={() => setOpenId(null)}
				/>
			)}
		</main>
	);
}
