import { useEffect, useRef, useState } from "react";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, createFileRoute, redirect, useNavigate } from "@tanstack/react-router";

import { Button, buttonClass, paperOnRaised } from "@/components/ds/button";
import {
	CheckIcon,
	KeyIcon,
	LogoutIcon,
	PencilIcon,
	SettingsIcon,
	StarLineIcon,
} from "@/components/ds/icons";
import { pillClass } from "@/components/ds/pill";
import { SoupField } from "@/components/ds/soup-field";
import { ThemeSwitch } from "@/components/ds/theme-switch";
import { AvatarPicker } from "@/components/user/avatar-picker";
import { NicknameForm } from "@/components/user/nickname-form";
import { UserAvatar } from "@/components/user/user-avatar";
import { authClient } from "@/lib/auth/client";
import { VOTI, count } from "@/lib/plural";
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

function Profile() {
	const { data } = useQuery(userQueries.viewer());
	const queryClient = useQueryClient();
	const navigate = useNavigate();
	const viewer = data?.viewer;
	// Name and face change rarely: they open on request, not under the reader's thumb all the time.
	const [editing, setEditing] = useState(false);
	// The button that opens the editor goes away with it: focus follows to where the reader is.
	const editorHeading = useRef<HTMLHeadingElement>(null);
	const editButton = useRef<HTMLButtonElement>(null);
	const opened = useRef(false);
	useEffect(() => {
		if (editing) editorHeading.current?.focus();
		else if (opened.current) editButton.current?.focus();
		opened.current = editing;
	}, [editing]);
	if (!viewer) return null;

	async function signOut() {
		await authClient.signOut();
		// Everything cached belonged to that account: votes, hearts, the stars on every card.
		await queryClient.invalidateQueries();
		navigate({ to: "/" });
	}

	return (
		<>
			{/* Your corner of the app gets its own soup: beetroot, rolling over the top. */}
			<div className="relative isolate overflow-hidden">
				<SoupField soup="beet" shape="onda" />
				<header className="mx-auto flex max-w-xl flex-col gap-5 px-4 pt-14 pb-10">
					<div className="flex items-center gap-4">
						<UserAvatar
							seed={viewer.avatarSeed}
							className="size-20 shrink-0 rounded-full sm:size-24"
						/>
						<div className="flex min-w-0 flex-col items-start gap-2">
							<h1 className="font-display text-title font-semibold">
								{viewer.displayName}
							</h1>
							{!editing && (
								<Button
									ref={editButton}
									onClick={() => setEditing(true)}
									className="min-h-11 px-4 whitespace-nowrap"
									aria-controls="profile-editor"
								>
									<PencilIcon className="size-5" />
									Modifica profilo
								</Button>
							)}
						</div>
					</div>
					{/* Under the avatar row, full width: on a narrow phone each pill keeps one line. */}
					<nav aria-label="Le tue zuppe" className="flex flex-wrap gap-2">
						<Link to="/le-mie-zuppe" className={cn(pillClass(), "whitespace-nowrap")}>
							<StarLineIcon className="size-4" />
							Le mie zuppe
							<span className="text-text-soft tabular-nums">
								{count(viewer.votesCount, VOTI)}
							</span>
						</Link>
						<Link to="/preferiti" className={cn(pillClass(), "whitespace-nowrap")}>
							<svg
								aria-hidden
								viewBox="0 0 24 24"
								className="text-soup-tomato size-4"
								fill="currentColor"
							>
								<path d="M12 20.5s-7.5-4.6-7.5-10.1A4.4 4.4 0 0 1 12 7.6a4.4 4.4 0 0 1 7.5 2.8c0 5.5-7.5 10.1-7.5 10.1Z" />
							</svg>
							Preferiti
							<span className="text-text-soft tabular-nums">
								{viewer.favoritesCount}
							</span>
						</Link>
					</nav>
				</header>
			</div>
			<main className="mx-auto flex max-w-xl flex-col gap-10 px-4 pt-2">
				{!viewer.hasNickname && !editing && (
					<div className="bg-field text-on-field rounded-card flex flex-col items-start gap-3 p-5">
						<p className="text-body">
							Scegli come ti chiami: per ora gli altri ti vedono come «
							{viewer.displayName}».
						</p>
						<Button variant="ink" onClick={() => setEditing(true)}>
							<PencilIcon className="size-5" />
							Scegli il tuo nome
						</Button>
					</div>
				)}

				{editing && (
					<section
						id="profile-editor"
						aria-labelledby="editor-heading"
						className="bg-ground-raised rounded-card motion-safe:animate-rise flex flex-col gap-8 p-5"
					>
						<div className="flex items-center justify-between gap-3">
							<h2
								id="editor-heading"
								ref={editorHeading}
								tabIndex={-1}
								className="font-display text-lead font-medium outline-none"
							>
								Modifica profilo
							</h2>
							<Button
								onClick={() => setEditing(false)}
								className={cn(paperOnRaised, "min-h-11 px-4")}
							>
								<CheckIcon className="size-5" />
								Fatto
							</Button>
						</div>
						<NicknameForm
							current={viewer.hasNickname ? viewer.displayName : null}
							onRaised
						/>
						<AvatarPicker userId={viewer.id} current={viewer.avatarSeed} onRaised />
					</section>
				)}

				<section aria-labelledby="settings-heading" className="flex flex-col gap-5">
					<h2
						id="settings-heading"
						className="font-display text-lead inline-flex items-center gap-2 font-medium"
					>
						<SettingsIcon className="size-6" />
						Impostazioni
					</h2>
					<div className="flex flex-col gap-2">
						<span aria-hidden className="text-body font-semibold">
							Tema
						</span>
						<ThemeSwitch className="self-start" />
					</div>
					{viewer.isAdmin && (
						<Link to="/admin" className={cn(buttonClass(), "self-start")}>
							<KeyIcon className="size-5" />
							Gestione prodotti
						</Link>
					)}
					<div className="flex flex-col items-start gap-2 pt-4">
						<Button onClick={signOut}>
							<LogoutIcon className="size-5" />
							Esci dall’account
						</Button>
						<p className="text-small text-text-soft">
							Uscendo, i tuoi voti restano nell’account e li ritrovi al prossimo
							accesso.
						</p>
					</div>
				</section>
			</main>
		</>
	);
}
