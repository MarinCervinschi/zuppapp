import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { BackButton } from "@/components/ds/app-bar";
import { Barcode } from "@/components/ds/barcode";
import { NutriScore } from "@/components/ds/nutri-score";
import { NutritionLabel } from "@/components/ds/nutrition-label";
import { Pill } from "@/components/ds/pill";
import { StarDistribution } from "@/components/ds/star-distribution";
import { RatingBadge } from "@/components/ds/stars";
import { ZoomablePhoto } from "@/components/ds/zoomable-photo";
import { NotFoundPage } from "@/components/error/error-pages";
import { VotePanel, useVote } from "@/components/product/vote-panel";
import { productDetails } from "@/lib/catalog/details";
import { catalogQueries } from "@/lib/catalog/queries";
import { ALLERGEN_FILTERS } from "@/lib/catalog/schemas";
import type { ProductCard } from "@/lib/catalog/types";
import { VOTI, count } from "@/lib/plural";

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

function registeredNote(n: number) {
	if (n === 0) return "Nessuno da persone con un account.";
	if (n === 1) return "1 da una persona con un account.";
	return `${n} da persone con un account.`;
}

function ProductPage() {
	const { ean } = Route.useParams();
	const { data: product } = useSuspenseQuery(catalogQueries.card(ean));
	return <ProductView key={product.id} product={product} />;
}

const section = "flex flex-col gap-4";
const heading = "font-display text-lead font-medium";

function ProductView({ product }: { product: ProductCard }) {
	const vote = useVote(product);
	const { stats } = product;
	// «Senza» only when the label was read: no ingredients means no allergen data, not none.
	const free = product.ingredientsText
		? ALLERGEN_FILTERS.filter(allergen => !product.allergens.includes(allergen))
		: [];

	return (
		<main className="mx-auto max-w-xl">
			{/* The pack, full width on its white plate; the way back floats over its corner. */}
			<div className="plate relative flex h-80 items-center justify-center bg-white px-4 pt-4 pb-10 sm:h-96">
				<BackButton className="absolute top-4 left-4 z-20" />
				{product.imageUrl ? (
					<ZoomablePhoto
						src={product.imageUrl}
						name={product.name}
						size="shelf"
						thumb={400}
						className="flex h-full items-center justify-center"
						imageClassName="h-full max-h-full max-w-full"
					/>
				) : (
					<span className="font-display text-lead text-[#6a5f53]">Senza foto</span>
				)}
			</div>

			{/* The sheet over the photo: warm yellow at the top, fading into the paper. */}
			<div className="sheet-tint relative -mt-8 flex flex-col gap-10 rounded-t-[2rem] px-4 pt-7">
				<header className="flex flex-col gap-3">
					<h1 className="font-display text-title font-semibold tracking-[-0.01em]">
						{product.name}
					</h1>
					<p className="text-body text-text-soft">{productDetails(product)}</p>
					<p className="flex flex-wrap items-center gap-2">
						<RatingBadge mean={stats.mean} votesCount={stats.votesCount} />
						{stats.votesCount > 0 && (
							<span aria-hidden className="text-body text-text-soft tabular-nums">
								({count(stats.votesCount, VOTI)})
							</span>
						)}
						{stats.rank && (
							<span className="text-body text-text-soft">
								· {stats.rank}° in classifica
							</span>
						)}
					</p>
				</header>

				{product.archived && (
					<p className="bg-ground-raised text-body rounded-card p-4">
						Fuori produzione: resta qui con i suoi voti, ma non è in classifica.
					</p>
				)}
				{product.recipeChangedAt && (
					<p className="bg-field text-body text-on-field rounded-card p-4">
						Ricetta cambiata il {date.format(new Date(product.recipeChangedAt))}: i voti
						di prima riguardano la versione vecchia.
					</p>
				)}

				<VotePanel product={product} vote={vote} />

				<section aria-labelledby="votes-heading" className={section}>
					<h2 id="votes-heading" className={heading}>
						Come l’hanno votata
					</h2>
					{stats.votesCount === 0 ? (
						<p className="text-body">Ancora nessun voto. Il primo lo dai tu.</p>
					) : (
						<>
							<StarDistribution counts={stats.scoreCounts} />
							<p className="text-small text-text-soft">
								{registeredNote(stats.votesRegistered)}
							</p>
						</>
					)}
					{stats.tags.length > 0 && (
						<ul aria-label="Cosa ne dicono" className="flex flex-wrap gap-2">
							{/* Reasons in favour first, then against, then how it is: the picker's order. */}
							{[...stats.tags]
								.sort(
									(a, b) =>
										TAG_ORDER[a.sentiment] - TAG_ORDER[b.sentiment] || b.count - a.count
								)
								.slice(0, 6)
								.map(tag => (
									<li key={tag.id}>
										<Pill>
											<span aria-hidden className="font-semibold">
												{TAG_SIGN[tag.sentiment]}
											</span>
											<span className="sr-only">{TAG_WORD[tag.sentiment]}: </span>
											{tag.label}
											<span className="text-text-soft tabular-nums">
												{tag.percent}%
											</span>
										</Pill>
									</li>
								))}
						</ul>
					)}
				</section>

				{free.length > 0 && (
					<section aria-labelledby="free-heading" className={section}>
						<h2 id="free-heading" className={heading}>
							Senza:
						</h2>
						<ul className="flex flex-wrap gap-2">
							{free.map(allergen => (
								<li key={allergen}>
									<Pill>{allergen.charAt(0).toUpperCase() + allergen.slice(1)}</Pill>
								</li>
							))}
						</ul>
						<p className="text-small text-text-soft">
							Secondo gli allergeni dichiarati. Leggi sempre l’etichetta.
						</p>
					</section>
				)}

				{product.ingredientsText && (
					<section aria-labelledby="ingredients-heading" className={section}>
						<h2 id="ingredients-heading" className={heading}>
							Ingredienti
						</h2>
						<p className="text-body">{product.ingredientsText}</p>
						{product.allergens.length > 0 && (
							<p className="text-body">
								<span className="font-medium">Allergeni: </span>
								{product.allergens.join(", ")}
							</p>
						)}
					</section>
				)}

				{product.nutrition && <NutritionLabel nutrition={product.nutrition} />}

				{product.nutriscore && (
					<NutriScore grade={product.nutriscore} className="self-center" />
				)}

				<section aria-label="Altre informazioni" className="flex flex-col gap-5">
					{product.nova && (
						<p className="text-body">
							Gruppo NOVA <span className="font-semibold">{product.nova}</span>
							<span className="text-text-soft"> (quanto è lavorata, da 1 a 4)</span>
						</p>
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
			</div>
		</main>
	);
}
