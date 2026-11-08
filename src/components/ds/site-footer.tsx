import { useRouterState } from "@tanstack/react-router";

import { SiteLinks } from "./credits";
import { ThemeSwitch } from "./theme-switch";

/**
 * The close of every page, in one row on the raised paper: the wordmark and the links to the data,
 * the privacy notice and the code on the left, the theme on the right. It leaves room for the tab
 * bar below it. Only on a wide screen: on a phone a site's footer under every page is out of place,
 * and the same links are in the profile and on «Prendi la tua tessera». On the profile the theme
 * is already among the settings, so the footer does not repeat it.
 */
export function SiteFooter() {
	const onProfile = useRouterState({
		select: state => state.location.pathname.startsWith("/profilo"),
	});
	return (
		<footer className="pb-tabbar bg-ground-raised mt-16 hidden lg:block">
			<div className="mx-auto flex max-w-6xl items-center justify-between gap-8 px-4 py-4">
				<div className="flex items-center gap-8">
					<p className="wordmark text-wordmark text-text-soft">Zuppapp</p>
					<SiteLinks />
				</div>
				{!onProfile && <ThemeSwitch />}
			</div>
		</footer>
	);
}
