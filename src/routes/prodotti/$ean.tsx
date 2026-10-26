import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { AppBar } from "@/components/ds/app-bar";
import { Barcode } from "@/components/ds/barcode";
import { NutritionLabel } from "@/components/ds/nutrition-label";
import { Receipt, ReceiptRow, ReceiptTotal } from "@/components/ds/receipt";
import { ShelfLabel } from "@/components/ds/shelf-label";
import { Stamp } from "@/components/ds/stamp";
import { VoteDistribution } from "@/components/ds/vote-distribution";
import { ZoomablePhoto } from "@/components/ds/zoomable-photo";
import { NotFoundPage } from "@/components/error/error-pages";
import { VotePanel, useVote } from "@/components/product/vote-panel";
import { catalogQueries } from "@/lib/catalog/queries";
import type { ProductCard } from "@/lib/catalog/types";
import { SCORE_LABELS } from "@/lib/ranking/rules";

export const Route = createFileRoute("/prodotti/$ean")({
	loader: async ({ context, params }) => {
		const product = await context.queryClient.ensureQueryData(
			catalogQueries.card(params.ean)
		);
		return {
			title: product.brand ? `${product.name} · ${product.brand}` : product.name,
		};
	},
	head: ({ loaderData }) => ({
		meta: loaderData ? [{ title: `${loaderData.title} · Zuppapp` }] : [],
	}),
	component: ProductPage,
	notFoundComponent: NotFoundPage,
});

const date = new Intl.DateTimeFormat("it-IT", { dateStyle: "long" });

const TAG_ORDER = { positive: 0, negative: 1, neutral: 2 } as const;
const TAG_SIGN = { positive: "+", negative: "−", neutral: "·" } as const;
const TAG_WORD = { positive: "pro", negative: "contro", neutral: "com’è" } as const;

function registeredNote(count: number) {
	if (count === 0) return "Nessuno da persone con un account";
	if (count === 1) return "1 da una persona con un account";
	return `${count} da persone con un account`;
}

function ProductPage() {
	const { ean } = Route.useParams();
	const { data: product } = useSuspenseQuery(catalogQueries.card(ean));
	return <ProductView key={product.id} product={product} />;
}

function ProductView({ product }: { product: ProductCard }) {
	const vote = useVote(product);
	const { stats } = product;

	return (
		<>
			<AppBar back />
			<main className="mx-auto flex max-w-xl flex-col gap-10 px-4 pt-4 pb-16">
				<div className="flex flex-col">
					{/* The pack standing on the shelf, its label clipped to the edge below. */}
					<ZoomablePhoto
						src={product.imageUrl}
						name={product.name}
						size="shelf"
						thumb={400}
						className="self-center"
					/>
					<ShelfLabel
						as="static"
						product={{
							...product,
							votesCount: stats.votesCount,
							rebuyPercent: stats.rebuyPercent,
							scoreCounts: stats.scoreCounts,
							rank: stats.rank,
						}}
						stamp={
							vote.score && (
								<Stamp key={vote.stampKey} pressed={vote.stampKey > 0}>
									{SCORE_LABELS[vote.score].label}
								</Stamp>
							)
						}
					/>
				</div>

				{product.archived && (
					<p className="bg-ground-raised text-body p-4">
						Fuori produzione: resta qui con i suoi voti, ma non è in classifica.
					</p>
				)}
				{product.recipeChangedAt && (
					<p className="bg-field text-body text-on-field p-4">
						Ricetta cambiata il {date.format(new Date(product.recipeChangedAt))}: i voti
						di prima riguardano la versione vecchia.
					</p>
				)}

				<VotePanel product={product} vote={vote} />

				<Receipt title="Lo scontrino dei voti">
					{stats.votesCount === 0 ? (
						<p className="text-body">
							Ancora nessun voto. Il primo scontrino lo stampi tu.
						</p>
					) : (
						<VoteDistribution counts={stats.scoreCounts} />
					)}
					{stats.tags.length > 0 && (
						<div className="mt-3 flex flex-col gap-2">
							{/* Reasons in favour first, then against, then how it is: the same order as the picker. */}
							{[...stats.tags]
								.sort(
									(a, b) =>
										TAG_ORDER[a.sentiment] - TAG_ORDER[b.sentiment] || b.count - a.count
								)
								.slice(0, 6)
								.map(tag => (
									<ReceiptRow
										key={tag.id}
										label={
											<span>
												<span
													aria-hidden
													className={
														tag.sentiment === "positive"
															? "text-accent font-black"
															: "font-black"
													}
												>
													{TAG_SIGN[tag.sentiment]}
												</span>{" "}
												<span className="sr-only">{TAG_WORD[tag.sentiment]}: </span>
												{tag.label}
											</span>
										}
										value={`${tag.percent}%`}
									/>
								))}
						</div>
					)}
					<ReceiptTotal label="Totale voti" value={stats.votesCount} />
					<p className="text-small text-text-soft mt-2">
						{registeredNote(stats.votesRegistered)}
					</p>
				</Receipt>

				<section aria-labelledby="label-heading" className="flex flex-col gap-6">
					<h2
						id="label-heading"
						className="font-condensed text-lead font-extrabold uppercase"
					>
						Cosa c’è dentro
					</h2>
					{product.ingredientsText && (
						<p className="text-body">
							<span className="font-semibold">Ingredienti: </span>
							{product.ingredientsText}
						</p>
					)}
					{product.allergens.length > 0 && (
						<p className="text-body">
							<span className="font-semibold">Allergeni: </span>
							{product.allergens.join(", ")}
						</p>
					)}
					{product.nutrition && <NutritionLabel nutrition={product.nutrition} />}
					{(product.nutriscore || product.nova) && (
						<dl className="text-body flex gap-6">
							{product.nutriscore && (
								<div className="flex gap-2">
									<dt>Nutri-Score</dt>
									<dd className="font-black uppercase">{product.nutriscore}</dd>
								</div>
							)}
							{product.nova && (
								<div className="flex gap-2">
									<dt>NOVA</dt>
									<dd className="font-black">{product.nova}</dd>
								</div>
							)}
						</dl>
					)}
					{(product.producerUrl || product.retailers.length > 0) && (
						<ul className="text-body flex flex-wrap gap-x-6 gap-y-2">
							{product.producerUrl && (
								<li>
									<a
										href={product.producerUrl}
										target="_blank"
										rel="noopener noreferrer"
										className="underline"
									>
										Sito del produttore
									</a>
								</li>
							)}
							{product.retailers.map(link => (
								<li key={link.retailer}>
									<a
										href={link.url}
										target="_blank"
										rel="noopener noreferrer"
										className="underline"
									>
										Su {link.retailer}
									</a>
								</li>
							))}
						</ul>
					)}
					{/* For a scanner and for whoever looks for this exact pack: last, small. */}
					<Barcode ean={product.ean} />
					<p className="text-small text-text-soft">
						Dati da{" "}
						<a
							href={`https://world.openfoodfacts.org/product/${product.ean}`}
							target="_blank"
							rel="noopener noreferrer"
							className="underline"
						>
							Open Food Facts
						</a>
						, licenza ODbL.
					</p>
				</section>
			</main>
		</>
	);
}
