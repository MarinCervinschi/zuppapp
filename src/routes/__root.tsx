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
import { THEME_INIT_SCRIPT } from "@/lib/theme";
import { userQueries } from "@/lib/user/queries";
import globalsCss from "@/styles/globals.css?url";

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
	head: () => ({
		meta: [
			{ charSet: "utf-8" },
			{ name: "viewport", content: "width=device-width, initial-scale=1" },
			{ title: "Zuppapp" },
			{
				name: "description",
				content: "Quale zuppa pronta è la più buona? Vota con una faccia.",
			},
		],
		links: [{ rel: "stylesheet", href: globalsCss }],
		// The theme before the first paint: rendered into <head> on the server, not run by React.
		scripts: [{ children: THEME_INIT_SCRIPT }],
	}),
	// Who is looking, for the header of every page; fetched once, on the server, before render.
	loader: ({ context }) => context.queryClient.ensureQueryData(userQueries.viewer()),
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
			{/* The page takes the free height, so on a short page the footer still sits at the bottom. */}
			<div className="flex flex-1 flex-col">
				<Outlet />
			</div>
			<SiteFooter />
			<Toaster position="bottom-center" richColors />
		</>
	);
}
