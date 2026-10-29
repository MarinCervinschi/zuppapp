import type { LookupResult } from "@/lib/catalog/lookup";

// Custom events for Umami, counted next to the page views. Never anything that names a person
// (no user id, no email, no typed text): only what happened and to which product.

type Events = {
	/** A vote saved: `nuovo` on a product the reader hadn't voted, `primo` on their very first. */
	voto: { stelle: number; nuovo: boolean; primo: boolean; tag: number };
	/** What a scanned or typed code turned out to be. */
	scansione: { esito: LookupResult["kind"] | "importato" };
	segnalazione: { foto: number };
	preferito: { azione: "aggiunto" | "tolto" };
	/** The tap on «Accedi con Google»; whether the person then finishes is up to Google. */
	accesso: { anonimo: boolean; voti: number };
	ricerca_vuota: { filtri: number };
};

declare global {
	interface Window {
		umami?: { track: (name: string, data?: Record<string, unknown>) => void };
	}
}

/** Does nothing where the script isn't loaded: on the server, in local dev, behind a blocker. */
export function track<Name extends keyof Events>(name: Name, data: Events[Name]) {
	if (typeof window === "undefined") return;
	try {
		window.umami?.track(name, data);
	} catch {
		// Analytics never break the page.
	}
}
