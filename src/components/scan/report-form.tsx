import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ds/button";
import { useSubmitReport } from "@/lib/reports/mutations";
import { toJpeg } from "@/lib/reports/resize";
import { MAX_PHOTOS } from "@/lib/reports/schemas";

type Hint = {
	name: string | null;
	brand: string | null;
	quantity: string | null;
} | null;
type Chosen = { file: File; url: string };

const field =
	"bg-ground-raised text-body placeholder:text-text-soft min-h-12 w-full rounded-full px-5";
const label = "text-body font-semibold";

/**
 * What the pack says and up to three photos, for a product we don't have. The photos are
 * shrunk and re-encoded here, which also strips their EXIF, before anything is sent.
 */
export function ReportForm({
	ean,
	hint,
	photos: photosEnabled,
}: {
	ean: string;
	hint: Hint;
	photos: boolean;
}) {
	const send = useSubmitReport(ean);
	const [chosen, setChosen] = useState<Chosen[]>([]);
	const [preparing, setPreparing] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const picker = useRef<HTMLInputElement>(null);

	// The previews are object URLs: let them go with the form.
	const urls = useRef<string[]>([]);
	urls.current = chosen.map(photo => photo.url);
	useEffect(() => () => urls.current.forEach(url => URL.revokeObjectURL(url)), []);

	function add(files: FileList | null) {
		const room = MAX_PHOTOS - chosen.length;
		const added = [...(files ?? [])]
			.filter(file => file.type.startsWith("image/"))
			.slice(0, room)
			.map(file => ({ file, url: URL.createObjectURL(file) }));
		setChosen(current => [...current, ...added]);
		if (picker.current) picker.current.value = "";
	}

	function remove(index: number) {
		URL.revokeObjectURL(chosen[index].url);
		setChosen(current => current.filter((_, i) => i !== index));
	}

	async function submit(form: HTMLFormElement) {
		setError(null);
		const data = new FormData(form);
		data.set("ean", ean);
		setPreparing(true);
		try {
			for (const [index, photo] of chosen.entries()) {
				const [full, small] = await Promise.all([
					toJpeg(photo.file, 1600),
					toJpeg(photo.file, 400),
				]);
				data.append("full", full, `${index + 1}.full.jpg`);
				data.append("small", small, `${index + 1}.400.jpg`);
			}
		} catch {
			setPreparing(false);
			setError(
				"Non riusciamo a leggere una delle foto. Toglila e riprova con un’altra."
			);
			return;
		}
		setPreparing(false);
		send.mutate(data, { onError: error => setError(error.message) });
	}

	const busy = preparing || send.isPending;

	return (
		<form
			className="flex flex-col gap-5"
			onSubmit={event => {
				event.preventDefault();
				submit(event.currentTarget);
			}}
		>
			<div className="flex flex-col gap-2">
				<label htmlFor="report-name" className={label}>
					Nome sulla confezione
				</label>
				<input
					id="report-name"
					name="name"
					autoComplete="off"
					required
					maxLength={160}
					defaultValue={hint?.name ?? ""}
					placeholder="Vellutata di zucca"
					className={field}
				/>
			</div>
			<div className="grid gap-5 sm:grid-cols-2">
				<div className="flex flex-col gap-2">
					<label htmlFor="report-brand" className={label}>
						Marca
					</label>
					<input
						id="report-brand"
						name="brand"
						autoComplete="off"
						maxLength={80}
						defaultValue={hint?.brand ?? ""}
						placeholder="Knorr"
						className={field}
					/>
				</div>
				<div className="flex flex-col gap-2">
					<label htmlFor="report-quantity" className={label}>
						Formato
					</label>
					<input
						id="report-quantity"
						name="quantity"
						autoComplete="off"
						maxLength={40}
						defaultValue={hint?.quantity ?? ""}
						placeholder="500 g"
						className={field}
					/>
				</div>
			</div>

			{photosEnabled && (
				<fieldset className="flex flex-col gap-2">
					<legend className={label}>Foto, fino a {MAX_PHOTOS}</legend>
					<p id="report-photos-help" className="text-small text-text-soft">
						Il fronte, gli ingredienti e i valori nutrizionali. Niente persone
						nell’inquadratura.
					</p>
					{chosen.length > 0 && (
						<ul className="grid grid-cols-3 gap-3">
							{chosen.map((photo, index) => (
								<li key={photo.url} className="flex flex-col gap-1">
									<img
										src={photo.url}
										alt={`Foto ${index + 1}`}
										className="rounded-thumb bg-ground-raised aspect-square w-full object-cover"
									/>
									<button
										type="button"
										onClick={() => remove(index)}
										className="text-small min-h-11 underline"
									>
										Togli la foto {index + 1}
									</button>
								</li>
							))}
						</ul>
					)}
					{chosen.length < MAX_PHOTOS && (
						<div>
							<input
								ref={picker}
								id="report-photos"
								type="file"
								accept="image/*"
								multiple
								aria-describedby="report-photos-help"
								onChange={event => add(event.target.files)}
								className="peer sr-only"
							/>
							<label
								htmlFor="report-photos"
								className="bg-ground-raised text-body hover:bg-text/10 peer-focus-visible:outline-text/50 inline-flex min-h-12 cursor-pointer items-center justify-center rounded-full px-5 font-medium peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2"
							>
								{chosen.length === 0 ? "Aggiungi le foto" : "Aggiungi un’altra foto"}
							</label>
						</div>
					)}
				</fieldset>
			)}

			<div className="flex flex-col gap-2">
				<label htmlFor="report-note" className={label}>
					Qualcosa da aggiungere?
				</label>
				<textarea
					id="report-note"
					name="note"
					maxLength={500}
					rows={3}
					placeholder="L’ho trovata da Esselunga, al banco frigo"
					className="bg-ground-raised text-body placeholder:text-text-soft rounded-thumb w-full px-5 py-3"
				/>
			</div>

			<label className="text-small flex items-start gap-3">
				<input
					type="checkbox"
					name="licenza"
					value="si"
					required
					className="accent-text mt-0.5 size-6 shrink-0"
				/>
				<span>
					Pubblico questi dati con licenza{" "}
					<a
						href="https://opendatacommons.org/licenses/odbl/1-0/"
						className="underline"
					>
						ODbL
					</a>
					{photosEnabled && (
						<>
							{" "}
							e le foto con licenza{" "}
							<a
								href="https://creativecommons.org/licenses/by-sa/4.0/deed.it"
								className="underline"
							>
								CC BY-SA 4.0
							</a>
							, e le foto le ho scattate io
						</>
					)}
					. Sono le stesse licenze di Open Food Facts.
				</span>
			</label>

			{error && (
				<p role="alert" className="text-body text-danger">
					{error}
				</p>
			)}
			<Button type="submit" variant="ink" disabled={busy}>
				{preparing
					? "Preparo le foto…"
					: send.isPending
						? "Mando…"
						: "Mandaci la zuppa"}
			</Button>
		</form>
	);
}
