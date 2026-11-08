import { Link, createFileRoute } from "@tanstack/react-router";

import { DocSection } from "@/components/ds/doc-section";
import { PageHead } from "@/components/ds/page-head";

// The notice of GDPR art. 13, and nothing more: who, what and why, who else sees it, for how long,
// your rights. It must stay true to the code: new personal data changes it in the same commit.

const CONTACT = "privacy@zuppapp.fun"; // check-public: allow

export const Route = createFileRoute("/privacy")({
	head: () => ({ meta: [{ title: "Privacy · Zuppapp" }] }),
	component: Privacy,
});

function Privacy() {
	return (
		<>
			<PageHead title="Privacy" back="/">
				Zuppapp sa poco di te. Ecco cosa, e perché.
			</PageHead>
			<main className="mx-auto flex max-w-xl flex-col gap-10 px-4 pb-16">
				<DocSection title="Chi">
					<p>
						Zuppapp è un progetto personale di Marin Cervinschi, titolare dei dati. Per
						qualsiasi richiesta: <a href={`mailto:${CONTACT}`}>{CONTACT}</a>.
					</p>
				</DocSection>

				<DocSection title="Cosa e perché">
					<ul>
						<li>
							<strong>I tuoi voti e i tag</strong>, legati a un cookie del browser,
							anche senza account. Servono a darti il servizio (art. 6.1.b GDPR).
						</li>
						<li>
							<strong>Con l’accesso Google</strong>: nome ed email, che non mostriamo a
							nessuno, il nome che scegli, i preferiti e le zuppe che ci segnali. Le
							foto delle segnalazioni le cancelliamo appena le abbiamo lette (art.
							6.1.b).
						</li>
						<li>
							<strong>Indirizzo IP e browser</strong>, per bloccare abusi e voti
							automatici: è il nostro interesse a tenere l’app sicura (art. 6.1.f).
						</li>
					</ul>
					<p>Niente è obbligatorio: puoi votare anche senza account.</p>
				</DocSection>

				<DocSection title="Chi altro li vede">
					<p>
						Solo Google, se accedi con il tuo account. Google può trattarli anche negli
						Stati Uniti, con le garanzie del Data Privacy Framework. I nostri server
						sono nell’Unione Europea.
					</p>
				</DocSection>

				<DocSection title="Per quanto">
					<p>
						Finché hai l’account. Quando lo elimini cancelliamo tutto; i voti restano
						nella classifica, senza alcun legame con te.
					</p>
				</DocSection>

				<DocSection title="I tuoi diritti">
					<p>
						Puoi chiederci di vedere, correggere, cancellare o portare via i tuoi dati,
						e opporti al loro uso. L’account lo elimini da solo dal{" "}
						<Link to="/profilo">profilo</Link>. Puoi anche fare reclamo al{" "}
						<a
							href="https://www.garanteprivacy.it"
							target="_blank"
							rel="noopener noreferrer"
						>
							Garante privacy
						</a>
						.
					</p>
				</DocSection>

				<p className="text-small text-text-soft">Aggiornata il 15 novembre 2026.</p>
			</main>
		</>
	);
}
