import { cn } from "@/lib/utils";

// One icon per allergen of the filters, on the app's 24 px grid and 1.6 stroke. Always next to its
// word: the icon helps the eye find it, the word says it.

export function AllergenIcon({
	allergen,
	className,
}: {
	allergen: string;
	className?: string;
}) {
	return (
		<svg
			aria-hidden
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="1.6"
			strokeLinecap="round"
			strokeLinejoin="round"
			className={cn("shrink-0", className)}
		>
			{allergen === "glutine" ? (
				// A spike of wheat.
				<path d="M12 21V8M12 11.5c-2 0-3.4-1.4-3.4-3.4 2 0 3.4 1.4 3.4 3.4ZM12 11.5c2 0 3.4-1.4 3.4-3.4-2 0-3.4 1.4-3.4 3.4ZM12 16c-2 0-3.4-1.4-3.4-3.4 2 0 3.4 1.4 3.4 3.4ZM12 16c2 0 3.4-1.4 3.4-3.4-2 0-3.4 1.4-3.4 3.4ZM12 8c-.9-.9-.9-2.6 0-3.8.9 1.2.9 2.9 0 3.8Z" />
			) : allergen === "latte" ? (
				// A carton of milk.
				<>
					<path d="M8 8.5 10 4h4l2 4.5V20a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1V8.5Z" />
					<path d="M8 8.5h8M8 13h8" />
				</>
			) : allergen === "sedano" ? (
				// Stalks of celery with their leaves.
				<>
					<path d="M9 21c0-4 .5-8 1-11M12 21V10M15 21c0-4-.5-8-1-11" />
					<path d="M10 10c-1.5-.5-2.5-2-2-3.5 1.5 0 2.5 1 2 3.5ZM12 10c-1-1.3-1-3.2 0-4.5 1 1.3 1 3.2 0 4.5ZM14 10c1.5-.5 2.5-2 2-3.5-1.5 0-2.5 1-2 3.5Z" />
				</>
			) : allergen === "soia" ? (
				// A soy pod with its beans.
				<>
					<path d="M5 17c1-6 6-11 13-12 .8 0 1.3.6 1 1.4C17 13 12 17.5 6.3 18.4c-.8.1-1.4-.6-1.3-1.4Z" />
					<circle cx="9.5" cy="14.5" r="1.3" />
					<circle cx="12.5" cy="11.5" r="1.3" />
					<circle cx="15.5" cy="8.5" r="1.3" />
				</>
			) : allergen === "uova" ? (
				// An egg.
				<path d="M12 3.5c3.3 0 6 5 6 9.5a6 6 0 0 1-12 0c0-4.5 2.7-9.5 6-9.5Z" />
			) : (
				// A hazelnut, for the nuts.
				<>
					<path d="M12 21c-3.6 0-6-2.6-6-6 0-2.5 1.6-4.5 6-4.5s6 2 6 4.5c0 3.4-2.4 6-6 6Z" />
					<path d="M6.5 11.5c.5-3.5 2.8-6 5.5-6s5 2.5 5.5 6M12 5.5V3.5" />
				</>
			)}
		</svg>
	);
}
