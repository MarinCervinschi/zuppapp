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
				"glass flex size-12 items-center justify-center rounded-full transition-[scale] duration-150 ease-out motion-safe:active:scale-[0.92]",
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
