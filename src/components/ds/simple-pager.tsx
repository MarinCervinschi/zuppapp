/**
 * «‹ Indietro · Pagina 2 di 5 · Avanti ›»: the short way through a list's pages, the same words as
 * the catalogue's pagination. Each page builds its own link (`link(page, children)`), so the
 * address stays typed for its route.
 */
export function SimplePager({
	page,
	pageCount,
	link,
}: {
	page: number;
	pageCount: number;
	link: (page: number, children: React.ReactNode, className: string) => React.ReactNode;
}) {
	if (pageCount <= 1) return null;
	const className = "text-body min-h-11 content-center font-medium underline";
	return (
		<nav aria-label="Pagine" className="flex items-center justify-between gap-3">
			{page > 1 ? link(page - 1, "‹ Indietro", className) : <span />}
			<p className="text-small text-text-soft tabular-nums">
				Pagina {page} di {pageCount}
			</p>
			{page < pageCount ? link(page + 1, "Avanti ›", className) : <span />}
		</nav>
	);
}
