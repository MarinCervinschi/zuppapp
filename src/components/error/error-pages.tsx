import { Link } from "@tanstack/react-router";

import { BowlFace } from "@/components/brand/bowl-face";
import { AppBar } from "@/components/ds/app-bar";

function Page({ title, text }: { title: string; text: string }) {
	return (
		<>
			<AppBar />
			<main className="mx-auto flex max-w-xl flex-col items-start gap-5 px-4 pt-10 pb-16">
				<BowlFace score={1} className="text-bowl-ink size-20" />
				<h1 className="font-condensed text-title font-black uppercase">{title}</h1>
				<p className="text-body">{text}</p>
				<Link
					to="/"
					className="bg-text text-ground text-body inline-flex min-h-12 items-center px-5 font-semibold no-underline"
				>
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
