import { useQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";

import { buttonClass } from "@/components/ds/button";
import { PageHead } from "@/components/ds/page-head";
import { StarIcon } from "@/components/ds/stars";
import { ZoomablePhoto } from "@/components/ds/zoomable-photo";
import { VOTI, count } from "@/lib/plural";
import { SCORE_LABELS } from "@/lib/ranking/rules";
import { userQueries } from "@/lib/user/queries";
import { myVotesSchema } from "@/lib/user/schemas";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/le-mie-zuppe")({
	validateSearch: myVotesSchema,
	loaderDeps: ({ search }) => search,
	loader: ({ context, deps }) =>
		context.queryClient.ensureQueryData(userQueries.myVotes(deps.pagina ?? 1)),
	head: () => ({ meta: [{ title: "Le mie zuppe · Zuppapp" }] }),
	component: MyVotes,
});

const date = new Intl.DateTimeFormat("it-IT", { day: "numeric", month: "long" });
const SIGN = { positive: "+", negative: "−", neutral: "·" } as const;

function MyVotes() {
	const { pagina } = Route.useSearch();
	const page = pagina ?? 1;
	const { data: votes, isPlaceholderData } = useQuery(userQueries.myVotes(page));
	const { data: me } = useQuery(userQueries.viewer());
	const anonymous = !me?.viewer || me.viewer.isAnonymous;

	return (
		<>
			<PageHead title="Le mie zuppe">
				{votes && votes.total > 0 && (
					<p>{count(votes.total, VOTI)}, dal più recente.</p>
				)}
			</PageHead>
			<main className="mx-auto flex max-w-xl flex-col gap-6 px-4">
				{anonymous && votes && votes.total > 0 && (
					<p className="bg-field on-field text-body rounded-card p-5">
						Questi voti sono legati a questo browser.{" "}
						<Link to="/accedi" className="font-semibold underline">
							Accedi con Google
						</Link>{" "}
						per ritrovarli su ogni telefono e computer.
					</p>
				)}

				{!votes || votes.total === 0 ? (
					<div className="bg-ground-raised rounded-card flex flex-col items-start gap-3 p-6">
						<p className="text-body font-semibold">
							Non hai ancora votato nessuna zuppa.
						</p>
						<p className="text-body">
							Qui trovi ogni zuppa che voti, con le tue stelle e le tue due parole.
						</p>
						<Link to="/" hash="da-assaggiare" className={buttonClass("ink")}>
							Vota la prima zuppa
						</Link>
					</div>
				) : (
					<ol className={cn("flex flex-col", isPlaceholderData && "opacity-60")}>
						{votes.items.map(vote => (
							<li key={vote.productId} className="nutrient-row last:border-b-0">
								<article className="group relative grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 py-3">
									<ZoomablePhoto
										src={vote.imageUrl}
										name={vote.name}
										ean={vote.ean}
										size="thumb"
										thumb={100}
										imageClassName="size-14 rounded-full p-1"
									/>
									<div className="flex min-w-0 flex-col gap-1">
										<Link
											to="/prodotti/$ean"
											params={{ ean: vote.ean }}
											className="font-display text-body font-medium no-underline group-hover:underline after:absolute after:inset-0"
										>
											{vote.name}
										</Link>
										<p className="text-small text-text-soft">
											{[vote.brand, `votata il ${date.format(new Date(vote.votedAt))}`]
												.filter(Boolean)
												.join(" • ")}
										</p>
										{vote.tags.length > 0 && (
											<p className="text-small flex flex-wrap gap-x-3">
												{vote.tags.map(tag => (
													<span key={tag.label}>
														<span aria-hidden className="font-semibold">
															{SIGN[tag.sentiment]}
														</span>{" "}
														{tag.label}
													</span>
												))}
											</p>
										)}
									</div>
									<p className="flex flex-col items-end gap-0.5">
										<span className="bg-ink text-on-ink text-small inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 font-semibold tabular-nums">
											<StarIcon className="text-star size-3.5" />
											{vote.score}
											<span className="sr-only">
												{vote.score === 1 ? " stella" : " stelle"}
											</span>
										</span>
										<span className="text-small text-text-soft">
											{SCORE_LABELS[vote.score].label}
										</span>
									</p>
								</article>
							</li>
						))}
					</ol>
				)}

				{votes && votes.total > 0 && (
					// The next soup to taste is one tap away, so a short list never ends on nothing.
					<Link to="/" hash="da-assaggiare" className={cn(buttonClass(), "self-start")}>
						Vota un’altra zuppa
					</Link>
				)}

				{votes && votes.pageCount > 1 && (
					<nav
						aria-label="Pagine dei tuoi voti"
						className="flex items-center justify-between gap-3"
					>
						{page > 1 ? (
							<Link
								to="/le-mie-zuppe"
								search={{ pagina: page - 1 === 1 ? undefined : page - 1 }}
								className="text-body min-h-11 content-center font-medium underline"
							>
								‹ Indietro
							</Link>
						) : (
							<span />
						)}
						<p className="text-small text-text-soft tabular-nums">
							Pagina {page} di {votes.pageCount}
						</p>
						{page < votes.pageCount ? (
							<Link
								to="/le-mie-zuppe"
								search={{ pagina: page + 1 }}
								className="text-body min-h-11 content-center font-medium underline"
							>
								Avanti ›
							</Link>
						) : (
							<span />
						)}
					</nav>
				)}
			</main>
		</>
	);
}
