import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";

import { KeyIcon } from "@/components/ds/icons";
import type { ProductCard } from "@/lib/catalog/types";
import { userQueries } from "@/lib/user/queries";
import { cn } from "@/lib/utils";

/**
 * For an admin only: the product in the admin, found by its EAN. Round on the product page's bar,
 * a row at the end of the soup's sheet.
 */
export function AdminShortcut({
	product,
	variant = "round",
}: {
	product: ProductCard;
	variant?: "round" | "row";
}) {
	const { data } = useQuery(userQueries.viewer());
	if (!data?.viewer?.isAdmin) return null;
	return (
		<Link
			to="/admin"
			search={{ stato: product.archived ? "archived" : "published", q: product.ean }}
			className={cn(
				"transition-[scale] duration-150 ease-out motion-safe:active:scale-[0.96]",
				variant === "round"
					? "glass flex size-12 items-center justify-center rounded-full"
					: "bg-ground-raised hover:bg-text/10 text-body flex min-h-12 items-center gap-3 rounded-full px-4 font-medium no-underline"
			)}
		>
			<KeyIcon className="size-6" />
			{variant === "round" ? (
				<span className="sr-only">Apri {product.name} nella gestione prodotti</span>
			) : (
				<span>
					Apri nella gestione prodotti
					<span className="sr-only">: {product.name}</span>
				</span>
			)}
		</Link>
	);
}
