import { useState } from "react";

import { Link } from "@tanstack/react-router";

import { SubtypeIcon, subtypeColor } from "@/components/catalog/type-icons";
import { Button, buttonClass } from "@/components/ds/button";
import {
	ArchiveIcon,
	CheckIcon,
	ChevronRightIcon,
	ExternalIcon,
	EyeIcon,
	UndoIcon,
} from "@/components/ds/icons";
import { PackPhoto } from "@/components/ds/pack-photo";
import { Sheet } from "@/components/ds/sheet";
import { useCorrectProduct, useSetProductsStatus } from "@/lib/admin/mutations";
import type { AdminProduct } from "@/lib/admin/service";
import { sizedImage } from "@/lib/catalog/image";
import { subtypeLabel } from "@/lib/catalog/labels";
import { VOTI, count } from "@/lib/plural";
import { cn } from "@/lib/utils";

type Status = AdminProduct["status"];

/** What can be done to products, by the status they are in. The first is the one to do. */
export const ACTIONS: Record<
	Status,
	readonly (readonly [Status, string, typeof CheckIcon])[]
> = {
	draft: [
		["published", "Pubblica", CheckIcon],
		["archived", "Archivia", ArchiveIcon],
	],
	published: [
		["archived", "Archivia", ArchiveIcon],
		["draft", "Rimetti in bozza", UndoIcon],
	],
	archived: [
		["published", "Ripubblica", CheckIcon],
		["draft", "Rimetti in bozza", UndoIcon],
	],
};

const STATUS_PILL: Record<Status, [string, string]> = {
	draft: ["Bozza", "bg-field text-on-field"],
	published: ["Pubblicato", "bg-badge-good text-[#16120f]"],
	archived: ["Archiviato", "bg-text/10"],
};

const SUBTYPES = ["vellutata", "minestrone", "legumi", "cereali", "brodo", "passato"];
const FIELD_NAMES: Record<string, string> = {
	name: "nome",
	brand: "marca",
	subtype: "tipo",
};

function details(product: AdminProduct) {
	return [
		product.brand,
		product.subtype && subtypeLabel(product.subtype),
		product.quantity,
	]
		.filter(Boolean)
		.join(" • ");
}

/**
 * A product in the admin's list: a card a thumb can press, which opens the product's sheet. The
 * box on the left selects it for the actions on many at once.
 */
export function ProductRow({
	product,
	selected,
	onSelect,
	onOpen,
}: {
	product: AdminProduct;
	selected: boolean;
	onSelect: (selected: boolean) => void;
	onOpen: () => void;
}) {
	return (
		<li>
			<article
				className={cn(
					"group relative grid grid-cols-[auto_auto_minmax(0,1fr)_auto] items-center gap-3 rounded-[1.5rem] py-2 pr-3 pl-1 transition-[scale,background-color] duration-200 ease-[var(--ease-out-snap)] motion-safe:active:scale-[0.99]",
					selected ? "bg-text/[0.1]" : "bg-ground-raised hover:bg-text/[0.06]"
				)}
			>
				{/* Above the stretched button: the box is its own control. */}
				<label className="relative z-20 grid size-11 cursor-pointer place-items-center">
					<input
						type="checkbox"
						checked={selected}
						onChange={event => onSelect(event.target.checked)}
						className="accent-text size-5"
					/>
					<span className="sr-only">Seleziona {product.name}</span>
				</label>
				{product.imageUrl ? (
					<img
						src={sizedImage(product.imageUrl, 100) ?? product.imageUrl}
						alt=""
						loading="lazy"
						decoding="async"
						className="size-14 rounded-[0.875rem] bg-white object-cover"
					/>
				) : (
					<span aria-hidden className="bg-ground size-14 rounded-[0.875rem]" />
				)}
				<div className="flex min-w-0 flex-col gap-1">
					<button
						type="button"
						onClick={onOpen}
						className="font-display text-body text-left font-medium group-hover:underline after:absolute after:inset-0 after:rounded-[1.5rem]"
					>
						{product.name}
					</button>
					<p className="text-small text-text-soft truncate">
						{details(product) || "Senza marca né tipo"}
					</p>
					<p className="flex flex-wrap items-center gap-1.5">
						{!product.subtype && (
							<span className="bg-field text-on-field text-small rounded-full px-2 py-0.5 font-medium">
								Senza tipo
							</span>
						)}
						<span className="text-small text-text-soft tabular-nums">
							{count(product.votesCount, VOTI)}
						</span>
						{product.corrected.length > 0 && (
							<span className="bg-text/[0.08] text-small rounded-full px-2 py-0.5">
								corretto a mano
							</span>
						)}
					</p>
				</div>
				<ChevronRightIcon className="text-text-soft size-5" />
			</article>
		</li>
	);
}

/** One product, opened from the list: its status and what to do with it, and its correction. */
export function AdminProductSheet({
	product,
	onClosed,
}: {
	product: AdminProduct;
	onClosed: () => void;
}) {
	const setStatus = useSetProductsStatus();
	const correct = useCorrectProduct();
	const [error, setError] = useState<string | null>(null);
	const [subtype, setSubtype] = useState(product.subtype ?? "");
	const [label, pill] = STATUS_PILL[product.status];
	const field = "bg-ground-raised text-body min-h-12 w-full rounded-[1rem] px-4";

	return (
		<Sheet
			title={product.name}
			subtitle={
				<div className="flex flex-col gap-1">
					<p>{details(product) || "Senza marca né tipo"}</p>
					<p className="flex flex-wrap items-center gap-2">
						<span className={cn("rounded-full px-2.5 py-0.5 font-semibold", pill)}>
							{label}
						</span>
						<span className="tabular-nums">
							EAN {product.ean} · {count(product.votesCount, VOTI)}
						</span>
					</p>
				</div>
			}
			media={
				<span className="plate grid size-24 shrink-0 place-items-center overflow-hidden rounded-[1.25rem] bg-white">
					<PackPhoto
						src={product.imageUrl}
						alt=""
						size="thumb"
						className="size-full rounded-none object-cover"
					/>
				</span>
			}
			onClosed={onClosed}
			wide="panel"
		>
			{close => (
				<div className="flex flex-col gap-6">
					<div className="flex flex-wrap gap-2">
						{ACTIONS[product.status].map(([status, text, Icon], index) => (
							<Button
								key={status}
								variant={index === 0 ? "ink" : "paper"}
								disabled={setStatus.isPending}
								onClick={() =>
									setStatus.mutate(
										{ ids: [product.id], status, from: product.status },
										{ onSuccess: close }
									)
								}
							>
								<Icon className="size-5" />
								{text}
							</Button>
						))}
					</div>

					<div className="flex flex-wrap gap-x-5 gap-y-1">
						{product.status !== "draft" && (
							<Link
								to="/prodotti/$ean"
								params={{ ean: product.ean }}
								className="text-body inline-flex min-h-11 items-center gap-1.5 underline"
							>
								<EyeIcon className="size-5" />
								Vedi la scheda
							</Link>
						)}
						<a
							href={`https://world.openfoodfacts.org/product/${product.ean}`}
							target="_blank"
							rel="noopener noreferrer"
							className="text-body inline-flex min-h-11 items-center gap-1.5 underline"
						>
							Su Open Food Facts
							<ExternalIcon className="size-4" />
						</a>
					</div>

					<form
						className="flex flex-col gap-4"
						onSubmit={event => {
							event.preventDefault();
							setError(null);
							const form = new FormData(event.currentTarget);
							correct.mutate(
								{
									id: product.id,
									name: String(form.get("name") ?? ""),
									brand: String(form.get("brand") ?? ""),
									subtype,
									producerUrl: String(form.get("producerUrl") ?? ""),
								},
								{ onError: e => setError(e.message) }
							);
						}}
					>
						<h3 className="font-display text-lead font-medium">Correggi</h3>
						<label className="flex flex-col gap-1.5">
							<span className="text-small font-semibold">Nome</span>
							<input
								name="name"
								defaultValue={product.name}
								required
								className={field}
							/>
						</label>
						<label className="flex flex-col gap-1.5">
							<span className="text-small font-semibold">Marca</span>
							<input
								name="brand"
								defaultValue={product.brand ?? ""}
								className={field}
							/>
						</label>
						<fieldset className="flex flex-col gap-2">
							<legend className="text-small mb-2 font-semibold">Tipo</legend>
							{/* Real radio buttons: one tab stop, the arrows move, the legend names the group. */}
							<div className="flex flex-wrap gap-2">
								{["", ...SUBTYPES].map(value => (
									<label
										key={value || "none"}
										className={cn(
											"text-body has-focus-visible:outline-text inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full py-1 pr-4 pl-1 transition-[background-color,color] duration-150 has-focus-visible:outline-2 has-focus-visible:outline-offset-3",
											"bg-text/[0.06] hover:bg-text/10 has-checked:bg-text has-checked:text-ground",
											!value && "pl-4"
										)}
									>
										<input
											type="radio"
											name="subtype"
											value={value}
											checked={subtype === value}
											onChange={() => setSubtype(value)}
											className="sr-only"
										/>
										{value && (
											<span
												className={cn(
													"grid size-9 place-items-center rounded-full",
													subtypeColor(value)
												)}
											>
												<SubtypeIcon subtype={value} className="size-5" />
											</span>
										)}
										{value ? subtypeLabel(value) : "Da decidere"}
									</label>
								))}
							</div>
						</fieldset>
						<label className="flex flex-col gap-1.5">
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
							<p role="alert" className="text-body text-danger">
								{error}
							</p>
						)}
						<p className="text-small text-text-soft">
							Nome, marca e tipo corretti qui restano tali anche quando Open Food Facts
							li aggiorna.
							{product.corrected.length > 0 &&
								` Già corretti a mano: ${product.corrected.map(key => FIELD_NAMES[key] ?? key).join(", ")}.`}
						</p>
						<button
							type="submit"
							disabled={correct.isPending}
							className={cn(buttonClass(), "w-full")}
						>
							<CheckIcon className="size-5" />
							{correct.isPending ? "Salvataggio…" : "Salva la correzione"}
						</button>
					</form>
				</div>
			)}
		</Sheet>
	);
}
