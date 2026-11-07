import { cn } from "@/lib/utils";

import { ExternalIcon } from "./icons";

// What the licences ask for, and where the code is: the same words in the footer, on «Accedi» and
// in the profile's «Crediti».

export const CREDITS = {
	data: { href: "https://world.openfoodfacts.org", label: "Open Food Facts" },
	avatars: {
		href: "https://www.dicebear.com/styles/critters/",
		label: "Critters di DiceBear",
	},
	code: {
		href: "https://github.com/MarinCervinschi/zuppapp",
		label: "Il codice è aperto su GitHub",
	},
} as const;

function Out({
	link,
	icon,
	className,
}: {
	link: { href: string; label: string };
	icon?: boolean;
	className?: string;
}) {
	return (
		<a
			href={link.href}
			target="_blank"
			rel="noopener noreferrer"
			className={cn("underline", icon && "inline-flex items-center gap-1", className)}
		>
			{link.label}
			{icon && <ExternalIcon className="size-4" />}
		</a>
	);
}

/** The credits in one small line, as a page's footer. */
export function CreditsLine({ className }: { className?: string }) {
	return (
		<p className={cn("text-small text-text-soft", className)}>
			Dati dei prodotti da <Out link={CREDITS.data} />, licenza ODbL. Avatar{" "}
			<Out link={CREDITS.avatars} />, CC0. <Out link={CREDITS.code} />.
		</p>
	);
}

/** The credits as a list, in the profile's sheet; the code link is the sheet's own button. */
export function CreditsList() {
	return (
		<ul className="text-body flex flex-col gap-3">
			<li>
				Dati dei prodotti da <Out link={CREDITS.data} icon />, licenza ODbL.
			</li>
			<li>
				Avatar <Out link={CREDITS.avatars} icon />, CC0.
			</li>
		</ul>
	);
}
