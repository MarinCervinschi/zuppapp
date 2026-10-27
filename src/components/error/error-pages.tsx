import { Link } from "@tanstack/react-router";

import { buttonClass } from "@/components/ds/button";
import { PageHead } from "@/components/ds/page-head";

function Page({ title, text }: { title: string; text: string }) {
	return (
		<>
			<PageHead blob="tomato" title={title}>
				<p>{text}</p>
			</PageHead>
			<main className="flex justify-center px-4">
				<Link to="/" className={buttonClass("ink")}>
					Tutte le zuppe
				</Link>
			</main>
		</>
	);
}

export function NotFoundPage() {
	return (
		<Page
			title="Questa zuppa non c’è"
			text="Il codice non corrisponde a nessun prodotto sullo scaffale. Forse è stato tolto, o il link è incompleto."
		/>
	);
}

export function ErrorPage() {
	return (
		<Page
			title="Qualcosa è andato storto"
			text="Non siamo riusciti a caricare la pagina. Ricaricala tra un momento, o torna a tutte le zuppe."
		/>
	);
}
