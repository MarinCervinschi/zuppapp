import { Link, useRouterState } from "@tanstack/react-router";

import { cn } from "@/lib/utils";

// Three places, always in reach of the thumb: the search, the ranking, and you. The scanner
// floats beside them in its own drop: an action, not a place.
const TABS = [
	{
		to: "/",
		label: "Zuppe",
		match: (path: string) => path === "/" || path.startsWith("/prodotti"),
		icon: BowlIcon,
	},
	{
		to: "/classifica",
		label: "Classifica",
		match: (path: string) => path.startsWith("/classifica"),
		icon: TrophyIcon,
	},
	{
		to: "/profilo",
		label: "Profilo",
		match: (path: string) =>
			["/profilo", "/accedi", "/le-mie-zuppe", "/preferiti"].some(p =>
				path.startsWith(p)
			),
		icon: PersonIcon,
	},
] as const;

/**
 * The floating bar at the bottom of every screen: a pill of liquid glass, the current place
 * marked by a lighter drop that glides from tab to tab with a small overshoot, and the scanner
 * in a round drop of its own. Each is a link with `aria-current`, so it works before JavaScript.
 */
export function TabBar() {
	const path = useRouterState({ select: state => state.location.pathname });
	const current = TABS.findIndex(tab => tab.match(path));
	const scanning = path.startsWith("/scansiona");

	return (
		<nav
			aria-label="Sezioni"
			className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex items-center justify-center gap-2 px-3 pb-[max(1rem,env(safe-area-inset-bottom))]"
		>
			<ul className="glass pointer-events-auto relative grid grid-cols-3 rounded-full p-1.5">
				{current >= 0 && (
					<li
						aria-hidden
						style={{ translate: `${current * 100}% 0` }}
						className="bg-ground/80 dark:bg-ground-raised glass-drop absolute top-1.5 bottom-1.5 left-1.5 w-[calc((100%-0.75rem)/3)] rounded-full transition-[translate] duration-500 ease-[cubic-bezier(0.34,1.45,0.5,1)] motion-reduce:transition-none"
					/>
				)}
				{TABS.map((tab, index) => (
					<li key={tab.to} className="relative">
						<Link
							to={tab.to}
							aria-current={index === current ? "page" : undefined}
							className={cn(
								"text-small flex min-h-14 w-[4.25rem] flex-col items-center justify-center gap-0.5 rounded-full font-medium no-underline transition-[scale,opacity] duration-150 ease-out motion-safe:active:scale-[0.94] min-[360px]:w-20 sm:w-24",
								index === current ? "opacity-100" : "opacity-75 hover:opacity-100"
							)}
						>
							<tab.icon className="size-6" />
							{tab.label}
						</Link>
					</li>
				))}
			</ul>
			{/* The glass on a wrapper, as on the pill: the link itself stays a flat target. */}
			<div className="glass pointer-events-auto relative size-[4.25rem] shrink-0 rounded-full">
				<Link
					to="/scansiona"
					aria-current={scanning ? "page" : undefined}
					className="grid size-full place-items-center rounded-full transition-[scale] duration-150 ease-out motion-safe:active:scale-[0.94]"
				>
					{scanning && (
						<span
							aria-hidden
							className="bg-ground/80 dark:bg-ground-raised glass-drop absolute inset-1.5 rounded-full"
						/>
					)}
					<ScanIcon className="relative size-7" />
					<span className="sr-only">Scansiona un codice a barre</span>
				</Link>
			</div>
		</nav>
	);
}

type IconProps = { className?: string };

function BowlIcon({ className }: IconProps) {
	return (
		<svg
			aria-hidden
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="1.6"
			strokeLinecap="round"
			strokeLinejoin="round"
			className={className}
		>
			<path d="M3 12h18a9 9 0 0 1-18 0Z" />
			<path d="M8 20h8" />
			<path d="M8 4c-.6.8-.6 1.7 0 2.5s.6 1.7 0 2.5M12 3c-.6.8-.6 1.7 0 2.5s.6 1.7 0 2.5M16 4c-.6.8-.6 1.7 0 2.5s.6 1.7 0 2.5" />
		</svg>
	);
}

function TrophyIcon({ className }: IconProps) {
	return (
		<svg
			aria-hidden
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="1.6"
			strokeLinecap="round"
			strokeLinejoin="round"
			className={className}
		>
			<path d="M7 4h10v5a5 5 0 0 1-10 0V4Z" />
			<path d="M7 6H4.5a2.5 2.5 0 0 0 2.6 3.4M17 6h2.5a2.5 2.5 0 0 1-2.6 3.4" />
			<path d="M12 14v4M8.5 20h7" />
		</svg>
	);
}

function PersonIcon({ className }: IconProps) {
	return (
		<svg
			aria-hidden
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="1.6"
			strokeLinecap="round"
			strokeLinejoin="round"
			className={className}
		>
			<circle cx="12" cy="8" r="4" />
			<path d="M4.5 21a7.5 7.5 0 0 1 15 0" />
		</svg>
	);
}

function ScanIcon({ className }: IconProps) {
	return (
		<svg
			aria-hidden
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="1.6"
			strokeLinecap="round"
			strokeLinejoin="round"
			className={className}
		>
			<path d="M3 8V5.5A2.5 2.5 0 0 1 5.5 3H8M16 3h2.5A2.5 2.5 0 0 1 21 5.5V8M21 16v2.5a2.5 2.5 0 0 1-2.5 2.5H16M8 21H5.5A2.5 2.5 0 0 1 3 18.5V16" />
			<path d="M7.5 8v8M10.5 8v8M13.5 8v8M16.5 8v8" />
		</svg>
	);
}
