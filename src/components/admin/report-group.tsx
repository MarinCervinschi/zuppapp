import { useState } from "react";

import { Button, paperOnRaised } from "@/components/ds/button";
import { useResolveReports } from "@/lib/admin/mutations";
import { SEGNALAZIONI, count } from "@/lib/plural";
import type { ReportGroup } from "@/lib/reports/service";

const STATUS = { draft: "bozza", published: "pubblicato", archived: "archiviato" };
const date = new Intl.DateTimeFormat("it-IT", {
	dateStyle: "medium",
	timeStyle: "short",
});
const field = "bg-ground text-body min-h-12 w-full rounded-thumb px-4";

/** Every open report of one EAN, and what to do with all of them at once. */
export function ReportGroupCard({ group }: { group: ReportGroup }) {
	const resolve = useResolveReports();
	const photos = group.reports.flatMap(report => report.photos);
	const named = group.reports.find(report => report.name) ?? group.reports[0];
	const [photoKey, setPhotoKey] = useState<string | null>(photos[0]?.key ?? null);
	// Rejecting deletes the photos for good: a second, explicit press.
	const [rejecting, setRejecting] = useState(false);
	const { ean } = group;
	const pending = resolve.isPending ? resolve.variables?.action : undefined;

	return (
		<li className="bg-ground-raised rounded-card flex flex-col gap-4 p-5">
			<div className="flex flex-col gap-1">
				<p className="font-display text-lead font-medium">
					{named.name ?? "Senza nome"}
				</p>
				<p className="text-small text-text-soft">
					EAN {ean} · {count(group.reports.length, SEGNALAZIONI)}
				</p>
				{group.product && (
					<p className="text-small">
						Già nel catalogo come «{group.product.name}» ({STATUS[group.product.status]}
						)
					</p>
				)}
			</div>

			<ul className="flex flex-col gap-3">
				{group.reports.map(report => (
					<li
						key={report.id}
						className="bg-ground rounded-thumb flex flex-col gap-2 p-4"
					>
						<p className="text-small text-text-soft">
							{report.author} · {date.format(new Date(report.createdAt))}
						</p>
						<p className="text-body">
							{[report.name, report.brand, report.quantity]
								.filter(Boolean)
								.join(" · ") || "Nessun dato"}
						</p>
						{report.note && <p className="text-body">«{report.note}»</p>}
						{report.photos.length > 0 && (
							<ul className="flex flex-wrap gap-2">
								{report.photos.map((photo, index) => (
									<li key={photo.key}>
										<a href={photo.fullUrl} target="_blank" rel="noreferrer">
											<img
												src={photo.thumbUrl}
												alt={`Foto ${index + 1} di ${report.author}, a grandezza piena`}
												className="rounded-thumb size-24 bg-white object-cover"
											/>
										</a>
									</li>
								))}
							</ul>
						)}
					</li>
				))}
			</ul>

			{group.product ? (
				<div className="flex flex-wrap gap-2">
					<Button
						variant="ink"
						disabled={resolve.isPending}
						onClick={() => resolve.mutate({ action: "close", ean })}
					>
						{pending === "close" ? "Chiudo…" : "Chiudi le segnalazioni"}
					</Button>
				</div>
			) : (
				<details className="group">
					<summary className="text-body min-h-11 cursor-pointer content-center font-semibold underline">
						Crea la bozza da qui
					</summary>
					<form
						className="mt-3 grid gap-3 sm:grid-cols-2"
						onSubmit={event => {
							event.preventDefault();
							const data = new FormData(event.currentTarget);
							resolve.mutate({
								action: "create",
								ean,
								name: String(data.get("name") ?? ""),
								brand: String(data.get("brand") ?? ""),
								quantity: String(data.get("quantity") ?? ""),
								photoKey,
							});
						}}
					>
						<label className="text-small flex flex-col gap-1 font-semibold sm:col-span-2">
							Nome
							<input
								name="name"
								required
								defaultValue={named.name ?? ""}
								className={field}
							/>
						</label>
						<label className="text-small flex flex-col gap-1 font-semibold">
							Marca
							<input name="brand" defaultValue={named.brand ?? ""} className={field} />
						</label>
						<label className="text-small flex flex-col gap-1 font-semibold">
							Formato
							<input
								name="quantity"
								defaultValue={named.quantity ?? ""}
								className={field}
							/>
						</label>
						{photos.length > 0 && (
							<fieldset className="flex flex-col gap-2 sm:col-span-2">
								<legend className="text-small font-semibold">
									La foto del prodotto
								</legend>
								<div className="flex flex-wrap gap-3">
									{photos.map((photo, index) => (
										<label key={photo.key} className="flex items-center gap-2">
											<input
												type="radio"
												name="photo"
												checked={photoKey === photo.key}
												onChange={() => setPhotoKey(photo.key)}
												className="accent-text size-5"
											/>
											<img
												src={photo.thumbUrl}
												alt={`Foto ${index + 1}`}
												className="rounded-thumb size-16 bg-white object-cover"
											/>
										</label>
									))}
									<label className="text-body flex min-h-11 items-center gap-2">
										<input
											type="radio"
											name="photo"
											checked={photoKey === null}
											onChange={() => setPhotoKey(null)}
											className="accent-text size-5"
										/>
										Nessuna
									</label>
								</div>
							</fieldset>
						)}
						<Button
							type="submit"
							variant="ink"
							disabled={resolve.isPending}
							className="sm:col-span-2"
						>
							{pending === "create" ? "Creo la bozza…" : "Crea la bozza"}
						</Button>
					</form>
				</details>
			)}

			{rejecting ? (
				<div
					role="group"
					aria-labelledby={`reject-${ean}`}
					className="flex flex-col gap-3"
				>
					<p id={`reject-${ean}`} className="text-body">
						Rifiuti {count(group.reports.length, SEGNALAZIONI)}? Le foto si cancellano e
						non si recuperano.
					</p>
					<div className="flex flex-wrap gap-2">
						<Button
							variant="ink"
							disabled={resolve.isPending}
							onClick={() => resolve.mutate({ action: "reject", ean })}
						>
							{pending === "reject" ? "Rifiuto…" : "Rifiuta e cancella le foto"}
						</Button>
						<Button className={paperOnRaised} onClick={() => setRejecting(false)}>
							Tienile
						</Button>
					</div>
				</div>
			) : (
				<div className="flex flex-wrap gap-2">
					{!group.product && (
						<Button
							className={paperOnRaised}
							disabled={resolve.isPending}
							onClick={() => resolve.mutate({ action: "off", ean })}
						>
							{pending === "off" ? "Importo…" : "Importa da Open Food Facts"}
						</Button>
					)}
					<Button
						className={paperOnRaised}
						disabled={resolve.isPending}
						onClick={() => setRejecting(true)}
					>
						Rifiuta
					</Button>
				</div>
			)}
		</li>
	);
}
