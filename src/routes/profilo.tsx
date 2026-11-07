import { useState } from "react";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

import { Button, buttonClass } from "@/components/ds/button";
import {
	ChevronRightIcon,
	ExternalIcon,
	InfoIcon,
	KeyIcon,
	LogoutIcon,
	PencilIcon,
	SunIcon,
} from "@/components/ds/icons";
import { Sheet } from "@/components/ds/sheet";
import { SoupField } from "@/components/ds/soup-field";
import { StarIcon } from "@/components/ds/stars";
import { ThemeSwitch } from "@/components/ds/theme-switch";
import { AvatarPicker } from "@/components/user/avatar-picker";
import { NicknameForm } from "@/components/user/nickname-form";
import { UserAvatar } from "@/components/user/user-avatar";
import { authClient } from "@/lib/auth/client";
import { userQueries } from "@/lib/user/queries";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/profilo")({
	// The profile is for accounts: an anonymous voter is sent to sign in, and comes back here.
	beforeLoad: async ({ context }) => {
		const { viewer } = await context.queryClient.ensureQueryData(userQueries.viewer());
		if (!viewer || viewer.isAnonymous) throw redirect({ to: "/accedi" });
	},
	head: () => ({ meta: [{ title: "Il tuo profilo · Zuppapp" }] }),
	component: Profile,
});

// A row of the grouped settings list: a 56 px target, icon, words, and what it leads to.
const row =
	"text-body flex min-h-14 w-full items-center gap-3 px-4 text-left no-underline transition-[background-color] duration-150 hover:bg-text/[0.05]";

function Profile() {
	const { data } = useQuery(userQueries.viewer());
	const queryClient = useQueryClient();
	const navigate = useNavigate();
	const viewer = data?.viewer;
	const [sheet, setSheet] = useState<"edit" | "credits" | null>(null);
	const [leaving, setLeaving] = useState(false);
	if (!viewer) return null;

	async function signOut() {
		setLeaving(true);
		const { error } = await authClient.signOut();
		if (error) {
			setLeaving(false);
			toast.error("Non sei uscito. Controlla la connessione e riprova.");
			return;
		}
		// Everything cached belonged to that account: votes, hearts, the stars on every card.
		await queryClient.invalidateQueries();
		navigate({ to: "/" });
	}

	return (
		<>
			{/* Your corner of the app gets its own soup: beetroot, rolling over the top. */}
			<div className="relative isolate overflow-hidden">
				<SoupField soup="beet" shape="onda" />
				<header className="stagger mx-auto flex max-w-xl flex-col items-center gap-3 px-4 pt-12 pb-8 text-center">
					<button
						type="button"
						onClick={() => setSheet("edit")}
						className="group relative rounded-full transition-[scale] duration-200 ease-[var(--ease-out-snap)] motion-safe:active:scale-[0.96]"
					>
						<UserAvatar
							seed={viewer.avatarSeed}
							className="bg-ground-raised size-28 rounded-full"
						/>
						{/* The pencil says the face can be changed; the button's name says it in words. */}
						<span
							aria-hidden
							className="bg-text text-ground absolute right-0 bottom-0 grid size-9 place-items-center rounded-full transition-transform duration-200 motion-safe:group-hover:rotate-12"
						>
							<PencilIcon className="size-4" />
						</span>
						<span className="sr-only">Cambia nome e faccia</span>
					</button>
					<h1 className="font-display text-title font-semibold text-balance">
						{viewer.displayName}
					</h1>
					{!viewer.hasNickname ? (
						<Button
							variant="ink"
							onClick={() => setSheet("edit")}
							className="min-h-11 px-4"
						>
							<PencilIcon className="size-5" />
							Scegli il tuo nome
						</Button>
					) : (
						<Button onClick={() => setSheet("edit")} className="min-h-11 px-4">
							<PencilIcon className="size-5" />
							Modifica profilo
						</Button>
					)}
				</header>
			</div>

			<main className="mx-auto flex max-w-xl flex-col gap-8 px-4">
				{!viewer.hasNickname && (
					<p className="text-small text-text-soft -mt-4 text-center">
						Per ora gli altri ti vedono come «{viewer.displayName}».
					</p>
				)}

				<nav aria-label="Le tue zuppe" className="grid grid-cols-2 gap-3">
					<Link
						to="/le-mie-zuppe"
						className="bg-ink text-on-ink rounded-card flex min-h-28 flex-col justify-between p-4 no-underline transition-[scale] duration-200 ease-[var(--ease-out-snap)] motion-safe:active:scale-[0.97]"
					>
						<StarIcon className="text-star size-6" />
						<span className="flex flex-col">
							<span className="font-display text-title leading-none font-semibold tabular-nums">
								{viewer.votesCount}
							</span>
							<span className="text-body">
								{viewer.votesCount === 1 ? "zuppa votata" : "zuppe votate"}
							</span>
						</span>
					</Link>
					<Link
						to="/le-mie-zuppe"
						search={{ scheda: "preferite" }}
						className="bg-ground-raised rounded-card flex min-h-28 flex-col justify-between p-4 no-underline transition-[scale] duration-200 ease-[var(--ease-out-snap)] motion-safe:active:scale-[0.97]"
					>
						<svg
							aria-hidden
							viewBox="0 0 24 24"
							className="text-soup-tomato size-6"
							fill="currentColor"
						>
							<path d="M12 20.5s-7.5-4.6-7.5-10.1A4.4 4.4 0 0 1 12 7.6a4.4 4.4 0 0 1 7.5 2.8c0 5.5-7.5 10.1-7.5 10.1Z" />
						</svg>
						<span className="flex flex-col">
							<span className="font-display text-title leading-none font-semibold tabular-nums">
								{viewer.favoritesCount}
							</span>
							<span className="text-body">
								{viewer.favoritesCount === 1 ? "preferita" : "preferite"}
							</span>
						</span>
					</Link>
				</nav>

				<section aria-labelledby="settings-heading" className="flex flex-col gap-2">
					<h2
						id="settings-heading"
						className="text-small text-text-soft px-4 font-semibold tracking-[0.06em] uppercase"
					>
						Impostazioni
					</h2>
					<div className="bg-ground-raised group-rows overflow-hidden rounded-[1.5rem]">
						<div className="flex min-h-14 flex-wrap items-center justify-between gap-x-3 gap-y-2 px-4 py-2">
							<span aria-hidden className="text-body flex items-center gap-3">
								<SunIcon className="size-5" />
								Tema
							</span>
							<ThemeSwitch className="bg-ground" />
						</div>
						{viewer.isAdmin && (
							<Link to="/admin" className={row}>
								<KeyIcon className="size-5" />
								<span className="flex-1">Gestione prodotti</span>
								<ChevronRightIcon className="text-text-soft size-5" />
							</Link>
						)}
						<button type="button" onClick={() => setSheet("credits")} className={row}>
							<InfoIcon className="size-5" />
							<span className="flex-1">Crediti e codice aperto</span>
							<ChevronRightIcon className="text-text-soft size-5" />
						</button>
					</div>
					<div className="bg-ground-raised mt-2 overflow-hidden rounded-[1.5rem]">
						<button
							type="button"
							onClick={signOut}
							disabled={leaving}
							className={cn(row, "text-danger disabled:opacity-60")}
						>
							<LogoutIcon className="size-5" />
							{leaving ? "Esco…" : "Esci dall’account"}
						</button>
					</div>
					<p className="text-small text-text-soft px-4">
						Uscendo, i tuoi voti restano nell’account e li ritrovi al prossimo accesso.
					</p>
				</section>
			</main>

			{sheet === "edit" && (
				<EditProfile viewer={viewer} onClosed={() => setSheet(null)} />
			)}
			{sheet === "credits" && <Credits onClosed={() => setSheet(null)} />}
		</>
	);
}

/** Name and face, in a sheet: they change rarely, so they open on request. */
function EditProfile({
	viewer,
	onClosed,
}: {
	viewer: { id: string; displayName: string; hasNickname: boolean; avatarSeed: string };
	onClosed: () => void;
}) {
	return (
		<Sheet title="Modifica profilo" onClosed={onClosed} wide="popup">
			{() => (
				<div className="flex flex-col gap-7">
					<NicknameForm current={viewer.hasNickname ? viewer.displayName : null} />
					<AvatarPicker userId={viewer.id} current={viewer.avatarSeed} />
				</div>
			)}
		</Sheet>
	);
}

/** What the licences ask for, and where the code is: once the page's footer, now one tap away. */
function Credits({ onClosed }: { onClosed: () => void }) {
	const external = "inline-flex items-center gap-1 underline";
	return (
		<Sheet title="Crediti" onClosed={onClosed} wide="popup">
			{() => (
				<div className="flex flex-col gap-5">
					<ul className="text-body flex flex-col gap-3">
						<li>
							Dati dei prodotti da{" "}
							<a
								href="https://world.openfoodfacts.org"
								target="_blank"
								rel="noopener noreferrer"
								className={external}
							>
								Open Food Facts
								<ExternalIcon className="size-4" />
							</a>
							, licenza ODbL.
						</li>
						<li>
							Avatar{" "}
							<a
								href="https://www.dicebear.com/styles/critters/"
								target="_blank"
								rel="noopener noreferrer"
								className={external}
							>
								Critters di DiceBear
								<ExternalIcon className="size-4" />
							</a>
							, CC0.
						</li>
					</ul>
					<a
						href="https://github.com/MarinCervinschi/zuppapp"
						target="_blank"
						rel="noopener noreferrer"
						className={cn(buttonClass(), "w-full")}
					>
						Guarda il codice su GitHub
						<ExternalIcon className="size-5" />
					</a>
				</div>
			)}
		</Sheet>
	);
}
