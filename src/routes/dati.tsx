import { createFileRoute } from "@tanstack/react-router";

import { buttonClass } from "@/components/ds/button";
import { CREDITS } from "@/components/ds/credits";
import { DocSection } from "@/components/ds/doc-section";
import { DownloadIcon } from "@/components/ds/icons";
import { PageHead } from "@/components/ds/page-head";

// The ODbL dump of SPEC decision 11: the catalogue comes from Open Food Facts' ODbL database,
// so it is shared under the same licence. The file is `dati_.catalogo[.]json.ts`.

export const Route = createFileRoute("/dati")({
	head: () => ({ meta: [{ title: "I dati delle zuppe · Zuppapp" }] }),
	component: Data,
});

function Data() {
	return (
		<>
			<PageHead title="I dati delle zuppe" back="/">
				Il catalogo è di tutti: scaricalo e usalo.
			</PageHead>
			<main className="mx-auto flex max-w-xl flex-col gap-10 px-4 pb-16">
				<a href="/dati/catalogo.json" download className={buttonClass("ink")}>
					<DownloadIcon className="size-5" />
					Scarica il catalogo (JSON)
				</a>

				<DocSection title="Cosa c’è">
					<p>
						Ogni zuppa dell’app con codice a barre, nome, marca, formato, ingredienti,
						allergeni, valori nutrizionali, Nutri-Score e NOVA. Niente voti, niente dati
						di chi usa l’app, niente foto (sono su Open Food Facts).
					</p>
				</DocSection>

				<DocSection title="La licenza">
					<p>
						<a
							href="https://opendatacommons.org/licenses/odbl/1-0/"
							target="_blank"
							rel="noopener noreferrer"
						>
							ODbL
						</a>
						, come{" "}
						<a href={CREDITS.data.href} target="_blank" rel="noopener noreferrer">
							Open Food Facts
						</a>
						, da cui vengono i dati. Usali come vuoi, anche per guadagnarci: cita Open
						Food Facts e Zuppapp, e condividi con la stessa licenza un database che ne
						deriva.
					</p>
				</DocSection>
			</main>
		</>
	);
}
