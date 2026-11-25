// The first visit ever opens on the presentation instead of the home (DESIGN.md, «La presentazione»).

export const PRESENTED_KEY = "zuppapp-presentazione";

/** Search engines and link previews read the home, never the presentation. */
const BOT =
	"bot|crawl|spider|slurp|preview|facebookexternalhit|embedly|lighthouse|headless";

/**
 * Runs in <head> before the first paint, only for a visitor without a session (who has voted
 * or signed in has been here). The first page of all marks the browser; if that page is the bare
 * home, it is replaced by /presentazione, so «back» leaves the site as it would have. A filtered
 * home, a shared soup, a crawler or a test browser stay where they are. Plain ES5 with a try: a
 * private window may refuse localStorage, and then nothing happens.
 */
export const FIRST_VISIT_SCRIPT = `(function(){try{if(localStorage.getItem("${PRESENTED_KEY}"))return;localStorage.setItem("${PRESENTED_KEY}","1");if(location.pathname!=="/"||location.search||navigator.webdriver||/${BOT}/i.test(navigator.userAgent))return;location.replace("/presentazione");}catch(e){}})();`;
