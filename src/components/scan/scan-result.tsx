import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";

import { buttonClass } from "@/components/ds/button";
import { PackPhoto } from "@/components/ds/pack-photo";
import { catalogQueries } from "@/lib/catalog/queries";
import { userQueries } from "@/lib/user/queries";

import { ReportForm } from "./report-form";

const heading = "font-display text-lead font-medium";

/** What a code turned out to be, when it isn't a product page to open: always with a way on. */
export function ScanResult({ ean }: { ean: string }) {
	const { data: result } = useSuspenseQuery(catalogQueries.lookup(ean));
	const { data: viewer } = useQuery(userQueries.viewer());
	const signedIn = Boolean(viewer?.viewer && !viewer.viewer.isAnonymous);

	return (
		<div className="flex flex-col gap-6">
			<p className="text-small text-text-soft">EAN {ean}</p>
			{result.kind === "invalid" && (
				<section className="flex flex-col gap-2">
					<h2 className={heading}>Questo codice non torna</h2>
					<p className="text-body">
						Le cifre non formano un codice a barre valido. Inquadralo di nuovo o
						ricontrolla le cifre.
					</p>
				</section>
			)}
			{result.kind === "store-code" && (
				<section className="flex flex-col gap-2">
					<h2 className={heading}>È un codice del negozio</h2>
					<p className="text-body">
						Lo stampa il supermercato sui prodotti a peso o col suo marchio, e cambia da
						un negozio all’altro: non ci dice quale zuppa sia. Cercala per nome.
					</p>
					<Link to="/" className={buttonClass("paper")}>
						Cerca per nome
					</Link>
				</section>
			)}
			{result.kind === "coming" && (
				<section className="flex flex-col gap-4">
					<div className="flex items-center gap-4">
						<PackPhoto src={result.imageUrl} alt="" size="thumb" />
						<div className="flex flex-col gap-1">
							<p className="font-display text-lead font-medium">{result.name}</p>
							{result.brand && (
								<p className="text-small text-text-soft">{result.brand}</p>
							)}
						</div>
					</div>
					<h2 className={heading}>
						{result.imported ? "L’abbiamo trovata su Open Food Facts" : "È in arrivo"}
					</h2>
					<p className="text-body">
						{result.imported
							? "La aggiungiamo dopo un controllo veloce: poi potrai votarla."
							: "È già in coda: la stiamo controllando, e tra poco potrai votarla."}
					</p>
				</section>
			)}
			{result.kind === "missing" && (
				<section className="flex flex-col gap-4">
					<h2 className={heading}>
						{result.reported ? "Grazie, l’abbiamo ricevuta" : "Questa non ce l’abbiamo"}
					</h2>
					{result.reported ? (
						<p className="text-body">
							La controlliamo e la aggiungiamo appena possiamo: poi potrai votarla.
						</p>
					) : signedIn ? (
						<>
							<p className="text-body">
								{!result.hint?.name
									? `Mandaci il nome${result.photos ? " e qualche foto della confezione" : ""}: la aggiungiamo dopo un controllo.`
									: result.hint.soup
										? `Su Open Food Facts c’è come «${result.hint.name}», ma senza la foto o il nome che ci servono. Mandaceli tu: la aggiungiamo dopo un controllo.`
										: `Open Food Facts la conosce come «${result.hint.name}», ma non come zuppa. Se lo è, mandacela: la aggiungiamo dopo un controllo.`}
							</p>
							<ReportForm ean={ean} hint={result.hint} photos={result.photos} />
						</>
					) : (
						<>
							<p className="text-body">
								Per mandarcela serve un account: così possiamo tenere lontano lo spam.
								Ci vuole un attimo, con Google.
							</p>
							<Link to="/accedi" className={buttonClass("ink")}>
								Prendi la tua tessera
							</Link>
						</>
					)}
				</section>
			)}
			<Link to="/scansiona" className={buttonClass("paper")}>
				{result.kind === "invalid" ? "Scansiona di nuovo" : "Scansiona un’altra zuppa"}
			</Link>
		</div>
	);
}
