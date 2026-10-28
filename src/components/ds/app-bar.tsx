import { useEffect, useState } from "react";

import { useRouter } from "@tanstack/react-router";

import { cn } from "@/lib/utils";

/**
 * The way back on an inner page: a round button floating over the top left corner. It goes
 * back in history when there is one, to the soups otherwise (a shared link opened cold).
 */
export function BackButton({ className }: { className?: string }) {
	const router = useRouter();
	return (
		<button
			type="button"
			onClick={() =>
				window.history.length > 1 ? router.history.back() : router.navigate({ to: "/" })
			}
			className={cn(
				"glass flex size-12 items-center justify-center rounded-full transition-[scale] duration-150 ease-out motion-safe:active:scale-[0.96]",
				className
			)}
		>
			<svg
				aria-hidden
				viewBox="0 0 24 24"
				className="size-6"
				fill="none"
				stroke="currentColor"
				strokeWidth="2"
				strokeLinecap="round"
				strokeLinejoin="round"
			>
				<path d="M15 5l-7 7 7 7" />
			</svg>
			<span className="sr-only">Indietro</span>
		</button>
	);
}

/**
 * The bar of a detail page: the way back on the left and the page's own action on the right
 * (the heart). Fixed to the top, so both stay in reach however far the reader scrolls. Over the
 * photo it is clear; once the page scrolls under it, a frosted band of paper fades in behind
 * the buttons, so they float on it instead of on whatever text passes beneath. Only the two
 * buttons catch taps.
 */
export function DetailBar({ action }: { action?: React.ReactNode }) {
	const [scrolled, setScrolled] = useState(false);

	useEffect(() => {
		const update = () => setScrolled(window.scrollY > 24);
		update();
		window.addEventListener("scroll", update, { passive: true });
		return () => window.removeEventListener("scroll", update);
	}, []);

	return (
		<div className="pointer-events-none fixed inset-x-0 top-0 z-30 pt-[max(1rem,env(safe-area-inset-top))] pb-5">
			<div
				aria-hidden
				className={cn(
					"glass-band absolute inset-0 -z-10 transition-opacity duration-300 ease-out",
					scrolled ? "opacity-100" : "opacity-0"
				)}
			/>
			<div className="mx-auto flex max-w-xl items-center justify-between px-4">
				<BackButton className="pointer-events-auto" />
				{action && <div className="pointer-events-auto">{action}</div>}
			</div>
		</div>
	);
}
