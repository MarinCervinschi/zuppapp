import { useRouterState } from "@tanstack/react-router";

import { ThemeSwitch } from "./theme-switch";

/**
 * The close of every page: the theme, and the credits the licences ask for (Open Food Facts'
 * data under ODbL, DiceBear's Critters under CC0), on the raised paper so it reads as the end.
 * It leaves room for the tab bar below it. On the profile the theme is already among the
 * settings, so the footer does not repeat it.
 */
export function SiteFooter() {
	const onProfile = useRouterState({
		select: state => state.location.pathname.startsWith("/profilo"),
	});
	return (
		<footer className="pb-tabbar bg-ground-raised mt-16">
			<div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 pt-8 pb-6 md:flex-row md:items-end md:justify-between">
				<div className="flex flex-col gap-2">
					<p className="wordmark text-wordmark text-text-soft">Zuppapp</p>
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
				{!onProfile && (
					<div className="flex flex-col gap-2 md:items-end">
						<span aria-hidden className="text-small text-text-soft">
							Tema
						</span>
						<ThemeSwitch />
					</div>
				)}
			</div>
		</footer>
	);
}
