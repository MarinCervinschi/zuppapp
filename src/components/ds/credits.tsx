import { Link } from "@tanstack/react-router";

import { ExternalIcon, GitHubIcon } from "./icons";

// Where the presentation, the data, the privacy notice and the code are: in the footer, on «Accedi» (a phone has no
// footer) and in the profile's «Crediti». Open Food Facts' ODbL credit lives on `/dati` and on
// every soup, so the footer only links there.

export const CREDITS = {
	data: { href: "https://world.openfoodfacts.org", label: "Open Food Facts" },
	avatars: {
		href: "https://www.dicebear.com/styles/critters/",
		label: "Critters di DiceBear",
	},
	code: { href: "https://github.com/MarinCervinschi/zuppapp", label: "Open source" },
} as const;

/** Four small links: the presentation, the data, the privacy notice, the code on GitHub. */
export function SiteLinks({ className }: { className?: string }) {
	const link =
		"text-text-soft hover:text-text inline-flex min-h-11 items-center gap-2 no-underline transition-colors duration-150";
	return (
		<nav aria-label="Informazioni sul sito" className={className}>
			<ul className="text-small flex flex-wrap items-center gap-x-6">
				<li>
					{/* A full load: the presentation starts from its own preloader, like on a first visit. */}
					<Link to="/presentazione" reloadDocument className={link}>
						Cos’è Zuppapp
					</Link>
				</li>
				<li>
					<Link to="/dati" className={link}>
						Dati delle zuppe
					</Link>
				</li>
				<li>
					<Link to="/privacy" className={link}>
						Privacy
					</Link>
				</li>
				<li>
					<a
						href={CREDITS.code.href}
						target="_blank"
						rel="noopener noreferrer"
						className={link}
					>
						<GitHubIcon className="size-4" />
						{CREDITS.code.label}
					</a>
				</li>
			</ul>
		</nav>
	);
}

function Out({ link }: { link: { href: string; label: string } }) {
	return (
		<a
			href={link.href}
			target="_blank"
			rel="noopener noreferrer"
			className="inline-flex items-center gap-1 underline"
		>
			{link.label}
			<ExternalIcon className="size-4" />
		</a>
	);
}

/** The credits as a list, in the profile's sheet; the code link is the sheet's own button. */
export function CreditsList() {
	return (
		<ul className="text-body flex flex-col gap-3">
			<li>
				Dati dei prodotti da <Out link={CREDITS.data} />, licenza ODbL.
			</li>
			<li>
				Avatar <Out link={CREDITS.avatars} />, CC0.
			</li>
		</ul>
	);
}
