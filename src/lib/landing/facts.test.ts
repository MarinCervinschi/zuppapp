import { describe, expect, it } from "vitest";

import { labelFacts, podiumLine } from "./facts";

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
	});

	it("writes the Nutri-Score in capitals, and copes with a label that has nothing", () => {
		expect(label("acqua", "c").nutriscore).toBe("C");
		const empty = label(null, null);
		expect(empty).toMatchObject({ ingredients: 0, veg: null, nutriscore: null });
	});
});

describe("podiumLine", () => {
	it("has a line for every podium from empty to full", () => {
		expect(podiumLine(0, 3)).toBe("Nessuna zuppa ha ancora 3 voti. Comincia tu.");
		expect(podiumLine(2, 3)).toBe("Il terzo posto è libero.");
		expect(podiumLine(3, 3)).toBe("Il podio è pieno. Per ora.");
	});
});
