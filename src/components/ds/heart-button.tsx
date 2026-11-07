import { useState } from "react";

import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

import { useSetFavorite } from "@/lib/favorites/mutations";
import { favoriteQueries } from "@/lib/favorites/queries";
import { userQueries } from "@/lib/user/queries";
import { cn } from "@/lib/utils";

/**
 * The heart that keeps a soup among the reader's favourites: a round glass button, outlined in ink
 * when off, filled tomato inside the same outline when on (the outline keeps it readable on any
 * glass, in both themes). Favourites belong to an account, so without one the heart
 * explains that and offers to sign in instead of saving anything.
 */
export function HeartButton({
	productId,
	name,
	size = "md",
	className,
}: {
	productId: string;
	/** The product's name, for the button's accessible name in a list of cards. */
	name: string;
	size?: "md" | "lg";
	className?: string;
}) {
	const navigate = useNavigate();
	const { data } = useQuery(userQueries.viewer());
	const signedIn = Boolean(data?.viewer && !data.viewer.isAnonymous);
	const { data: ids } = useQuery({ ...favoriteQueries.ids(), enabled: signedIn });
	const setFavorite = useSetFavorite();
	// Only a heart the reader just put on beats; the ones already on at load stay still.
	const [beat, setBeat] = useState(0);
	const on = signedIn && Boolean(ids?.includes(productId));

	function toggle(event: React.MouseEvent) {
		// On a card the heart sits over the photo: it must not open the photo or the product.
		event.preventDefault();
		event.stopPropagation();
		if (!signedIn) {
			toast("I preferiti si salvano nel tuo account.", {
				action: { label: "Accedi", onClick: () => navigate({ to: "/accedi" }) },
			});
			return;
		}
		setFavorite.mutate({ productId, on: !on });
		if (!on) {
			setBeat(n => n + 1);
			toast("Nei preferiti", {
				action: {
					label: "Vedili",
					onClick: () =>
						navigate({ to: "/le-mie-zuppe", search: { scheda: "preferite" } }),
				},
			});
		} else {
			// Taking a heart off is undone, not confirmed: in «Preferiti» the card leaves at once.
			toast("Tolta dai preferiti", {
				action: {
					label: "Rimettila",
					onClick: () => setFavorite.mutate({ productId, on: true }),
				},
			});
		}
	}

	return (
		<button
			type="button"
			aria-pressed={on}
			aria-label={`${name} tra i preferiti`}
			onClick={toggle}
			className={cn(
				"glass flex cursor-pointer items-center justify-center rounded-full transition-[scale] duration-150 ease-out motion-safe:active:scale-[0.96]",
				size === "lg" ? "size-12" : "size-11",
				className
			)}
		>
			<svg
				key={beat}
				aria-hidden
				viewBox="0 0 24 24"
				className={cn(
					size === "lg" ? "size-6" : "size-5",
					"text-text",
					beat > 0 && on && "motion-safe:animate-pop"
				)}
				fill={on ? "var(--soup-tomato)" : "none"}
				stroke="currentColor"
				strokeWidth="2"
				strokeLinejoin="round"
			>
				<path d="M12 20.5s-7.5-4.6-7.5-10.1A4.4 4.4 0 0 1 12 7.6a4.4 4.4 0 0 1 7.5 2.8c0 5.5-7.5 10.1-7.5 10.1Z" />
			</svg>
		</button>
	);
}
