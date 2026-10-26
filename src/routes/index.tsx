import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { BowlFace } from "@/components/brand/bowl-face";
import { ShelfLabel } from "@/components/ds/shelf-label";
import { catalogQueries } from "@/lib/catalog/queries";
import { SCORES } from "@/lib/ranking/rules";

export const Route = createFileRoute("/")({
	loader: ({ context }) => context.queryClient.ensureQueryData(catalogQueries.list()),
	component: Home,
});

// A plain shelf until the ranking lands: every product's label, so every card is reachable.
function Home() {
	const { data: products } = useSuspenseQuery(catalogQueries.list());

	return (
		<>
			<header className="bg-field text-on-field">
				<div className="mx-auto grid max-w-5xl gap-4 px-4 pt-8 pb-6 md:grid-cols-[1fr_auto] md:items-end md:gap-x-12 md:pt-12 md:pb-10">
					<h1 className="font-condensed text-[clamp(4.5rem,22vw,8rem)] leading-[0.82] font-black tracking-[-0.03em] uppercase">
						Zuppapp
					</h1>
					<p className="text-lead max-w-[32ch] font-semibold md:col-start-1">
						Quale zuppa pronta è la più buona? Assaggia, poi vota con una faccia.
					</p>
					{/* On a wide screen the four bowls stand beside the name, two by two. */}
					<p
						aria-hidden
						className="text-bowl-ink flex gap-2 md:col-start-2 md:row-span-2 md:row-start-1 md:grid md:grid-cols-2 md:gap-3"
					>
						{SCORES.map(score => (
							<BowlFace key={score} score={score} className="size-10 md:size-20" />
						))}
					</p>
				</div>
			</header>
			<main className="mx-auto flex max-w-5xl flex-col gap-4 px-4 py-8 md:py-12">
				<h2 className="font-condensed text-lead font-extrabold uppercase">
					Sullo scaffale
				</h2>
				{products.length === 0 ? (
					<p className="text-body">Lo scaffale è vuoto, per ora. Torna presto.</p>
				) : (
					<ul className="grid gap-3 md:grid-cols-2 md:gap-4">
						{products.map(product => (
							<li key={product.id}>
								<ShelfLabel product={product} />
							</li>
						))}
					</ul>
				)}
			</main>
		</>
	);
}
