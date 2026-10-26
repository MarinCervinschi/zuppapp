import { ean13CheckDigit } from "@/lib/barcode/ean13";

/**
 * The number printed on a voter's Zuppapp card: a shop-internal EAN-13 (prefix 2, the range
 * loyalty cards really use), derived from the user id so the same voter always gets the same
 * card. It names nobody outside Zuppapp, which is the point of the 2 prefix.
 */
export function loyaltyCode(userId: string): string {
	let hash = 2166136261;
	for (const char of userId) {
		hash ^= char.charCodeAt(0);
		hash = Math.imul(hash, 16777619) >>> 0;
	}
	const digits = `2${String(hash).padStart(11, "0").slice(-11)}`;
	return digits + ean13CheckDigit(digits);
}
