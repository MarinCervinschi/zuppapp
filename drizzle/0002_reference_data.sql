-- The first category and the quick tags agreed in SPEC.md. Data, not schema, but every
-- environment needs it before the first vote.
INSERT INTO categories (slug, name, attributes_schema) VALUES (
	'zuppe',
	'Zuppe e vellutate',
	'{"subtypes": ["vellutata", "minestrone", "legumi", "cereali", "brodo", "passato"], "formats": ["fresco", "brick", "scatola", "surgelato"]}'
) ON CONFLICT (slug) DO NOTHING;
--> statement-breakpoint
INSERT INTO tags (slug, label, sentiment, position) VALUES
	('cremosa', 'Cremosa', 'positive', 10),
	('saporita', 'Saporita', 'positive', 20),
	('tanta-verdura', 'Tanta verdura', 'positive', 30),
	('porzione-abbondante', 'Porzione abbondante', 'positive', 40),
	('fatta-in-casa', 'Sa di fatta in casa', 'positive', 50),
	('troppo-salata', 'Troppo salata', 'negative', 110),
	('acquosa', 'Acquosa', 'negative', 120),
	('insipida', 'Insipida', 'negative', 130),
	('sa-di-confezione', 'Sa di confezione', 'negative', 140),
	('porzione-piccola', 'Porzione piccola', 'negative', 150),
	('densa', 'Densa', 'neutral', 210),
	('piccante', 'Piccante', 'neutral', 220),
	('da-allungare', 'Da allungare', 'neutral', 230)
ON CONFLICT (slug) DO NOTHING;
