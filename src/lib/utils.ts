import { type ClassValue, clsx } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

// The type sizes of globals.css (--text-*). Unknown to tailwind-merge, `text-small` would pass
// for a colour, and a `text-on-field` after it would drop it.
const twMerge = extendTailwindMerge({
	extend: {
		theme: { text: ["small", "body", "lead", "title", "display", "wordmark"] },
	},
});

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}
