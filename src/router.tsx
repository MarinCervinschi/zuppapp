import { QueryClient } from "@tanstack/react-query";
import { createRouter as createTanStackRouter } from "@tanstack/react-router";
import { setupRouterSsrQueryIntegration } from "@tanstack/react-router-ssr-query";

import { ErrorPage, NotFoundPage } from "@/components/error/error-pages";

import { routeTree } from "./routeTree.gen";

export function getRouter() {
	const queryClient = new QueryClient({
		defaultOptions: { queries: { staleTime: 1000 * 60 } },
	});

	const router = createTanStackRouter({
		routeTree,
		context: { queryClient },
		scrollRestoration: true,
		// Positions are kept by address, not by history entry: the soup's sheet is an entry of its own
		// on the same address, and closing it (going back) must find the page where it was left.
		getScrollRestorationKey: location => location.href,
		defaultPreload: "intent",
		defaultPreloadStaleTime: 0,
		defaultErrorComponent: ErrorPage,
		defaultNotFoundComponent: NotFoundPage,
	});

	setupRouterSsrQueryIntegration({ router, queryClient });

	return router;
}

declare module "@tanstack/react-router" {
	interface Register {
		router: ReturnType<typeof getRouter>;
	}
	interface HistoryState {
		/** The EAN of the soup whose sheet is open over the page: the back button closes it. */
		zuppa?: string;
	}
}
