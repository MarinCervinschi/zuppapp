import { useState } from "react";

import { createFileRoute } from "@tanstack/react-router";

import { BowlFace } from "@/components/brand/bowl-face";
import { Leaderboard, Podium } from "@/components/catalog/ranking";
import { TasteTile } from "@/components/catalog/taste-tile";
import { AppBar } from "@/components/ds/app-bar";
import { Barcode } from "@/components/ds/barcode";
import { Button } from "@/components/ds/button";
import { NutritionLabel } from "@/components/ds/nutrition-label";
import { Receipt, ReceiptRow, ReceiptTotal } from "@/components/ds/receipt";
import { ScoreSpread, SpreadLegend } from "@/components/ds/score-spread";
import { ShelfLabel } from "@/components/ds/shelf-label";
import { Stamp } from "@/components/ds/stamp";
import { Sticker } from "@/components/ds/sticker";
import { VoteDistribution } from "@/components/ds/vote-distribution";
import { FacePicker } from "@/components/product/face-picker";
import type { ProductListItem } from "@/lib/catalog/types";
import { SCORES, SCORE_LABELS, type Score } from "@/lib/ranking/rules";

export const Route = createFileRoute("/design")({
	head: () => ({ meta: [{ title: "Design system · Zuppapp" }] }),
	component: DesignPage,
});

// The living style guide: every token and component of DESIGN.md, rendered by the real code.

const SWATCHES = [
	["ground", "bg-ground", "Carta termica: lo sfondo"],
	[
		"ground-raised",
		"bg-ground-raised",
		"Il secondo foglio: cartellini, scontrini, controlli",
	],
	["text", "bg-text", "Inchiostro dello scontrino"],
	["text-soft", "bg-text-soft", "Inchiostro sbiadito: note e dettagli"],
	["accent", "bg-accent", "Rosso timbro: il voto e il focus, nient’altro"],
	["field", "bg-field", "Giallo scaffale: un campo per schermata"],
] as const;

const SAMPLE = {
	ean: "2000000000015",
	name: "Vellutata di zucca",
	brand: "Marca Esempio",
	subtype: "vellutata",
	quantity: "620 g",
	votesCount: 128,
	rebuyPercent: 64,
};

// Sample products for the specimens; the EANs are shop-internal codes, never real packs.
function sample(
	rank: number | null,
	name: string,
	brand: string,
	rebuy: number,
	votes: number
): ProductListItem {
	const four = Math.round((votes * rebuy) / 100);
	const rest = votes - four;
	return {
		id: `sample-${name}`,
		ean: "2000000000015",
		name,
		brand,
		subtype: "minestrone",
		quantity: "620 g",
		imageUrl: null,
		votesCount: votes,
		rebuyPercent: rebuy,
		scoreCounts: {
			4: four,
			3: Math.ceil(rest / 2),
			2: Math.floor(rest / 3),
			1: rest - Math.ceil(rest / 2) - Math.floor(rest / 3),
		},
		rank,
		myScore: null,
	};
}

const RANKING = [
	sample(1, "Minestrone di 11 verdure", "Marca Esempio", 79, 24),
	sample(2, "Vellutata di zucca", "Marca Esempio", 71, 31),
	sample(3, "Zuppa di legumi e cereali", "Altra Marca", 64, 18),
	sample(4, "Passato di verdure", "Altra Marca", 50, 18),
	sample(5, "Crema di funghi", "Marca Esempio", 41, 17),
];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
	return (
		<section className="flex flex-col gap-5">
			<h2 className="font-condensed text-lead font-extrabold uppercase">{title}</h2>
			{children}
		</section>
	);
}

function DesignPage() {
	const [score, setScore] = useState<Score | null>(4);
	const [stamps, setStamps] = useState(0);
	const [tags, setTags] = useState<string[]>(["cremosa"]);
	const toggle = (slug: string) =>
		setTags(current =>
			current.includes(slug) ? current.filter(t => t !== slug) : [...current, slug]
		);

	return (
		<>
			<AppBar back />
			<main className="mx-auto flex max-w-3xl flex-col gap-14 px-4 pt-6 pb-20">
				<header className="flex flex-col gap-3">
					<h1 className="font-condensed text-title font-black uppercase">
						Design system
					</h1>
					<p className="text-body">
						Zuppapp è stampata sulla carta del supermercato: il cartellino dello
						scaffale, lo scontrino, la tabella nutrizionale e un timbro rosso per il tuo
						voto. Due inchiostri, un giallo, angoli vivi.
					</p>
				</header>

				<Section title="Colori">
					<ul className="grid grid-cols-2 gap-3">
						{SWATCHES.map(([name, swatch, use]) => (
							<li key={name} className="flex flex-col gap-2">
								<span className={`block h-16 ${swatch}`} />
								<span className="text-body font-semibold">{name}</span>
								<span className="text-small text-text-soft">{use}</span>
							</li>
						))}
					</ul>
				</Section>

				<Section title="Caratteri">
					<p className="font-condensed text-figure font-black tracking-[-0.03em]">
						64%
					</p>
					<p className="font-semicondensed text-title font-extrabold tracking-[-0.02em]">
						Minestrone di verdure
					</p>
					<p className="font-condensed text-lead font-extrabold uppercase">
						Lo scontrino dei voti
					</p>
					<p className="text-body">
						Archivo, un solo carattere variabile: stretto per tutto ciò che è stampato
						come un prezzo, normale per tutto ciò che si legge.
					</p>
					<p className="text-small text-text-soft">
						EAN 2000000000015 · 13 px, il minimo
					</p>
				</Section>

				<Section title="Le quattro facce">
					<ul className="text-bowl-ink grid grid-cols-4 gap-2">
						{SCORES.map(s => (
							<li key={s} className="flex flex-col items-center gap-2">
								<BowlFace score={s} className="size-16" />
								<span className="font-semicondensed text-small text-text font-bold">
									{SCORE_LABELS[s].label}
								</span>
							</li>
						))}
					</ul>
					<FacePicker
						value={score}
						onPick={next => {
							setScore(next);
							setStamps(n => n + 1);
						}}
					/>
				</Section>

				<Section title="Cartellino">
					<ShelfLabel
						as="static"
						heading={false}
						product={SAMPLE}
						stamp={
							score && (
								<Stamp key={stamps} pressed={stamps > 0}>
									{SCORE_LABELS[score].label}
								</Stamp>
							)
						}
					/>
					<ShelfLabel
						as="static"
						heading={false}
						product={{ ...SAMPLE, votesCount: 1, name: "Passato di verdure" }}
					/>
				</Section>

				<Section title="Classifica: podio e righe">
					<SpreadLegend />
					<Podium products={RANKING.slice(0, 3)} />
					<Leaderboard products={RANKING.slice(3)} start={4} />
				</Section>

				<Section title="Distribuzione dei voti">
					<ScoreSpread counts={{ 4: 82, 3: 23, 2: 14, 1: 9 }} />
				</Section>

				<Section title="Da assaggiare, con voto rapido">
					<ul className="grid grid-cols-2 gap-3">
						<li>
							<TasteTile
								demo
								product={sample(null, "Zuppa toscana", "Marca Esempio", 0, 2)}
							/>
						</li>
						<li>
							<TasteTile
								demo
								product={sample(null, "Brodo vegetale", "Altra Marca", 0, 0)}
							/>
						</li>
					</ul>
				</Section>

				<Section title="Etichette dei tag">
					<div className="flex flex-wrap gap-2">
						<Sticker
							tone="positive"
							pressed={tags.includes("cremosa")}
							onClick={() => toggle("cremosa")}
						>
							Cremosa
						</Sticker>
						<Sticker
							tone="negative"
							pressed={tags.includes("salata")}
							onClick={() => toggle("salata")}
						>
							Troppo salata
						</Sticker>
						<Sticker
							tone="neutral"
							pressed={tags.includes("densa")}
							onClick={() => toggle("densa")}
						>
							Densa
						</Sticker>
					</div>
				</Section>

				<Section title="Scontrino">
					<Receipt title="Lo scontrino dei voti" headingLevel={3}>
						<VoteDistribution counts={{ 1: 9, 2: 14, 3: 23, 4: 82 }} />
						<div className="mt-3 flex flex-col gap-2">
							<ReceiptRow label="«Cremosa»" value="41%" />
							<ReceiptRow label="«Troppo salata»" value="12%" />
						</div>
						<ReceiptTotal label="Totale voti" value={128} />
					</Receipt>
				</Section>

				<Section title="Etichetta nutrizionale">
					<NutritionLabel
						nutrition={{
							energyKcal: 42,
							fat: 1.8,
							saturatedFat: 0.3,
							carbohydrates: 5.4,
							sugars: 2.1,
							proteins: 0.9,
							salt: 0.7,
						}}
					/>
				</Section>

				<Section title="Pulsanti e codice a barre">
					<div className="flex flex-wrap gap-3">
						<Button variant="ink">Accedi con Google</Button>
						<Button>Annulla</Button>
						<Button disabled>Non disponibile</Button>
					</div>
					<Barcode ean="2000000000015" />
				</Section>
			</main>
		</>
	);
}
