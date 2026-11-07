import { Link } from "@tanstack/react-router";

import { subtypeLabel } from "@/lib/catalog/labels";
import { EXACT_SEARCH } from "@/lib/catalog/schemas";
import type { FacetValue } from "@/lib/catalog/types";
import { cn } from "@/lib/utils";

import { SubtypeIcon, subtypeColor } from "./type-icons";

type Props = {
	/** The page the links filter: the shelf or the ranking. */
	route: "/" | "/classifica";
	current: string | undefined;
	subtypes: FacetValue[];
	/** What «Tutte» counts; without it no disc shows a count (the ranking counts places, not soups). */
	total?: number;
	className?: string;
};

/**
 * The types as a row of coloured discs with their icon, «Tutte» first: the one filter most
 * people use, in reach of the thumb. It scrolls sideways on a phone and wraps on a wide screen.
 * Each disc is a link, so it works before JavaScript and the back button undoes it.
 */
export function TypeRail({ route, current, subtypes, total, className }: Props) {
	const options = [{ value: null, count: total ?? 0 }, ...subtypes];

	// The row scrolls, so it clips what sticks out: py-2 (undone by the nav's -my-2) leaves room
	// for the focus ring around each disc.
	return (
		<nav aria-label="Tipo" className={cn("fade-x -mx-4 -my-2 lg:mx-0", className)}>
			<ul className="flex snap-x snap-mandatory scroll-px-4 [scrollbar-width:none] gap-3 overflow-x-auto px-4 py-2 lg:flex-wrap lg:overflow-visible lg:px-0 [&::-webkit-scrollbar]:hidden">
				{options.map(({ value, count }) => {
					const active = (current ?? null) === value;
					return (
						<li key={value ?? "tutte"} className="snap-start">
							<Link
								to={route}
								activeOptions={EXACT_SEARCH}
								search={prev => ({
									...prev,
									tipo: active || value === null ? undefined : value,
									pagina: undefined,
									posti: undefined,
								})}
								resetScroll={false}
								aria-current={active ? "true" : undefined}
								className="group flex w-[4.5rem] flex-col items-center gap-1 no-underline"
							>
								<span
									className={cn(
										"grid size-16 place-items-center rounded-full transition-[scale,box-shadow] duration-200 ease-[var(--ease-out-snap)] motion-safe:group-active:scale-[0.92]",
										value === null
											? active
												? "bg-text text-ground"
												: "bg-ground-raised text-text"
											: subtypeColor(value),
										// The chosen disc gets a ring in the text colour, so it is told by shape too.
										active &&
											value !== null &&
											"ring-text ring-offset-ground ring-[3px] ring-offset-2"
									)}
								>
									<SubtypeIcon
										subtype={value}
										className="size-8 transition-transform duration-300 ease-[var(--ease-out-snap)] motion-safe:group-hover:-rotate-6"
									/>
								</span>
								<span
									className={cn(
										"text-small text-center leading-tight",
										active ? "font-semibold" : "font-medium"
									)}
								>
									{value === null ? "Tutte" : subtypeLabel(value)}
									{active && value !== null && (
										<span className="sr-only">: tocca per togliere il filtro</span>
									)}
								</span>
								{total !== undefined && (
									<span className="text-text-soft -mt-1 text-[0.75rem] tabular-nums">
										{count}
									</span>
								)}
							</Link>
						</li>
					);
				})}
			</ul>
		</nav>
	);
}
