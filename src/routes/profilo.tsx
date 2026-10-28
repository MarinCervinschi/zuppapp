import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, createFileRoute, redirect, useNavigate } from "@tanstack/react-router";

import { Button } from "@/components/ds/button";
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
	if (!viewer) return null;

	async function signOut() {
		await authClient.signOut();
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
						<UserAvatar seed={viewer.avatarSeed} className="size-24 rounded-full" />
						<div className="flex min-w-0 flex-col gap-1">
							<h1 className="font-display text-title font-semibold">
								{viewer.displayName}
							</h1>
						</div>
					</div>
					{/* Under the avatar row, full width: on a narrow phone each pill keeps one line. */}
					<nav aria-label="Le tue zuppe" className="flex flex-wrap gap-2">
						<Link to="/le-mie-zuppe" className={cn(pillClass(), "whitespace-nowrap")}>
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
				{!viewer.hasNickname && (
					<p className="bg-field on-field text-body rounded-card p-5">
						Scegli come ti chiami: per ora gli altri ti vedono come «
						{viewer.displayName}».
					</p>
				)}

				<NicknameForm current={viewer.hasNickname ? viewer.displayName : null} />
				<AvatarPicker userId={viewer.id} current={viewer.avatarSeed} />

				<section aria-labelledby="account-heading" className="flex flex-col gap-3">
					<h2 id="account-heading" className="font-display text-lead font-medium">
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
