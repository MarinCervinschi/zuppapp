import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, createFileRoute, redirect, useNavigate } from "@tanstack/react-router";

import { AppBar } from "@/components/ds/app-bar";
import { Button } from "@/components/ds/button";
import { ThemeSwitch } from "@/components/ds/theme-switch";
import { AvatarPicker } from "@/components/user/avatar-picker";
import { NicknameForm } from "@/components/user/nickname-form";
import { UserAvatar } from "@/components/user/user-avatar";
import { authClient } from "@/lib/auth/client";
import { VOTI, count } from "@/lib/plural";
import { userQueries } from "@/lib/user/queries";

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
	if (!viewer) return null;

	async function signOut() {
		await authClient.signOut();
		await queryClient.invalidateQueries();
		navigate({ to: "/" });
	}

	return (
		<>
			<AppBar back />
			<main className="mx-auto flex max-w-xl flex-col gap-10 px-4 pt-8 pb-16">
				<header className="flex items-center gap-4">
					<UserAvatar seed={viewer.avatarSeed} className="size-24" />
					<div className="flex min-w-0 flex-col gap-1">
						<h1 className="font-semicondensed text-title font-extrabold text-balance">
							{viewer.displayName}
						</h1>
						<Link to="/le-mie-zuppe" className="text-body underline">
							Le mie zuppe ({count(viewer.votesCount, VOTI)})
						</Link>
					</div>
				</header>

				{!viewer.hasNickname && (
					<p className="bg-field on-field text-body p-4">
						Scegli come ti chiami: per ora gli altri ti vedono come «
						{viewer.displayName}».
					</p>
				)}

				<NicknameForm current={viewer.hasNickname ? viewer.displayName : null} />
				<AvatarPicker userId={viewer.id} current={viewer.avatarSeed} />

				<section aria-labelledby="account-heading" className="flex flex-col gap-3">
					<h2
						id="account-heading"
						className="font-condensed text-lead font-extrabold uppercase"
					>
						Account
					</h2>
					<div className="flex flex-col gap-2">
						<span aria-hidden className="text-body font-semibold">
							Tema
						</span>
						<ThemeSwitch className="self-start" />
					</div>
					{viewer.isAdmin && (
						<Link
							to="/admin"
							className="text-body min-h-11 content-center self-start underline"
						>
							Gestione prodotti
						</Link>
					)}
					<Button onClick={signOut} className="self-start">
						Esci dall’account
					</Button>
					<p className="text-small text-text-soft">
						Uscendo, i tuoi voti restano nell’account e li ritrovi al prossimo accesso.
					</p>
				</section>
			</main>
		</>
	);
}
