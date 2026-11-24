import {
	type ReactNode,
	Suspense,
	lazy,
	useEffect,
	useLayoutEffect,
	useRef,
	useState,
} from "react";

import gsap from "gsap";
import Lenis from "lenis";

import { formatStars } from "@/lib/format";
import { type LandingData, podiumLine } from "@/lib/landing/facts";
import { VOTI, ZUPPE, count } from "@/lib/plural";

import { director, gFromScroll, reduced, rimRadiusPx, smooth, starsAt } from "./story";

// «Presentazione ufficiale»: the landing. The words are plain HTML, rendered on the server and
// read by everyone; the 3D (three.js, in its own chunk) loads after the page and only decorates.
// One clock, G, runs the whole story: the scene number plus the progress inside it (story.ts).

const Stage = lazy(() => import("./stage"));

const STAR_NAMES = ["Mai più", "Si mangia", "Niente male", "Buona", "La ricompro"];
const STRIKES = [3.46, 3.58, 3.7];
const INGREDIENTI = { one: "ingrediente", other: "ingredienti" };

/** The three promises on the brick, and what a real label says next to them. */
function claimsOf(label: LandingData["label"]) {
	return [
		{
			claim: "Come fatta in casa",
			fact: label ? count(label.ingredients, INGREDIENTI) : "ingredienti in etichetta",
		},
		{ claim: "Ricca di verdure", fact: label?.veg ?? "verdure senza percentuale" },
		{
			claim: "Ricetta tradizionale",
			fact: label?.nutriscore
				? `Nutri-Score ${label.nutriscore}`
				: "Nutri-Score assente",
		},
	];
}

/** A block of copy on screen between two values of G. */
function Beat({
	from,
	to,
	children,
	className = "",
}: {
	from: number;
	to: number;
	children: ReactNode;
	className?: string;
}) {
	return (
		<div className={`beat ${className}`} data-from={from} data-to={to}>
			{children}
		</div>
	);
}

/** The bowl of the icon, for a soup without a photo. */
function BowlIcon() {
	return (
		<svg viewBox="0 0 32 32" aria-hidden>
			<circle cx="16" cy="16" r="13.5" fill="#16120f" />
			<circle cx="16" cy="16" r="10" fill="#ff6a13" />
			<path
				d="M15 16a1 1 0 1 1 2 0a3.2 3.2 0 1 1-6.4 0a5.5 5.5 0 1 1 11 0"
				fill="none"
				stroke="#f8f2ea"
				strokeWidth="2"
				strokeLinecap="round"
			/>
		</svg>
	);
}

export function Landing({ data }: { data: LandingData }) {
	const claims = claimsOf(data.label);
	const taste = data.toTaste;
	const missing = taste ? Math.max(1, data.minVotes - taste.votes) : 0;
	const root = useRef<HTMLDivElement>(null);
	const iris = useRef<HTMLDivElement>(null);
	const lenisRef = useRef<Lenis | null>(null);
	const [mounted, setMounted] = useState(false);
	const [ready, setReady] = useState(false);

	useEffect(() => setMounted(true), []);

	// Scroll → G → every overlay, once per frame.
	useEffect(() => {
		const el = root.current!;
		const lenis = new Lenis(reduced ? { lerp: 1, smoothWheel: false } : { lerp: 0.09 });
		lenisRef.current = lenis;
		if (!reduced) lenis.stop();

		const beats = [...el.querySelectorAll<HTMLElement>(".beat")];
		const laser = el.querySelector<HTMLElement>(".laser")!;
		const claimEls = [...el.querySelectorAll<HTMLElement>(".claim")];
		const stars = [...el.querySelectorAll<HTMLElement>(".star")];
		const starName = el.querySelector<HTMLElement>(".star-name")!;
		const fill = el.querySelector<HTMLElement>(".fill")!;

		const tick = (time: number) => {
			lenis.raf(time * 1000);
			const G = gFromScroll(lenis.scroll, innerHeight);
			director.G = G;

			for (const b of beats) {
				const from = +b.dataset.from!;
				const to = +b.dataset.to!;
				const fadeIn = from <= 1 ? director.settle : smooth(from, from + 0.04, G);
				const v = fadeIn * (1 - smooth(to - 0.04, to, G));
				b.style.opacity = String(v);
				b.style.transform = `translateY(${(1 - fadeIn) * 24 - (G > to - 0.04 ? (1 - v) * 24 : 0)}px)`;
				b.style.visibility = v < 0.01 ? "hidden" : "visible";
			}

			// Scene 3: the laser of the scanner runs down and strikes the promises out. On a phone
			// the brick sits in the top half, above the words, and the laser stays there.
			const run = smooth(3.36, 3.8, G);
			const narrow = innerWidth / innerHeight < 1.1;
			laser.style.opacity = String(smooth(3.34, 3.38, G) * (1 - smooth(3.86, 3.92, G)));
			laser.style.transform = `translateY(${narrow ? 7 + run * 36 : 18 + run * 56}vh)`;
			claimEls.forEach((c, i) => c.classList.toggle("struck", G > STRIKES[i]));

			// Scene 4: the stars fill one by one.
			const given = starsAt(G);
			stars.forEach((s, i) => s.classList.toggle("on", given >= i + 1));
			const n = Math.floor(given);
			starName.textContent = n > 0 ? STAR_NAMES[n - 1] : "Tocca una stella";

			// Scenes 5 and 6: the soup fills the screen and is the ground of the podium.
			const up = smooth(5.8, 5.98, G);
			const away = smooth(6.9, 7.0, G);
			fill.style.transform = `translateY(${(1 - up) * 105 + away * 105}%)`;
		};
		gsap.ticker.add(tick);
		gsap.ticker.lagSmoothing(0);
		return () => {
			gsap.ticker.remove(tick);
			lenis.destroy();
		};
	}, []);

	// The preloader is the icon: yellow, with a round hole exactly on the bowl's rim. Once the 3D
	// draws, the swirl writes itself in the soup and the yellow opens like an iris.
	useLayoutEffect(() => {
		const el = iris.current!;
		const setHole = (r: number) => el.style.setProperty("--r", `${r}px`);
		if (reduced) {
			director.swirl = 1;
			director.settle = 1;
			el.classList.add("open");
			return;
		}
		if (!ready) {
			setHole(0);
			return;
		}
		const rim = rimRadiusPx(innerWidth, innerHeight) - 1;
		setHole(rim);
		const ctx = gsap.context(() => {
			const s = { swirl: 0, r: rim, settle: 0 };
			gsap
				.timeline({ delay: 0.2 })
				.to(s, {
					swirl: 1,
					duration: 1.4,
					ease: "power2.inOut",
					onUpdate: () => void (director.swirl = s.swirl),
				})
				.to(
					s,
					{
						r: Math.hypot(innerWidth, innerHeight),
						duration: 0.9,
						ease: "power3.in",
						onUpdate: () => setHole(s.r),
						onComplete: () => {
							el.classList.add("open");
							lenisRef.current?.start();
						},
					},
					"+=0.2"
				)
				.to(
					s,
					{
						settle: 1,
						duration: 1.2,
						ease: "power3.inOut",
						onUpdate: () => void (director.settle = s.settle),
					},
					"-=0.3"
				);
		});
		return () => ctx.revert();
	}, [ready]);

	// The button: the iris closes on it, then the soup's page opens, where the vote is.
	const vote = (e: React.MouseEvent<HTMLAnchorElement>) => {
		if (reduced || e.metaKey || e.ctrlKey || e.shiftKey) return;
		e.preventDefault();
		const href = e.currentTarget.href;
		const el = iris.current!;
		const rect = e.currentTarget.getBoundingClientRect();
		el.style.setProperty("--x", `${rect.left + rect.width / 2}px`);
		el.style.setProperty("--y", `${rect.top + rect.height / 2}px`);
		el.classList.remove("open");
		const s = { r: Math.hypot(innerWidth, innerHeight) };
		gsap.to(s, {
			r: 0,
			duration: 0.7,
			ease: "power3.inOut",
			onUpdate: () => el.style.setProperty("--r", `${s.r}px`),
			onComplete: () => void (location.href = href),
		});
	};

	return (
		<div ref={root} className="landing">
			<div className="fill" aria-hidden />

			<div className="stage" aria-hidden>
				{mounted && (
					<Suspense fallback={null}>
						<Stage podiumCount={data.podium.length} onReady={() => setReady(true)} />
					</Suspense>
				)}
			</div>

			<main className="overlays">
				<Beat from={1.0} to={1.42}>
					<p className="wordmark">ZUPPAPP</p>
					<h1 className="title">Presentiamo la zuppa pronta.*</h1>
					<p className="note">*Esisteva già. Adesso però si vota.</p>
				</Beat>
				<Beat from={1.48} to={1.9}>
					<h2 className="title">Mescolarla non la rende migliore.*</h2>
					<p className="note">*Votarla, invece, aiuta chi la compra dopo di te.</p>
				</Beat>

				<Beat from={2.04} to={2.5}>
					<h2 className="title">{count(data.total, ZUPPE)} pronte.</h2>
					<p className="note">
						Brick, buste, vaschette, vasetti. Tutte con una bella foto davanti.
					</p>
				</Beat>
				<Beat from={2.5} to={2.92}>
					<h2 className="title">Nessuna ti dice se è buona.</h2>
				</Beat>

				<Beat from={3.04} to={3.34}>
					<h2 className="title">Leggiamo l’etichetta.*</h2>
					<p className="note">*Quella dietro, scritta piccola.</p>
				</Beat>
				<Beat from={3.36} to={3.96}>
					<h2 className="title small">Cosa promette. Cosa c’è.</h2>
					<ul className="claims">
						{claims.map(c => (
							<li className="claim" key={c.claim}>
								<s>{c.claim}</s> <b>{c.fact}</b>
							</li>
						))}
					</ul>
					<p className="note">
						Inquadri il codice a barre, il resto lo leggiamo noi.
						{data.label &&
							` I dati sono veri: ${data.label.name}${data.label.brand ? ` (${data.label.brand})` : ""}, da Open Food Facts.`}
					</p>
				</Beat>

				<Beat from={4.04} to={4.96}>
					<h2 className="title small">Com’era?</h2>
					<div className="panel">
						<div className="stars">
							{STAR_NAMES.map((name, i) => (
								<span
									key={name}
									className="star"
									aria-label={`${i + 1} stelle: ${name}`}
								>
									★
								</span>
							))}
						</div>
						<p className="star-name" />
					</div>
				</Beat>
				<Beat from={4.16} to={4.5} className="aside">
					<p className="note">Una stella. Se lo merita.</p>
				</Beat>
				<Beat from={4.52} to={4.96} className="aside">
					<p className="note">
						Cinque stelle e torna in vetrina. Un tocco e hai votato.
					</p>
				</Beat>

				<Beat from={5.04} to={5.5}>
					<h2 className="title">Senza account.*</h2>
					<p className="note">*Non ti chiediamo nemmeno come ti chiami.</p>
				</Beat>
				<Beat from={5.5} to={5.96}>
					<h2 className="title">Ogni voto finisce in classifica.</h2>
				</Beat>

				<Beat from={6.04} to={6.5} className="on-fill">
					<h2 className="title">La classifica la fanno i voti.</h2>
					<p className="note">Un 5 da due voti non batte un 4,7 da quaranta.</p>
				</Beat>
				<Beat from={6.5} to={6.96} className="on-fill">
					<h2 className="title">{podiumLine(data.podium.length, data.minVotes)}</h2>
					{data.podium.length > 0 ? (
						<ol className="podium-list">
							{data.podium.map((p, i) => (
								<li key={p.ean}>
									<span className="place">{i + 1}</span>
									<span>
										{p.name}
										{p.brand && <span className="soft"> · {p.brand}</span>}
									</span>
									<span className="score">
										{formatStars(p.mean)} ★ · {count(p.votes, VOTI)}
									</span>
								</li>
							))}
						</ol>
					) : (
						<p className="note">
							Servono {count(data.minVotes, VOTI)} per salire sul podio.
						</p>
					)}
				</Beat>

				<Beat from={7.02} to={9.2} className="cta">
					{taste && (
						<div className="card">
							<div className="photo">
								{taste.imageUrl ? <img src={taste.imageUrl} alt="" /> : <BowlIcon />}
							</div>
							<p className="name">{taste.name}</p>
							<p className="tiny">
								{[taste.brand, taste.quantity].filter(Boolean).join(" · ")}
							</p>
							<p className="note">
								{missing === 1
									? "Le manca un voto"
									: `Le mancano ${count(missing, VOTI)}`}{" "}
								per entrare in classifica.
							</p>
							<a className="vote" href={`/prodotti/${taste.ean}`} onClick={vote}>
								Vota questa zuppa
							</a>
							<p className="tiny">Senza account. Un tocco.</p>
						</div>
					)}
				</Beat>

				<Beat from={8.0} to={9.1} className="credits">
					<p>
						Dati delle zuppe: Open Food Facts, licenza ODbL. Foto delle confezioni: CC
						BY-SA.
					</p>
					<p>Nessun minestrone è stato maltrattato durante le riprese.</p>
				</Beat>
			</main>

			<div className="laser" aria-hidden />
			<div ref={iris} className="iris" aria-hidden />
			{/* The page's length: the story is told over TOTAL_VH of scroll (in landing.css). */}
			<div className="track" />
		</div>
	);
}
