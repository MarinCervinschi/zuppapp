import { useEffect } from "react";

import type { QueryClient } from "@tanstack/react-query";
import {
	HeadContent,
	Outlet,
	Scripts,
	createRootRouteWithContext,
	useMatches,
} from "@tanstack/react-router";
import { LazyMotion, MotionConfig, domAnimation } from "motion/react";

import { NavigationLoader } from "@/components/ds/bowl-loader";
import { INTRO_INIT_SCRIPT } from "@/components/ds/intro";
import { SiteFooter } from "@/components/ds/site-footer";
import { TabBar } from "@/components/ds/tab-bar";
import { AppToaster } from "@/components/ds/toaster";
import { ErrorPage, NotFoundPage } from "@/components/error/error-pages";
import { SoupSheetHost } from "@/components/product/soup-sheet";
import { analyticsQueries } from "@/lib/analytics/queries";
import { favoriteQueries } from "@/lib/favorites/queries";
import { FIRST_VISIT_SCRIPT } from "@/lib/landing/first-visit";
import { seoQueries } from "@/lib/seo/queries";
import { THEME_INIT_SCRIPT } from "@/lib/theme";
import { userQueries } from "@/lib/user/queries";
import globalsCss from "@/styles/globals.css?url";

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
	// Who is looking, their hearts (so a card never lights its heart late) and the Umami script
	// where it is set up; fetched on the server before render. Declared before head, which reads it.
	loader: async ({ context }) => {
		const [{ viewer }, , umami, site] = await Promise.all([
			context.queryClient.ensureQueryData(userQueries.viewer()),
			context.queryClient.ensureQueryData(favoriteQueries.ids()),
			context.queryClient.ensureQueryData(analyticsQueries.umami()),
			context.queryClient.ensureQueryData(seoQueries.siteUrl()),
		]);
		return { umami, site, known: viewer !== null };
	},
	head: ({ loaderData, matches }) => {
		// The page without its query: a filtered list is the same page to a search engine.
		const url = loaderData?.site ? loaderData.site + matches.at(-1)!.pathname : null;
		return {
			// The defaults for every page; a route sets the same name or property to replace one.
			meta: [
				{ charSet: "utf-8" },
				{ name: "viewport", content: "width=device-width, initial-scale=1" },
				{ title: "Zuppapp" },
				{
					name: "description",
					content: "Quale zuppa pronta è la più buona? Votala con le stelle.",
				},
				{ property: "og:site_name", content: "Zuppapp" },
				{ property: "og:locale", content: "it_IT" },
				{ property: "og:type", content: "website" },
				{ property: "og:title", content: "Zuppapp" },
				{
					property: "og:description",
					content: "Quale zuppa pronta è la più buona? Votala con le stelle.",
				},
				...(url ? [{ property: "og:url", content: url }] : []),
				// Made by `pnpm icons` with the other images in public/.
				...(loaderData?.site
					? [
							{ property: "og:image", content: `${loaderData.site}/og.png` },
							{ property: "og:image:width", content: "1200" },
							{ property: "og:image:height", content: "630" },
							{
								property: "og:image:alt",
								content: "Zuppapp: le zuppe pronte, votate con le stelle",
							},
						]
					: []),
				{ name: "twitter:card", content: "summary_large_image" },
			],
			links: [
				...(url ? [{ rel: "canonical", href: url }] : []),
				// Clash Display comes from Fontshare: its licence lets us use it, not ship its files.
				{ rel: "preconnect", href: "https://api.fontshare.com" },
				{
					rel: "preconnect",
					href: "https://cdn.fontshare.com",
					crossOrigin: "anonymous",
				},
				{
					rel: "stylesheet",
					href: "https://api.fontshare.com/v2/css?f[]=clash-display@500,600&display=swap",
				},
				{ rel: "stylesheet", href: globalsCss },
				// The pumpkin soup on corn yellow; the sizes come from public/, made by `pnpm icons`.
				{ rel: "icon", href: "/favicon.ico", sizes: "32x32" },
				{ rel: "icon", href: "/favicon.svg", type: "image/svg+xml" },
				// Google wants a multiple of 48 px for the icon beside a search result.
				{ rel: "icon", href: "/icon-192.png", sizes: "192x192", type: "image/png" },
				{ rel: "apple-touch-icon", href: "/apple-touch-icon.png" },
				{ rel: "manifest", href: "/site.webmanifest" },
			],
			// The theme before the first paint: rendered into <head> on the server, not run by React.
			scripts: [
				// First, so the presentation replaces the home before anything else runs.
				...(loaderData && !loaderData.known ? [{ children: FIRST_VISIT_SCRIPT }] : []),
				{ children: THEME_INIT_SCRIPT },
				{ children: INTRO_INIT_SCRIPT },
				...(loaderData?.umami
					? [
							{
								src: loaderData.umami.src,
								defer: true,
								"data-website-id": loaderData.umami.websiteId,
							},
						]
					: []),
			],
		};
	},
	shellComponent: RootDocument,
	component: RootLayout,
	errorComponent: ErrorPage,
	notFoundComponent: NotFoundPage,
});

function RootDocument({ children }: { children: React.ReactNode }) {
	return (
		// The theme script sets data-theme before React hydrates: the attribute is expected to differ.
		<html lang="it" suppressHydrationWarning>
			<head>
				<HeadContent />
			</head>
			<body className="flex min-h-dvh flex-col antialiased">
				{children}
				<Scripts />
			</body>
		</html>
	);
}

function RootLayout() {
	// Marks the page as live: what animates only for a page opened inside the app checks it.
	useEffect(() => {
		document.documentElement.setAttribute("data-hydrated", "");
	}, []);
	// A page that draws the whole screen itself, like the landing, gets no app chrome around it.
	const bare = useMatches({ select: matches => matches.some(m => m.staticData?.bare) });

	if (bare)
		return (
			<LazyMotion features={domAnimation} strict>
				<MotionConfig reducedMotion="user">
					<Outlet />
					<AppToaster />
				</MotionConfig>
			</LazyMotion>
		);

	return (
		// Motion's features load once for the whole app (the lighter `m` components need them), and
		// every animation follows the reader's reduced-motion setting.
		<LazyMotion features={domAnimation} strict>
			<MotionConfig reducedMotion="user">
				{/* The page takes the free height, so on a short page the footer still sits at the bottom.
			    A plain block, not a flex column: inside one, a centred `mx-auto` bar would shrink to its content. */}
				{/* On a phone there is no footer: the page itself leaves room for the tab bar. */}
				<div className="pb-tabbar flex-1 lg:pb-0">
					<Outlet />
				</div>
				<SiteFooter />
				<TabBar />
				<SoupSheetHost />
				<NavigationLoader />
				{/* At the top, away from the tab bar and the thumb. */}
				<AppToaster />
			</MotionConfig>
		</LazyMotion>
	);
}
