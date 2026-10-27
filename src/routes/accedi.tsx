import { useState } from "react";

import { useQuery } from "@tanstack/react-query";
import { Link, createFileRoute, redirect } from "@tanstack/react-router";

import { GoogleButton } from "@/components/user/google-button";
import { LoyaltyCard } from "@/components/user/loyalty-card";
import { authClient } from "@/lib/auth/client";
import { VOTI, count } from "@/lib/plural";
import { userQueries } from "@/lib/user/queries";

export const Route = createFileRoute("/accedi")({
	beforeLoad: async ({ context }) => {
		const { viewer } = await context.queryClient.ensureQueryData(userQueries.viewer());
		if (viewer && !viewer.isAnonymous) throw redirect({ to: "/profilo" });
	},
	head: () => ({ meta: [{ title: "Prendi la tua tessera · Zuppapp" }] }),
	component: SignIn,
});

// Only what an account really gives today; the duel and the reports join when they exist.
const REASONS = [
	"I tuoi voti ti seguono su ogni telefono e computer.",
	"Scegli il tuo nome e la tua faccia.",
];

function SignIn() {
	const { data } = useQuery(userQueries.viewer());
	const [pending, setPending] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const viewer = data?.viewer;
	const votes = viewer?.votesCount ?? 0;

	async function signIn() {
		setPending(true);
		setError(null);
		const { error } = await authClient.signIn.social({
			provider: "google",
			callbackURL: "/profilo",
		});
		// On success the browser is already on its way to Google.
		if (error) {
			setPending(false);
			setError("Google non ha risposto. Riprova tra un momento.");
		}
	}

	return (
		<>
			<main className="mx-auto grid max-w-4xl grid-cols-[minmax(0,1fr)] gap-10 px-4 pt-14 md:min-h-[calc(100dvh-8rem)] md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] md:items-center md:gap-16 md:py-12">
				{/* The card first on a phone, beside the words on a wide screen: it is what you get. */}
				<div className="flex justify-center md:order-last">
					<LoyaltyCard
						userId={viewer?.id ?? "ospite"}
						name={viewer?.displayName ?? "Il tuo nome qui"}
						avatarSeed={viewer?.avatarSeed ?? "zuppapp"}
						votes={votes}
						className="motion-safe:-rotate-2"
					/>
				</div>

				<div className="flex flex-col gap-6">
					<div className="flex flex-col gap-3">
						<h1 className="font-display text-title sm:text-display font-semibold">
							Prendi la tua tessera
						</h1>
						<p className="text-lead">È gratis e la fai con il tuo account Google.</p>
					</div>

					<ul className="flex flex-col gap-2">
						{REASONS.map(reason => (
							<li key={reason} className="text-body flex gap-3">
								<span aria-hidden className="font-semibold">
									+
								</span>
								{reason}
							</li>
						))}
					</ul>

					<div className="flex flex-col gap-3">
						<GoogleButton
							onClick={signIn}
							pending={pending}
							disabled={!data?.googleEnabled}
							className="self-start"
						/>
						{votes > 0 && (
							<p className="text-body">
								{votes === 1
									? "Il voto che hai già dato da questo browser passa sulla tessera."
									: `I ${count(votes, VOTI)} che hai già dato da questo browser passano sulla tessera.`}{" "}
								<Link to="/le-mie-zuppe" className="underline">
									Vedi le tue zuppe
								</Link>
							</p>
						)}
						{data && !data.googleEnabled && (
							<p className="text-small text-text-soft">
								L’accesso con Google non è ancora configurato su questo server.
							</p>
						)}
						{error && (
							<p role="alert" className="text-body text-danger">
								{error}
							</p>
						)}
					</div>

					<p className="text-small text-text-soft max-w-[52ch]">
						Votare resta possibile anche senza tessera. Da Google riceviamo nome ed
						email e non li mostriamo mai: qui ti chiami con il nome che scegli tu.
					</p>
				</div>
			</main>
		</>
	);
}
