-- Written by hand: drizzle-kit knows neither pg_search nor its index type.
-- Italian stemming on the text people search for, so "vellutate" finds "vellutata";
-- the brand is only folded, because a stemmed brand name stops matching itself.
CREATE EXTENSION IF NOT EXISTS pg_search;
--> statement-breakpoint
CREATE INDEX products_search_idx ON products
USING paradedb (
	id,
	(name::pdb.simple('stemmer=italian', 'ascii_folding=true')),
	(brand::pdb.simple('ascii_folding=true')),
	(subtype::pdb.simple('stemmer=italian', 'ascii_folding=true')),
	(ingredients_text::pdb.simple('stemmer=italian', 'ascii_folding=true'))
);
