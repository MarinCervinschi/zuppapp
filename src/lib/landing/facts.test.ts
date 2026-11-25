import { describe, expect, it } from "vitest";

import { labelFacts, landingData, podiumLine } from "./facts";

const label = (ingredientsText: string | null, nutriscore: string | null = "b") =>
	labelFacts({
		ean: "8002330029821",
		name: "Zuppa",
		brand: "Esselunga",
		ingredientsText,
		nutriscore,
	});

describe("labelFacts", () => {
	it("counts the ingredients, not the commas inside numbers or brackets", () => {
		const facts = label(
			"Acqua, castagne 10%, zucca 7%, passata di pomodoro, cipolla, lenticchie rosse 5%, lenticchie verdi 5%, radicchio 4%, olio extra vergine di oliva 2,3%, erbe aromatiche 1,2%, sale. Può contenere tracce di cereali contenenti glutine e sedano. SENZA COLORANTI."
		);
		expect(facts.ingredients).toBe(11);
		expect(label("acqua, verdure (carote, piselli, porri), sale").ingredients).toBe(3);
	});

	it("picks the first vegetable that declares its share", () => {
		expect(label("Acqua, castagne 10%, Zucca 7%, cipolla").veg).toBe("zucca 7%");
		expect(label("acqua, cipolla, sale").veg).toBeNull();
		expect(
			label("acqua, verdure fresche 16% (carote, sedano, cipolle), sale").veg
		).toBe("verdure fresche 16%");
	});

	it("finds what no kitchen at home would put in", () => {
		const facts = label(
			"Acqua, carote 12%, patate, olio di semi di girasole, amido modificato, sale, estratto di lievito, aromi"
		);
		expect(facts.first).toBe("acqua");
		expect(facts.yeast).toBe(true);
		expect(facts.modern).toBe("olio di girasole");
		expect(label("Zucca 40% (zucca, acqua), cipolla, aromi").first).toBe("zucca");
		expect(label("acqua, cipolla, erbe aromatiche").modern).toBeNull();
	});

	it("writes the Nutri-Score in capitals, and copes with a label that has nothing", () => {
		expect(label("acqua", "c").nutriscore).toBe("C");
		const empty = label(null, null);
		expect(empty).toMatchObject({ ingredients: 0, veg: null, nutriscore: null });
	});
});

describe("podiumLine", () => {
	it("says how the podium stands, with its real numbers", () => {
		const soup = (votes: number) => ({ votes });
		expect(podiumLine([], 3, 486)).toBe(
			"Nessuna zuppa ha ancora 3 voti. Il podio è vuoto."
		);
		expect(podiumLine([soup(3)], 3, 486)).toBe("Sul podio c’è una zuppa sola.");
		expect(podiumLine([soup(3), soup(3)], 3, 486)).toBe(
			"Due zuppe sul podio, 6 voti in tutto."
		);
		expect(podiumLine([soup(5), soup(4), soup(3)], 3, 12000)).toBe(
			"Tre zuppe sul podio, su 12.000."
		);
	});
});

describe("landingData", () => {
	it("has no label facts for a card whose label lists no ingredients", () => {
		const data = landingData({
			total: 1,
			ranking: { podium: [], rows: [], total: 0, page: 1, pageSize: 10, pageCount: 0 },
			toTaste: [],
			card: {
				ean: "8000000000001",
				name: "Zuppa",
				brand: null,
				ingredientsText: " ",
				nutriscore: "a",
			} as never,
		});
		expect(data.label).toBeNull();
	});
});
