import { subtypeLabel } from "./labels";

/** «Esselunga • Vellutate • 500 g»: the line under a product's name, from what is known. */
export function productDetails(product: {
	brand: string | null;
	subtype: string | null;
	quantity?: string | null;
}) {
	return [
		product.brand,
		product.subtype && subtypeLabel(product.subtype),
		product.quantity,
	]
		.filter(Boolean)
		.join(" • ");
}
