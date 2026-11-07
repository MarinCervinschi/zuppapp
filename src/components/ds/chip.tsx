import { cn } from "@/lib/utils";

import { CloseIcon } from "./icons";

// Filter chips and the search field's clear button, the same in the catalogue and in the admin.

/** A filter chip, a link or a button; `chipOn` when it is chosen, `chipOff` when not. */
export const chip =
	"text-body inline-flex min-h-11 items-center gap-2 rounded-full px-4 no-underline transition-[background-color,color] duration-150";
export const chipOn = "bg-text text-ground";
// A tint of the ink, not a surface: it reads on the page (sidebar) and on a sheet alike.
export const chipOff = "bg-text/[0.06] hover:bg-text/10";

/** The text input of a search field: borderless, the field's pill is its wrapper. */
export const searchInput =
	"text-text text-body placeholder:text-text-soft min-h-12 w-full min-w-0 bg-transparent outline-none [&::-webkit-search-cancel-button]:hidden";

/** The × that empties a search field. Pressing it must not blur the field first (`onMouseDown`). */
export function ClearSearchButton({
	onClick,
	className,
}: {
	onClick: () => void;
	className?: string;
}) {
	return (
		<button
			type="button"
			onMouseDown={event => event.preventDefault()}
			onClick={onClick}
			className={cn(
				"hover:bg-text/10 grid size-11 shrink-0 place-items-center rounded-full transition-[scale] duration-150 motion-safe:active:scale-[0.94]",
				className
			)}
		>
			<CloseIcon className="size-5" />
			<span className="sr-only">Svuota la ricerca</span>
		</button>
	);
}
