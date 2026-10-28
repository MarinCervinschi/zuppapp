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
 * (the heart). Fixed to the top, so both stay in reach however far the reader scrolls; only
 * the two buttons catch taps, the content shows between them.
 */
export function DetailBar({ action }: { action?: React.ReactNode }) {
	return (
		<div className="pointer-events-none fixed inset-x-0 top-0 z-30 pt-[max(1rem,env(safe-area-inset-top))]">
			<div className="mx-auto flex max-w-xl items-center justify-between px-4">
				<BackButton className="pointer-events-auto" />
				{action && <div className="pointer-events-auto">{action}</div>}
			</div>
		</div>
	);
}
