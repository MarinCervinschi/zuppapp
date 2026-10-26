// Client only. Asks Cloudflare Turnstile for a token before an anonymous voter is created;
// with no site key configured it returns null and the server does not ask for one.

type Turnstile = {
	render: (
		container: HTMLElement,
		options: {
			sitekey: string;
			execution: "execute";
			appearance: "interaction-only";
			callback: (token: string) => void;
			"error-callback": () => void;
		}
	) => string;
	execute: (widgetId: string) => void;
	remove: (widgetId: string) => void;
};

declare global {
	interface Window {
		turnstile?: Turnstile;
	}
}

const SCRIPT_URL =
	"https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

let loading: Promise<Turnstile> | null = null;

function loadTurnstile(): Promise<Turnstile> {
	if (window.turnstile) return Promise.resolve(window.turnstile);
	loading ??= new Promise((resolve, reject) => {
		const script = document.createElement("script");
		script.src = SCRIPT_URL;
		script.async = true;
		script.onload = () =>
			window.turnstile ? resolve(window.turnstile) : reject(new Error("Turnstile"));
		script.onerror = () => {
			loading = null;
			reject(new Error("Turnstile non raggiungibile"));
		};
		document.head.appendChild(script);
	});
	return loading;
}

export async function turnstileToken(): Promise<string | null> {
	const sitekey = import.meta.env.VITE_TURNSTILE_SITE_KEY as string | undefined;
	if (!sitekey) return null;

	const turnstile = await loadTurnstile();
	const container = document.createElement("div");
	container.style.position = "fixed";
	container.style.bottom = "1rem";
	container.style.right = "1rem";
	container.style.zIndex = "50";
	document.body.appendChild(container);

	try {
		return await new Promise<string>((resolve, reject) => {
			const widgetId = turnstile.render(container, {
				sitekey,
				execution: "execute",
				// Shows itself only if Cloudflare wants a click.
				appearance: "interaction-only",
				callback: resolve,
				"error-callback": () => reject(new Error("Verifica anti-bot non riuscita")),
			});
			turnstile.execute(widgetId);
		});
	} finally {
		container.remove();
	}
}
