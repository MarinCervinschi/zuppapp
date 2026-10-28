import { useQuery } from "@tanstack/react-query";
import { Link, createFileRoute, redirect } from "@tanstack/react-router";

import { TasteTile } from "@/components/catalog/taste-tile";
import { buttonClass } from "@/components/ds/button";
import { PageHead } from "@/components/ds/page-head";
import { favoriteQueries } from "@/lib/favorites/queries";
import { favoritesPageSchema } from "@/lib/favorites/schemas";
import { ZUPPE, count } from "@/lib/plural";
import { userQueries } from "@/lib/user/queries";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/preferiti")({
	// Favourites live in an account: without one, sign in and come back to the profile.
	beforeLoad: async ({ context }) => {
		const { viewer } = await context.queryClient.ensureQueryData(userQueries.viewer());
		if (!viewer || viewer.isAnonymous) throw redirect({ to: "/accedi" });
	},
	validateSearch: favoritesPageSchema,
	loaderDeps: ({ search }) => search,
	loader: ({ context, deps }) =>
		context.queryClient.ensureQueryData(favoriteQueries.page(deps.pagina ?? 1)),
	head: () => ({ meta: [{ title: "Preferiti · Zuppapp" }] }),
	component: Favorites,
});

function Favorites() {
	const { pagina } = Route.useSearch();
	const page = pagina ?? 1;
	const { data, isPlaceholderData } = useQuery(favoriteQueries.page(page));

	return (
		<>
			<PageHead blob="beet" title="Preferiti">
				{data && data.total > 0 && (
					<p>{count(data.total, ZUPPE)} con il cuore, dall’ultima che hai scelto.</p>
				)}
			</PageHead>

			<main className="mx-auto flex max-w-6xl flex-col gap-8 px-4">
				{!data || data.total === 0 ? (
					<div className="bg-ground-raised rounded-card mx-auto flex max-w-xl flex-col items-start gap-3 p-6">
						<p className="text-body font-semibold">Ancora nessun preferito.</p>
						<p className="text-body">
							Tocca il cuore su una zuppa, nella sua scheda o sulla foto in elenco, e la
							ritrovi qui.
						</p>
						<Link to="/" className={buttonClass("ink")}>
							Sfoglia le zuppe
						</Link>
					</div>
				) : (
					<ul
						className={cn(
							"stagger grid grid-cols-1 gap-x-4 gap-y-10 sm:grid-cols-2 md:grid-cols-3 md:gap-x-5",
							isPlaceholderData && "opacity-60"
						)}
					>
						{data.items.map(product => (
							<li key={product.id}>
								<TasteTile product={product} />
							</li>
						))}
					</ul>
				)}

				{data && data.pageCount > 1 && (
					<nav
						aria-label="Pagine dei preferiti"
						className="flex items-center justify-between gap-3"
					>
						{page > 1 ? (
							<Link
								to="/preferiti"
								search={{ pagina: page - 1 === 1 ? undefined : page - 1 }}
								className="text-body min-h-11 content-center font-medium underline"
							>
								‹ Indietro
							</Link>
						) : (
							<span />
						)}
						<p className="text-small text-text-soft tabular-nums">
							Pagina {page} di {data.pageCount}
						</p>
						{page < data.pageCount ? (
							<Link
								to="/preferiti"
								search={{ pagina: page + 1 }}
								className="text-body min-h-11 content-center font-medium underline"
							>
								Avanti ›
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
