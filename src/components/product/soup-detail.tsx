import { useId } from "react";

import { AllergenIcon } from "@/components/catalog/allergen-icons";
import { Barcode } from "@/components/ds/barcode";
import { ExternalIcon } from "@/components/ds/icons";
import { NutriScore } from "@/components/ds/nutri-score";
import { NutritionLabel } from "@/components/ds/nutrition-label";
import { Pill } from "@/components/ds/pill";
import { StarDistribution } from "@/components/ds/star-distribution";
import { ALLERGEN_FILTERS } from "@/lib/catalog/schemas";
import type { ProductCard } from "@/lib/catalog/types";

// What a soup's sheet and its page share under the vote: how it was voted and what people say,
// what it is free of, the label, the Nutri-Score and the rest. One component, so the sheet pulled
// up and the page opened from a link read the same.

const date = new Intl.DateTimeFormat("it-IT", { dateStyle: "long" });

const TAG_ORDER = { positive: 0, negative: 1, neutral: 2 } as const;
const TAG_SIGN = { positive: "+", negative: "−", neutral: "·" } as const;
const TAG_WORD = { positive: "pro", negative: "contro", neutral: "com’è" } as const;

const section = "flex flex-col gap-4";
const heading = "font-display text-lead font-medium";

function registeredNote(n: number) {
	if (n === 0) return "Nessuno da persone con un account.";
	if (n === 1) return "1 da una persona con un account.";
	return `${n} da persone con un account.`;
}

/** Out of production, or a recipe that changed: said before the vote, which they qualify. */
export function SoupWarnings({ product }: { product: ProductCard }) {
	return (
		<>
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
		</>
	);
}

/** Everything under the vote, in the page's order. */
export function SoupSections({ product }: { product: ProductCard }) {
	const id = useId();
	const { stats } = product;
	// «Senza» only when the label was read: no ingredients means no allergen data, not none.
	const free = product.ingredientsText
		? ALLERGEN_FILTERS.filter(allergen => !product.allergens.includes(allergen))
		: [];

	return (
		<>
			<section aria-labelledby={`${id}-votes`} className={section}>
				<h2 id={`${id}-votes`} className={heading}>
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
										<span className="text-text-soft tabular-nums">{tag.percent}%</span>
									</Pill>
								</li>
							))}
					</ul>
				)}
			</section>

			{free.length > 0 && (
				<section aria-labelledby={`${id}-free`} className={section}>
					<h2 id={`${id}-free`} className={heading}>
						Senza:
					</h2>
					<ul className="flex flex-wrap gap-2">
						{free.map(allergen => (
							<li key={allergen}>
								<Pill>
									<AllergenIcon allergen={allergen} className="size-4" />
									{allergen.charAt(0).toUpperCase() + allergen.slice(1)}
								</Pill>
							</li>
						))}
					</ul>
					<p className="text-small text-text-soft">
						Secondo gli allergeni dichiarati. Leggi sempre l’etichetta.
					</p>
				</section>
			)}

			{product.ingredientsText && (
				<section aria-labelledby={`${id}-ingredients`} className={section}>
					<h2 id={`${id}-ingredients`} className={heading}>
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

			{product.nutrition && (
				<NutritionLabel nutrition={product.nutrition} quantity={product.quantity} />
			)}

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
									className="inline-flex min-h-11 items-center gap-1.5 underline"
								>
									Sito del produttore
									<ExternalIcon className="size-4" />
								</a>
							</li>
						)}
						{product.retailers.map(link => (
							<li key={link.retailer}>
								<a
									href={link.url}
									target="_blank"
									rel="noopener noreferrer"
									className="inline-flex min-h-11 items-center gap-1.5 underline"
								>
									Su {link.retailer}
									<ExternalIcon className="size-4" />
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
		</>
	);
}
