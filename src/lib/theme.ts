// The reader's theme: "system" follows the device, "light" and "dark" pin it. Kept in this
// browser only: it is a preference of the screen, not of the account.

export type ThemeChoice = "system" | "light" | "dark";

export const THEME_KEY = "zuppapp-theme";
export const THEME_EVENT = "zuppapp-theme-change";

/**
 * Runs in <head> before the first paint, so a pinned theme never flashes the other one.
 * Plain ES5 with a try: private windows may refuse localStorage.
 */
export const THEME_INIT_SCRIPT = `(function(){try{var t=localStorage.getItem("${THEME_KEY}");if(t==="light"||t==="dark")document.documentElement.setAttribute("data-theme",t);}catch(e){}})();`;

export function readTheme(): ThemeChoice {
	try {
		const value = localStorage.getItem(THEME_KEY);
		return value === "light" || value === "dark" ? value : "system";
	} catch {
		return "system";
	}
}

/**
 * Applies a choice at once. Every colour transition is switched off for one frame, or each
 * would animate on its own and the page would smear from one theme into the other.
 */
export function applyTheme(choice: ThemeChoice) {
	try {
		if (choice === "system") localStorage.removeItem(THEME_KEY);
		else localStorage.setItem(THEME_KEY, choice);
	} catch {
		// The choice still applies to this page; it just won't be remembered.
	}

	const root = document.documentElement;
	const freeze = document.createElement("style");
	freeze.textContent = "*,*::before,*::after{transition:none!important}";
	document.head.appendChild(freeze);

	if (choice === "system") root.removeAttribute("data-theme");
	else root.setAttribute("data-theme", choice);

	// Force the style flush, then let transitions back on the next frame.
	void getComputedStyle(root).color;
	requestAnimationFrame(() => freeze.remove());

	// Every switch on the page shows the new choice (the footer's and the profile's).
	window.dispatchEvent(new CustomEvent<ThemeChoice>(THEME_EVENT, { detail: choice }));
}
