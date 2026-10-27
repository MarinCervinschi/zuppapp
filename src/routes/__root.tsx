import type { QueryClient } from "@tanstack/react-query";
import {
	HeadContent,
	Outlet,
	Scripts,
	createRootRouteWithContext,
} from "@tanstack/react-router";
import { Toaster } from "sonner";

import { SiteFooter } from "@/components/ds/site-footer";
import { ErrorPage, NotFoundPage } from "@/components/error/error-pages";
import { analyticsQueries } from "@/lib/analytics/queries";
import { THEME_INIT_SCRIPT } from "@/lib/theme";
import { userQueries } from "@/lib/user/queries";
import globalsCss from "@/styles/globals.css?url";

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
	// Who is looking, for the header of every page, and the Umami script where it is set up; fetched
	// on the server before render. Declared before head, which reads what it returns.
	loader: async ({ context }) => {
		const [, umami] = await Promise.all([
			context.queryClient.ensureQueryData(userQueries.viewer()),
			context.queryClient.ensureQueryData(analyticsQueries.umami()),
		]);
		return { umami };
	},
	head: ({ loaderData }) => ({
		meta: [
			{ charSet: "utf-8" },
			{ name: "viewport", content: "width=device-width, initial-scale=1" },
			{ title: "Zuppapp" },
			{
				name: "description",
				content: "Quale zuppa pronta è la più buona? Vota con una faccia.",
			},
		],
		links: [
			{ rel: "stylesheet", href: globalsCss },
			// The bowl on shelf yellow; the sizes come from public/, made from one CC0 glyph.
			{ rel: "icon", href: "/favicon.ico", sizes: "32x32" },
			{ rel: "icon", href: "/favicon.svg", type: "image/svg+xml" },
			{ rel: "apple-touch-icon", href: "/apple-touch-icon.png" },
			{ rel: "manifest", href: "/site.webmanifest" },
		],
		// The theme before the first paint: rendered into <head> on the server, not run by React.
		scripts: [
			{ children: THEME_INIT_SCRIPT },
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
	}),
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
	return (
		<>
			{/* The page takes the free height, so on a short page the footer still sits at the bottom.
			    A plain block, not a flex column: inside one, a centred `mx-auto` bar would shrink to its content. */}
			<div className="flex-1">
				<Outlet />
			</div>
			<SiteFooter />
			<Toaster position="bottom-center" richColors />
		</>
	);
}
