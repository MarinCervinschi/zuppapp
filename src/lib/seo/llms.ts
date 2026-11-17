import { getFacets, getRanking } from "@/lib/catalog/browse";
import type { ProductListItem } from "@/lib/catalog/types";
import { MIN_VOTES_TO_RANK } from "@/lib/ranking/rules";

// `/llms.txt` (llmstxt.org): what Zuppapp is and where its pages are, in Markdown, for a language
// model reading the site. Built at each request, like the sitemap, so the top ten stays current.

const TOP = 10;

export async function getLlmsTxt(site: string) {
	const [ranking, facets] = await Promise.all([
		getRanking({ righe: TOP }),
		getFacets({}),
	]);
	return llmsTxt(site, {
		soups: facets.total,
		ranked: ranking.total,
		top: [...ranking.podium, ...ranking.rows],
	});
}

export function llmsTxt(
	site: string,
	data: { soups: number; ranked: number; top: ProductListItem[] }
) {
	const lines = [
		"# Zuppapp",
		"",
		"> Zuppapp è una classifica delle zuppe pronte vendute nei supermercati italiani, votate da chi le mangia con le stelle da 1 a 5. Il sito è in italiano.",
		"",
		`Il catalogo ha ${data.soups} zuppe, prese da Open Food Facts: nome, marca, formato, ingredienti, allergeni, valori nutrizionali, Nutri-Score e NOVA. Chiunque può votare, anche senza account. Una zuppa entra in classifica da ${MIN_VOTES_TO_RANK} voti, e oggi ce ne sono ${data.ranked}. La classifica ordina per media bayesiana delle stelle, così poche stelle alte non battono molti voti buoni; la media mostrata su ogni zuppa è quella semplice.`,
		"",
		"## Pagine",
		"",
		`- [Ricerca](${site}/): cerca una zuppa per nome, marca o ingrediente, con filtri per tipo, marca, Nutri-Score e allergeni`,
		`- [Classifica](${site}/classifica): tutte le zuppe con abbastanza voti, dalla migliore`,
		`- Scheda di una zuppa: \`${site}/prodotti/<EAN>\`, con media, voti, ingredienti, allergeni e valori nutrizionali`,
		`- [I dati delle zuppe](${site}/dati): la licenza del catalogo`,
		"",
		"## Dati",
		"",
		`- [Catalogo completo (JSON)](${site}/dati/catalogo.json): ogni zuppa con i dati dell’etichetta, senza voti né utenti, sotto licenza ODbL come Open Food Facts`,
		`- [Sitemap](${site}/sitemap.xml): l’indirizzo di ogni scheda`,
	];
	if (data.top.length > 0) {
		lines.push("", `## Le prime ${data.top.length} della classifica`, "");
		for (const soup of data.top) lines.push(topLine(site, soup));
	}
	lines.push(
		"",
		"## Optional",
		"",
		`- [Privacy](${site}/privacy): quali dati personali tiene l’app e perché`
	);
	return lines.join("\n") + "\n";
}

function topLine(site: string, soup: ProductListItem) {
	const name = soup.brand ? `${soup.name} (${soup.brand})` : soup.name;
	const mean = soup.mean?.toLocaleString("it-IT", { maximumFractionDigits: 1 });
	const votes = soup.votesCount === 1 ? "1 voto" : `${soup.votesCount} voti`;
	return `${soup.rank}. [${escapeLink(name)}](${site}/prodotti/${soup.ean}): ${mean} stelle su 5, ${votes}`;
}

/** A bracket in a soup's name would end the link text early. */
function escapeLink(text: string) {
	return text.replace(/[[\]]/g, "\\$&");
}
