import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, notFound } from "@tanstack/react-router";

import { DetailBar } from "@/components/ds/app-bar";
import { HeartButton } from "@/components/ds/heart-button";
import { ZoomablePhoto } from "@/components/ds/zoomable-photo";
import { NotFoundPage } from "@/components/error/error-pages";
import { AdminShortcut } from "@/components/product/admin-shortcut";
import { RankLine, SoupSections, SoupWarnings } from "@/components/product/soup-detail";
import { VotePanel, useVote } from "@/components/product/vote-panel";
import { productDetails } from "@/lib/catalog/details";
import { sizedImage } from "@/lib/catalog/image";
import { catalogQueries } from "@/lib/catalog/queries";
import type { ProductCard } from "@/lib/catalog/types";
import { productDescription, productJsonLd, scriptJson } from "@/lib/seo/product";
import { seoQueries } from "@/lib/seo/queries";

export const Route = createFileRoute("/prodotti/$ean")({
	loader: async ({ context, params }) => {
		// A malformed code is a page that doesn't exist, not a failure.
		if (!/^\d{8,14}$/.test(params.ean)) throw notFound();
		// fetchQuery, not ensureQueryData: a card made stale by a vote elsewhere is fetched again
		// before the page shows, so the vote panel never starts from the old vote.
		const [product, site] = await Promise.all([
			context.queryClient.fetchQuery(catalogQueries.card(params.ean)),
			context.queryClient.ensureQueryData(seoQueries.siteUrl()),
		]);
		// What the head needs, worked out here so the whole card isn't sent twice.
		const url = site ? `${site}/prodotti/${product.ean}` : null;
		const image = sizedImage(product.imageUrl, "full");
		return {
			title: product.brand ? `${product.name} · ${product.brand}` : product.name,
			description: productDescription(product),
			url,
			image,
			jsonLd: url ? scriptJson(productJsonLd(product, url, image)) : null,
		};
	},
	head: ({ loaderData }) => {
		if (!loaderData) return {};
		const { title, description, url, image, jsonLd } = loaderData;
		return {
			meta: [
				{ title: `${title} · Zuppapp` },
				{ name: "description", content: description },
				{ property: "og:type", content: "product" },
				{ property: "og:title", content: title },
				{ property: "og:description", content: description },
				...(url ? [{ property: "og:url", content: url }] : []),
				...(image
					? [
							{ property: "og:image", content: image },
							{ name: "twitter:card", content: "summary_large_image" },
						]
					: []),
			],
			scripts: jsonLd ? [{ type: "application/ld+json", children: jsonLd }] : [],
		};
	},
	component: ProductPage,
	notFoundComponent: NotFoundPage,
});

function ProductPage() {
	const { ean } = Route.useParams();
	const { data: product } = useSuspenseQuery(catalogQueries.card(ean));
	return <ProductView key={product.id} product={product} />;
}

function ProductView({ product }: { product: ProductCard }) {
	const vote = useVote(product);

	return (
		// Phone: the photo full width and the page rising over it. Desktop (≥ 1024 px): two columns,
		// the pack held still on the left while everything else scrolls on the right.
		<main className="mx-auto max-w-xl lg:grid lg:max-w-6xl lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:items-start lg:gap-12 lg:px-6 lg:pt-24">
			<DetailBar
				action={
					<div className="flex items-center gap-2">
						<AdminShortcut product={product} />
						<HeartButton productId={product.id} name={product.name} size="lg" />
					</div>
				}
			/>
			{/* The pack, full width on its white plate, under the fixed bar. */}
			<div className="plate rounded-card relative flex h-80 items-center justify-center bg-white px-4 pt-4 pb-10 max-lg:rounded-none sm:h-96 lg:sticky lg:top-24 lg:h-[min(34rem,calc(100dvh-8rem))] lg:p-8">
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

			{/* Over the photo, warm yellow at the top fading into the paper, like the soup's sheet; no
			    handle, since a page opened from a search or a scan has nothing to be dragged back to. */}
			<div className="sheet-tint stagger relative -mt-8 flex flex-col gap-10 rounded-t-[2rem] px-4 pt-8 lg:mt-0 lg:rounded-[2rem] lg:px-8">
				<header className="flex flex-col gap-3">
					<h1 className="font-display text-title lg:text-display font-semibold tracking-[-0.01em]">
						{product.name}
					</h1>
					<p className="text-body text-text-soft">{productDetails(product)}</p>
					<RankLine product={product} large />
				</header>

				<SoupWarnings product={product} />

				<VotePanel product={product} vote={vote} />

				<SoupSections product={product} />
			</div>
		</main>
	);
}
