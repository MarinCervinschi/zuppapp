import { ThemeSwitch } from "./theme-switch";

/**
 * The close of every page, one tone down from the paper: the theme, and the credits the
 * licences ask for (Open Food Facts' data under ODbL, DiceBear's Critters under CC0).
 */
export function SiteFooter() {
	return (
		<footer className="bg-ground-raised mt-16">
			<div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 md:grid-cols-[1fr_auto] md:items-end">
				<div className="flex flex-col gap-3">
					<p className="font-condensed text-title font-black uppercase">Zuppapp</p>
					<p className="text-small text-text-soft max-w-[60ch]">
						Dati dei prodotti da{" "}
						<a
							href="https://world.openfoodfacts.org"
							className="underline"
							rel="noopener noreferrer"
							target="_blank"
						>
							Open Food Facts
						</a>
						, licenza ODbL. Avatar{" "}
						<a
							href="https://www.dicebear.com/styles/critters/"
							className="underline"
							rel="noopener noreferrer"
							target="_blank"
						>
							Critters di DiceBear
						</a>
						, CC0.{" "}
						<a
							href="https://github.com/MarinCervinschi/zuppapp"
							className="underline"
							rel="noopener noreferrer"
							target="_blank"
						>
							Il codice è aperto su GitHub
						</a>
						.
					</p>
				</div>
				<div className="flex flex-col gap-2 md:items-end">
					<span aria-hidden className="label-caps text-small">
						Tema
					</span>
					<ThemeSwitch className="bg-ground" />
				</div>
			</div>
		</footer>
	);
}
