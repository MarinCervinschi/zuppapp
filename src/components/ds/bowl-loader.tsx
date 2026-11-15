import { useEffect, useState } from "react";

import { useRouterState } from "@tanstack/react-router";

import { cn } from "@/lib/utils";

/** The bowl of the icon, seen from above: a pumpkin soup with a cream swirl. Animated by its class. */
export function Bowl({ className }: { className?: string }) {
	return (
		<svg viewBox="0 0 32 32" aria-hidden className={className}>
			<circle cx="16" cy="16" r="13.5" fill="var(--ink)" />
			<circle cx="16" cy="16" r="10" fill="var(--soup-pumpkin)" />
			<path
				d="M15 16a1 1 0 1 1 2 0a3.2 3.2 0 1 1-6.4 0a5.5 5.5 0 1 1 11 0"
				pathLength={1}
				fill="none"
				stroke="var(--on-ink)"
				strokeWidth="2"
				strokeLinecap="round"
			/>
		</svg>
	);
}

/**
 * The app's one loader: the bowl with its swirl stirring round and drawing itself in and out.
 * Decoration only: whoever shows it says in words what is on its way.
 */
export function BowlLoader({ className }: { className?: string }) {
	return <Bowl className={cn("bowl-loader size-8 shrink-0", className)} />;
}

/** How long a page may take before the bowl shows up: a quick one never flashes it. */
const NAVIGATION_GRACE_MS = 400;

/**
 * In the root layout: while the next page (or the same page with new filters) is loading, a
 * bowl of glass at the top. Nothing marks a slow page otherwise, since the old one stays up.
 */
export function NavigationLoader() {
	const loading = useRouterState({ select: state => state.status === "pending" });
	const [shown, setShown] = useState(false);

	useEffect(() => {
		if (!loading) {
			setShown(false);
			return;
		}
		const timer = setTimeout(() => setShown(true), NAVIGATION_GRACE_MS);
		return () => clearTimeout(timer);
	}, [loading]);

	return (
		<div
			role="status"
			className="pointer-events-none fixed inset-x-0 top-[max(0.75rem,env(safe-area-inset-top))] z-50 flex justify-center"
		>
			{shown && (
				<span className="glass motion-safe:animate-zoom relative grid size-12 place-items-center rounded-full">
					<BowlLoader className="size-8" />
					<span className="sr-only">Carico la pagina…</span>
				</span>
			)}
		</div>
	);
}
