import { useState } from "react";

import { createFileRoute } from "@tanstack/react-router";

import { Leaderboard, Podium } from "@/components/catalog/ranking";
import { TasteTile } from "@/components/catalog/taste-tile";
import { Barcode } from "@/components/ds/barcode";
import { Button } from "@/components/ds/button";
import { NutriScore } from "@/components/ds/nutri-score";
import { NutritionLabel } from "@/components/ds/nutrition-label";
import { PageHead, type Soup } from "@/components/ds/page-head";
import { Pill } from "@/components/ds/pill";
import { StarDistribution } from "@/components/ds/star-distribution";
import { RatingBadge, StarPicker } from "@/components/ds/stars";
import type { ProductListItem } from "@/lib/catalog/types";
import { SCORE_LABELS, type Score } from "@/lib/ranking/rules";

export const Route = createFileRoute("/design")({
	head: () => ({ meta: [{ title: "Design system · Zuppapp" }] }),
	component: DesignPage,
});

// The living style guide: every token and component of DESIGN.md, rendered by the real code.

const SWATCHES = [
	["ground", "bg-ground", "La carta: lo sfondo di ogni schermata"],
	[
		"ground-raised",
		"bg-ground-raised",
		"Il foglio sopra: pill, campi, card senza foto",
	],
	["text", "bg-text", "L’inchiostro dei titoli e del testo"],
	["text-soft", "bg-text-soft", "Inchiostro chiaro: marca, tipo, note"],
	["ink", "bg-ink", "I pannelli neri: il voto, la tab attiva, l’azione primaria"],
	["badge-good", "bg-badge-good", "Il badge verde con la media delle stelle"],
	["star", "bg-star", "La stella piena, solo sul nero"],
	["field", "bg-field", "Giallo mais: avvisi, la tessera, il foglio della scheda"],
] as const;

const SOUPS: [Soup, string, string][] = [
	["tomato", "Pomodoro", "bg-soup-tomato"],
	["pumpkin", "Zucca", "bg-soup-pumpkin"],
	["corn", "Mais", "bg-soup-corn"],
	["pea", "Piselli", "bg-soup-pea"],
	["beet", "Barbabietola", "bg-soup-beet"],
];

// Sample products for the specimens; the EANs are shop-internal codes, never real packs.
function sample(
	rank: number | null,
	name: string,
	brand: string,
	mean: number,
	votes: number
): ProductListItem {
	const five = Math.round((votes * (mean - 3)) / 2);
	const four = votes - five;
	return {
		id: `sample-${name}`,
		ean: "2000000000015",
		name,
		brand,
		subtype: "vellutata",
		quantity: "620 g",
		imageUrl: null,
		votesCount: votes,
		mean,
		scoreCounts: { 5: five, 4: four, 3: 0, 2: 0, 1: 0 },
		rank,
		myScore: null,
	};
}

const PODIUM = [
	sample(1, "Crema di zucca e fagioli cannellini", "Marca Esempio", 4.7, 25),
	sample(2, "Crema di zucchine e patate", "Marca Esempio", 4.6, 31),
	sample(3, "Vellutata di asparagi", "Altra Marca", 4.5, 18),
];
const ROWS = [
	sample(4, "Minestrone di verdure", "Marca Esempio", 4.3, 40),
	sample(5, "Zuppa di ceci", "Altra Marca", 4.2, 12),
];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
	return (
		<section className="flex flex-col gap-5">
			<h2 className="font-display text-title font-semibold">{title}</h2>
			{children}
		</section>
	);
}

function DesignPage() {
	const [score, setScore] = useState<Score | null>(4);
	const [tags, setTags] = useState<string[]>(["cremosa"]);
	const toggle = (tag: string) =>
		setTags(current =>
			current.includes(tag) ? current.filter(t => t !== tag) : [...current, tag]
		);

	return (
		<>
			<PageHead blob="tomato" title="Design system">
				<p>
					Carta calda, inchiostro nero e macchie di zuppa: ogni pezzo qui è il codice
					vero.
				</p>
			</PageHead>

			<main className="mx-auto flex max-w-4xl flex-col gap-16 px-4">
				<Section title="Colori">
					<ul className="grid gap-3 sm:grid-cols-2">
						{SWATCHES.map(([name, swatch, role]) => (
							<li key={name} className="flex items-center gap-3">
								<span
									aria-hidden
									className={`${swatch} size-14 shrink-0 rounded-full outline-1 outline-black/10`}
								/>
								<span className="flex flex-col">
									<code className="text-small font-medium">{name}</code>
									<span className="text-small text-text-soft">{role}</span>
								</span>
							</li>
						))}
					</ul>
					<h3 className="font-display text-lead font-medium">Le zuppe</h3>
					<ul className="flex flex-wrap gap-4">
						{SOUPS.map(([soup, label, swatch]) => (
							<li key={soup} className="flex flex-col items-center gap-2">
								<span aria-hidden className={`${swatch} grain size-20 rounded-full`} />
								<span className="text-small">{label}</span>
							</li>
						))}
					</ul>
				</Section>

				<Section title="Carattere">
					<p className="wordmark text-wordmark text-text-soft">Zuppapp · marchio</p>
					<p className="font-display text-display font-semibold">
						Clash Display, display
					</p>
					<p className="font-display text-title font-semibold">
						Il nome della zuppa, title
					</p>
					<p className="font-display text-lead font-medium">
						Un titolo di sezione, lead
					</p>
					<p className="text-body">Poppins, body: tutto ciò che si legge, a 16 px.</p>
					<p className="text-small text-text-soft">
						Poppins, small: marca • tipo • formato
					</p>
				</Section>

				<Section title="Intestazioni con la macchia">
					<div className="grid gap-4 sm:grid-cols-2">
						{SOUPS.slice(0, 4).map(([soup, label], index) => (
							<PageHead
								key={soup}
								blob={soup}
								shape={index % 2 ? "onda" : "gocce"}
								title={label}
								className="rounded-card pt-8 pb-10"
							>
								<p>{index % 2 ? "Onda" : "Gocce"}: muovi il mouse qui sopra.</p>
							</PageHead>
						))}
					</div>
				</Section>

				<Section title="Il voto">
					<div className="bg-ink text-on-ink rounded-panel flex flex-col items-center gap-4 px-4 pt-5 pb-4">
						<p className="font-display text-lead font-medium">Il tuo voto</p>
						<StarPicker value={score} onPick={setScore} />
						<p className="text-small" aria-live="polite">
							{score
								? `«${SCORE_LABELS[score].label}»`
								: "Una stella: mai più. Cinque: la ricompro."}
						</p>
					</div>
					<p className="flex flex-wrap items-center gap-3">
						<RatingBadge mean={4.7} votesCount={25} />
						<RatingBadge mean={4.2} votesCount={9} size="sm" />
						<RatingBadge mean={null} votesCount={0} />
					</p>
					<StarDistribution counts={{ 5: 14, 4: 7, 3: 2, 2: 1, 1: 1 }} />
				</Section>

				<Section title="Pill e pulsanti">
					<div className="flex flex-wrap gap-2">
						{["cremosa", "saporita", "troppo salata"].map(tag => (
							<Pill key={tag} pressed={tags.includes(tag)} onClick={() => toggle(tag)}>
								{tag}
							</Pill>
						))}
						<Pill>Glutine</Pill>
					</div>
					<div className="flex flex-wrap gap-3">
						<Button variant="ink">Vedi 477 zuppe</Button>
						<Button>Filtri</Button>
						<Button disabled>Disattivato</Button>
					</div>
				</Section>

				<Section title="Classifica">
					<Podium products={PODIUM} />
					<Leaderboard products={ROWS} start={4} />
				</Section>

				<Section title="Card da assaggiare">
					<ul className="grid grid-cols-1 gap-x-4 gap-y-10 sm:grid-cols-2 md:grid-cols-3">
						<li>
							<TasteTile
								product={{
									...sample(null, "Zuppa di farro", "Marca Esempio", 4, 1),
									rank: null,
								}}
							/>
						</li>
						<li>
							<TasteTile
								product={{
									...sample(null, "Passato di verdure", "Altra Marca", 3.5, 0),
									mean: null,
									rank: null,
								}}
							/>
						</li>
					</ul>
				</Section>

				<Section title="Etichetta">
					<NutritionLabel
						nutrition={{
							energyKcal: 45,
							fat: 1.6,
							saturatedFat: 0.2,
							carbohydrates: 5.8,
							sugars: 2.1,
							proteins: 1.3,
							salt: 0.7,
						}}
					/>
					<div className="flex flex-wrap justify-center gap-4">
						{["a", "b", "c", "d", "e"].map(grade => (
							<NutriScore key={grade} grade={grade} className="size-36" />
						))}
					</div>
					<Barcode ean="2000000000015" />
				</Section>
			</main>
		</>
	);
}
