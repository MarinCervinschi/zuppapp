// What the home tells search engines about the site as a whole. Pure, so it is tested alone.

export const SITE_NAME = "Zuppapp";

/** Under the home's title in search results, and in a shared link's preview. */
export const HOME_DESCRIPTION =
	"Vota con le stelle le zuppe pronte del supermercato e scopri le più buone. Cerca per nome, marca o ingrediente, oppure scansiona il codice a barre.";

/** schema.org's WebSite: the name Google shows above the result instead of the bare domain. */
export function websiteJsonLd(site: string) {
	return {
		"@context": "https://schema.org",
		"@type": "WebSite",
		name: SITE_NAME,
		alternateName: "zuppapp.fun",
		url: `${site}/`,
		inLanguage: "it-IT",
	};
}
