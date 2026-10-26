import { useQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";

import { BowlFace } from "@/components/brand/bowl-face";
import { AppBar } from "@/components/ds/app-bar";
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
			<AppBar back />
			<main className="mx-auto flex max-w-xl flex-col gap-6 px-4 pt-8 pb-16">
				<div className="flex flex-col gap-1">
					<h1 className="font-condensed text-title font-black uppercase">
						Le mie zuppe
					</h1>
					{votes && votes.total > 0 && (
						<p className="text-body">{count(votes.total, VOTI)}, dal più recente.</p>
					)}
				</div>

				{anonymous && votes && votes.total > 0 && (
					<p className="bg-field on-field text-body p-4">
						Questi voti sono legati a questo browser.{" "}
						<Link to="/accedi" className="font-semibold underline">
							Accedi con Google
						</Link>{" "}
						per ritrovarli su ogni telefono e computer.
					</p>
				)}

				{!votes || votes.total === 0 ? (
					<div className="bg-ground-raised flex flex-col items-start gap-3 p-5">
						<p className="text-body font-semibold">
							Non hai ancora votato nessuna zuppa.
						</p>
						<p className="text-body">
							Qui trovi ogni zuppa che voti, con la tua faccia e le tue due parole.
						</p>
						<Link
							to="/"
							hash="da-assaggiare"
							className="bg-text text-ground text-body inline-flex min-h-12 items-center px-5 font-semibold no-underline"
						>
							Vota la prima zuppa
						</Link>
					</div>
				) : (
					<ol className={cn("flex flex-col gap-2", isPlaceholderData && "opacity-60")}>
						{votes.items.map(vote => (
							<li key={vote.productId}>
								<article className="bg-ground-raised has-[a:hover]:bg-text/10 relative grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 p-3 transition-[background-color] duration-150">
									<ZoomablePhoto
										src={vote.imageUrl}
										name={vote.name}
										size="thumb"
										thumb={100}
										imageClassName="size-14"
									/>
									<div className="flex min-w-0 flex-col gap-1">
										<Link
											to="/prodotti/$ean"
											params={{ ean: vote.ean }}
											className="font-semicondensed text-body font-bold text-balance no-underline after:absolute after:inset-0"
										>
											{vote.name}
										</Link>
										<p className="text-small text-text-soft">
											{[vote.brand, `votata il ${date.format(new Date(vote.votedAt))}`]
												.filter(Boolean)
												.join(" · ")}
										</p>
										{vote.tags.length > 0 && (
											<p className="text-small flex flex-wrap gap-x-3">
												{vote.tags.map(tag => (
													<span key={tag.label}>
														<span
															aria-hidden
															className={cn(
																"font-black",
																tag.sentiment === "positive" && "text-accent"
															)}
														>
															{SIGN[tag.sentiment]}
														</span>{" "}
														{tag.label}
													</span>
												))}
											</p>
										)}
									</div>
									<p className="flex flex-col items-center gap-1">
										<BowlFace score={vote.score} className="text-bowl-ink size-10" />
										<span className="font-semicondensed text-small text-center leading-tight font-bold">
											{SCORE_LABELS[vote.score].label}
										</span>
									</p>
								</article>
							</li>
						))}
					</ol>
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
								className="text-body min-h-11 content-center font-semibold underline"
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
								className="text-body min-h-11 content-center font-semibold underline"
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
