import { cn } from "@/lib/utils";

// One icon per soup type, drawn on the same 24 px grid and 1.6 stroke as the app's line icons,
// each on a disc of its own soup colour. They name the type next to its word, never alone.

// Each disc with the colour of its icon: ink on the soups, which stay bright in both themes; the
// text colour on the raised paper, which turns dark at night.
const COLORS: Record<string, string> = {
	vellutata: "bg-soup-pumpkin text-[#16120f]",
	minestrone: "bg-soup-pea text-[#16120f]",
	legumi: "bg-soup-corn text-[#16120f]",
	passato: "bg-soup-tomato text-[#16120f]",
	cereali: "bg-soup-beet text-[#16120f]",
	brodo: "bg-[#cfe3f5] text-[#16120f]",
};

/** The disc of a type, background and icon colour; unknown types sit on the raised paper. */
export function subtypeColor(subtype: string | null) {
	return (subtype && COLORS[subtype]) || "bg-ground-raised text-text";
}

export function SubtypeIcon({
	subtype,
	className,
}: {
	/** null draws «Tutte»: four tiles. */
	subtype: string | null;
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
			{subtype === null ? (
				<>
					<rect x="4" y="4" width="7" height="7" rx="2" />
					<rect x="13" y="4" width="7" height="7" rx="2" />
					<rect x="4" y="13" width="7" height="7" rx="2" />
					<rect x="13" y="13" width="7" height="7" rx="2" />
				</>
			) : subtype === "vellutata" ? (
				<>
					<path d="M3 12h18a9 9 0 0 1-18 0Z" />
					<path d="M8.5 8.5c0-1.6 1.6-2.8 3.5-2.8s3.3 1.1 3.3 2.4c0 1.1-1 1.9-2.3 1.9-1.1 0-1.8-.6-1.8-1.4" />
				</>
			) : subtype === "minestrone" ? (
				<>
					<path d="M3 12h18a9 9 0 0 1-18 0Z" />
					<rect x="6.5" y="6" width="3.5" height="3.5" rx="0.8" />
					<circle cx="13.5" cy="8" r="1.8" />
					<path d="M16.5 9.5 18 5.5" />
				</>
			) : subtype === "legumi" ? (
				<>
					<path d="M5.5 10.5c-1.8-1.6-1.4-4.6 1-5.4 1.6-.5 2.7.6 2.6 1.9-.1 1 .6 1.6 1.4 2.1 1.4 .9.9 3-1 3.2-1.5.2-2.8-.7-4-1.8Z" />
					<path d="M13.5 19.5c-2.3.5-4.3-1.8-3.3-4.1.7-1.5 2.3-1.7 3.2-.8.7.7 1.6.6 2.4.3 1.6-.6 2.8 1.2 1.6 2.7-.9 1.1-2.3 1.6-3.9 1.9Z" />
					<path d="M15.5 9c-.3-2.4 2-4.3 4.2-3.4 1.5.6 1.7 2.2.8 3.1-.7.7-.7 1.6-.4 2.4.6 1.6-1.2 2.8-2.7 1.6-1.1-.9-1.7-2.2-1.9-3.7Z" />
				</>
			) : subtype === "passato" ? (
				<>
					<path d="M3 9h13a6.5 6.5 0 0 1-13 0Z" />
					<path d="M16 9l5-2.5" />
					<path d="M7 12h.01M9.5 14h.01M12 12h.01M9.5 10.5h.01" />
					<path d="M9.5 18.5v2" />
				</>
			) : subtype === "cereali" ? (
				<>
					<path d="M12 21V7" />
					<path d="M12 11c-2.2 0-3.8-1.6-3.8-3.8 2.2 0 3.8 1.6 3.8 3.8ZM12 11c2.2 0 3.8-1.6 3.8-3.8-2.2 0-3.8 1.6-3.8 3.8ZM12 15.5c-2.2 0-3.8-1.6-3.8-3.8 2.2 0 3.8 1.6 3.8 3.8ZM12 15.5c2.2 0 3.8-1.6 3.8-3.8-2.2 0-3.8 1.6-3.8 3.8ZM12 7c-1-1-1-2.8 0-4 1 1.2 1 3 0 4Z" />
				</>
			) : (
				// A broth, or a type we have no picture for: the bowl with its steam.
				<>
					<path d="M3 12h18a9 9 0 0 1-18 0Z" />
					<path d="M9 4c-.6.8-.6 1.7 0 2.5s.6 1.7 0 2.5M15 4c-.6.8-.6 1.7 0 2.5s.6 1.7 0 2.5" />
				</>
			)}
		</svg>
	);
}
