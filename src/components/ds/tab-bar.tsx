import { useEffect, useState } from "react";

import { useQuery } from "@tanstack/react-query";
import { Link, useRouterState } from "@tanstack/react-router";

import { userQueries } from "@/lib/user/queries";
import { cn } from "@/lib/utils";

import { BowlIcon, KeyIcon, PersonIcon, ScanIcon, TrophyIcon } from "./icons";

// Three places, always in reach of the thumb: the search, the ranking, and you. The scanner
// floats beside them in its own drop: an action, not a place. An admin gets a fourth, the admin.
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
];

const ADMIN_TAB = {
	to: "/admin",
	label: "Admin",
	match: (path: string) => path.startsWith("/admin"),
	icon: KeyIcon,
};

/**
 * The floating bar at the bottom of every screen: a pill of liquid glass, the current place
 * marked by a lighter drop that glides from tab to tab with a small overshoot, and the scanner
 * in a round drop of its own. Each is a link with `aria-current`, so it works before JavaScript.
 */
export function TabBar() {
	const path = useRouterState({ select: state => state.location.pathname });
	const { data } = useQuery(userQueries.viewer());
	const tabs = data?.viewer?.isAdmin ? [...TABS, ADMIN_TAB] : TABS;
	const admin = tabs.length > 3;
	const current = tabs.findIndex(tab => tab.match(path));
	const scanning = path.startsWith("/scansiona");
	const scrolledAway = useHideOnScroll();
	const typing = useTyping();
	const hidden = scrolledAway || typing;

	return (
		<nav
			aria-label="Sezioni"
			data-hidden={hidden}
			className={cn(
				"pointer-events-none fixed inset-x-0 bottom-0 z-40 flex items-center justify-center gap-2 px-3 pb-[max(1rem,env(safe-area-inset-bottom))]",
				// Out of the way while the reader scrolls down a list, back as soon as they scroll up;
				// out of the way while they type on a phone, where the keyboard pushes it over the
				// suggestions; and always back when the keyboard focus reaches it.
				"transition-[translate,opacity] duration-300 ease-[var(--ease-out-snap)] focus-within:translate-y-0 focus-within:opacity-100 data-[hidden=true]:translate-y-[calc(100%+1rem)] data-[hidden=true]:opacity-0 motion-reduce:translate-y-0 motion-reduce:data-[hidden=true]:opacity-100"
			)}
		>
			<ul
				className={cn(
					"glass pointer-events-auto relative grid rounded-full p-1.5",
					// Four tabs and the scanner need 352 px: below 360 the admin tab steps out (the
					// profile and the product page still lead there).
					admin ? "grid-cols-3 min-[360px]:grid-cols-4" : "grid-cols-3"
				)}
			>
				{current >= 0 && (
					<li
						aria-hidden
						style={{ translate: `${current * 100}% 0` }}
						className={cn(
							"bg-ground/80 dark:bg-ground-raised glass-drop absolute top-1.5 bottom-1.5 left-1.5 rounded-full transition-[translate] duration-500 ease-[cubic-bezier(0.34,1.45,0.5,1)] motion-reduce:transition-none",
							admin
								? "w-[calc((100%-0.75rem)/3)] min-[360px]:w-[calc((100%-0.75rem)/4)]"
								: "w-[calc((100%-0.75rem)/3)]",
							admin && current === 3 && "max-[359px]:hidden"
						)}
					/>
				)}
				{tabs.map((tab, index) => (
					<li
						key={tab.to}
						className={cn("relative", index === 3 && "max-[359px]:hidden")}
					>
						<Link
							to={tab.to}
							aria-current={index === current ? "page" : undefined}
							className={cn(
								"text-small flex min-h-14 flex-col items-center justify-center gap-0.5 rounded-full font-medium no-underline transition-[scale,opacity] duration-150 ease-out motion-safe:active:scale-[0.94] sm:w-24",
								// With four tabs, from 360 to 399 px the labels step down a size, or
								// «Classifica» would touch its neighbours.
								admin
									? "w-[4.25rem] min-[360px]:w-[3.75rem] min-[360px]:max-[399px]:text-[0.75rem] min-[360px]:max-[399px]:tracking-[-0.01em] min-[400px]:w-[4.5rem]"
									: "w-[4.25rem] min-[360px]:w-20",
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

// How far the page must move before the bar reacts, so a finger resting on the glass does not
// make it flicker; and how close to the top it always shows.
const SCROLL_SLACK_PX = 8;
const ALWAYS_NEAR_TOP_PX = 120;

/** True while the reader scrolls down past the top of the page; false as soon as they scroll up. */
function useHideOnScroll() {
	const [hidden, setHidden] = useState(false);
	const path = useRouterState({ select: state => state.location.pathname });

	// A new page starts with the bar in view.
	useEffect(() => setHidden(false), [path]);

	useEffect(() => {
		let last = window.scrollY;
		function update() {
			const y = window.scrollY;
			if (y < ALWAYS_NEAR_TOP_PX) setHidden(false);
			else if (y > last + SCROLL_SLACK_PX) setHidden(true);
			else if (y < last - SCROLL_SLACK_PX) setHidden(false);
			else return;
			last = y;
		}
		window.addEventListener("scroll", update, { passive: true });
		return () => window.removeEventListener("scroll", update);
	}, []);

	return hidden;
}

/**
 * True while a text field has the focus on a phone-sized or touch screen: the keyboard is up and
 * whatever opens under the field (the suggestions) needs the bottom of the screen.
 */
function useTyping() {
	const [typing, setTyping] = useState(false);

	useEffect(() => {
		const touch = window.matchMedia("(max-width: 63.99rem), (pointer: coarse)");
		function isTextField(target: EventTarget | null) {
			if (!(target instanceof HTMLElement)) return false;
			if (target.isContentEditable || target instanceof HTMLTextAreaElement)
				return true;
			return (
				target instanceof HTMLInputElement &&
				![
					"checkbox",
					"radio",
					"button",
					"submit",
					"reset",
					"range",
					"color",
					"file",
				].includes(target.type)
			);
		}
		function focusIn(event: FocusEvent) {
			if (touch.matches && isTextField(event.target)) setTyping(true);
		}
		function focusOut(event: FocusEvent) {
			// Moving from one field to the next keeps the keyboard up.
			if (!isTextField(event.relatedTarget)) setTyping(false);
		}
		document.addEventListener("focusin", focusIn);
		document.addEventListener("focusout", focusOut);
		return () => {
			document.removeEventListener("focusin", focusIn);
			document.removeEventListener("focusout", focusOut);
		};
	}, []);

	return typing;
}
