import { useState } from "react";

import { Bowl } from "@/components/ds/bowl-loader";

// The home's opening: the bowl of the icon on corn yellow, its cream swirl drawing itself, then
// the yellow closes in on the bowl and leaves the page, rendered underneath all along. Only on
// the first page of a visit, and only when that page is the home (DESIGN.md, «Intro»).

const INTRO_KEY = "zuppapp-intro";

/**
 * Runs in <head> on every page: the first page of a visit marks the visit, and any later load
 * (a reload, the home after another page) hides the intro before it paints. Plain ES5 with a
 * try: a private window may refuse sessionStorage, and then the intro just plays again.
 */
export const INTRO_INIT_SCRIPT = `(function(){try{if(sessionStorage.getItem("${INTRO_KEY}"))document.documentElement.setAttribute("data-intro","seen");else sessionStorage.setItem("${INTRO_KEY}","1");}catch(e){}})();`;

export function Intro() {
	// Only the page the server sent carries it: hydration finds it in the document, while a
	// later visit to the home inside the app does not, and renders nothing.
	const [shown, setShown] = useState(
		() => typeof document === "undefined" || document.getElementById("intro") !== null
	);
	if (!shown) return null;

	return (
		// The animation hides it by itself, so it never stays if the script fails; a tap ends it.
		<div
			id="intro"
			aria-hidden
			className="intro"
			onPointerDown={() => setShown(false)}
			onAnimationEnd={event => {
				if (event.target === event.currentTarget) setShown(false);
			}}
		>
			<Bowl className="intro-bowl" />
		</div>
	);
}
