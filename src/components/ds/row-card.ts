// A row a thumb can press, as in the ranking, «Le tue zuppe» and the admin: one raised card, its
// columns set by the caller, and its name stretched over the whole card as the one link.

/** The card itself; add `grid-cols-[…]`, and the background unless it changes (selected rows). */
export const rowCard =
	"group relative grid items-center gap-3 rounded-[1.5rem] p-2 pr-3 transition-[scale,background-color] duration-200 ease-[var(--ease-out-snap)] motion-safe:active:scale-[0.98]";

/** Its usual background. */
export const rowCardGround = "bg-ground-raised hover:bg-text/[0.06]";

/** The name, a link (or button) whose box covers the card: the whole row is the target. */
export const rowCardLink =
	"font-display text-body font-medium no-underline group-hover:underline after:absolute after:inset-0 after:rounded-[1.5rem]";
