import type { QueryClient } from "@tanstack/react-query";
import {
	HeadContent,
	Outlet,
	Scripts,
	createRootRouteWithContext,
} from "@tanstack/react-router";
import { Toaster } from "sonner";

import { ErrorPage, NotFoundPage } from "@/components/error/error-pages";
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
	}),
	shellComponent: RootDocument,
	component: RootLayout,
	errorComponent: ErrorPage,
	notFoundComponent: NotFoundPage,
});

function RootDocument({ children }: { children: React.ReactNode }) {
	return (
		<html lang="it">
			<head>
				<HeadContent />
			</head>
			<body className="min-h-dvh antialiased">
				{children}
				<Scripts />
			</body>
		</html>
	);
}

function RootLayout() {
	return (
		<>
			<Outlet />
			<Toaster position="bottom-center" richColors />
		</>
	);
}
