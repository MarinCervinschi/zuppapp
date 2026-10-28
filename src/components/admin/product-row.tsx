import { useState } from "react";

import { Link } from "@tanstack/react-router";

import { Button, paperOnRaised } from "@/components/ds/button";
import { PackPhoto } from "@/components/ds/pack-photo";
import { useCorrectProduct } from "@/lib/admin/mutations";
import type { AdminProduct } from "@/lib/admin/service";
import { subtypeLabel } from "@/lib/catalog/labels";
import { VOTI, count } from "@/lib/plural";
import { cn } from "@/lib/utils";

const SUBTYPES = ["vellutata", "minestrone", "legumi", "cereali", "brodo", "passato"];
const FIELD_NAMES: Record<string, string> = {
	name: "nome",
	brand: "marca",
	subtype: "tipo",
};

const field = "bg-ground text-body min-h-12 w-full rounded-thumb px-4";

export function ProductRow({
	product,
	selected,
	onSelect,
}: {
	product: AdminProduct;
	selected: boolean;
	onSelect: (selected: boolean) => void;
}) {
	const correct = useCorrectProduct();
	const [error, setError] = useState<string | null>(null);
	const details = [
		product.brand,
		product.subtype && subtypeLabel(product.subtype),
		product.quantity,
	]
		.filter(Boolean)
		.join(" · ");

	return (
		<li className="bg-ground-raised rounded-card flex flex-col gap-3 p-5">
			<div className="flex items-start gap-3">
				<input
					type="checkbox"
					checked={selected}
					onChange={event => onSelect(event.target.checked)}
					aria-label={`Seleziona ${product.name}`}
					className="accent-text mt-1 size-6 shrink-0"
				/>
				<PackPhoto src={product.imageUrl} alt="" size="thumb" />
				<div className="flex min-w-0 flex-col gap-1">
					<p className="font-display text-lead font-medium">{product.name}</p>
					<p className="text-small text-text-soft">
						{details || "Senza marca né tipo"} · EAN {product.ean}
					</p>
					<p className="text-small">
						{count(product.votesCount, VOTI)}
						{product.corrected.length > 0 &&
							` · corretto a mano: ${product.corrected.map(key => FIELD_NAMES[key] ?? key).join(", ")}`}
					</p>
					{product.status === "published" && (
						<Link
							to="/prodotti/$ean"
							params={{ ean: product.ean }}
							className="text-small min-h-11 content-center underline"
						>
							Vedi la scheda<span className="sr-only"> di {product.name}</span>
						</Link>
					)}
				</div>
			</div>

			{/* Native disclosure: keyboard and screen readers get it for free. */}
			<details className="group">
				<summary className="text-body min-h-11 cursor-pointer content-center font-semibold underline">
					Correggi
				</summary>
				<form
					className="mt-3 grid gap-3 sm:grid-cols-2"
					onSubmit={event => {
						event.preventDefault();
						setError(null);
						const form = new FormData(event.currentTarget);
						correct.mutate(
							{
								id: product.id,
								name: String(form.get("name") ?? ""),
								brand: String(form.get("brand") ?? ""),
								subtype: String(form.get("subtype") ?? ""),
								producerUrl: String(form.get("producerUrl") ?? ""),
							},
							{ onError: e => setError(e.message) }
						);
					}}
				>
					<label className="flex flex-col gap-1 sm:col-span-2">
						<span className="text-small font-semibold">Nome</span>
						<input name="name" defaultValue={product.name} required className={field} />
					</label>
					<label className="flex flex-col gap-1">
						<span className="text-small font-semibold">Marca</span>
						<input name="brand" defaultValue={product.brand ?? ""} className={field} />
					</label>
					<label className="flex flex-col gap-1">
						<span className="text-small font-semibold">Tipo</span>
						<select
							name="subtype"
							defaultValue={product.subtype ?? ""}
							className={field}
						>
							<option value="">Da decidere</option>
							{SUBTYPES.map(subtype => (
								<option key={subtype} value={subtype}>
									{subtypeLabel(subtype)}
								</option>
							))}
						</select>
					</label>
					<label className="flex flex-col gap-1 sm:col-span-2">
						<span className="text-small font-semibold">Sito del produttore</span>
						<input
							name="producerUrl"
							type="url"
							inputMode="url"
							placeholder="https://"
							defaultValue={product.producerUrl ?? ""}
							className={field}
						/>
					</label>
					{error && (
						<p role="alert" className="text-body text-danger sm:col-span-2">
							{error}
						</p>
					)}
					<p className="text-small text-text-soft sm:col-span-2">
						Nome, marca e tipo corretti qui restano tali anche quando Open Food Facts li
						aggiorna.
					</p>
					<Button
						type="submit"
						variant="paper"
						disabled={correct.isPending}
						className={cn(paperOnRaised, "sm:col-span-2 sm:justify-self-start")}
					>
						{correct.isPending ? "Salvataggio…" : "Salva la correzione"}
					</Button>
				</form>
			</details>
		</li>
	);
}
