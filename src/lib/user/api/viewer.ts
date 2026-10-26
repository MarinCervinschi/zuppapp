import { createServerFn } from "@tanstack/react-start";

import { isGoogleEnabled } from "@/lib/auth/server";
import { optionalUserMiddleware } from "@/lib/server/middleware/auth";

import { getViewer } from "../service";

/** Who is looking, or null before their first vote; plus whether Google sign-in is set up. */
export const viewerFn = createServerFn({ method: "GET" })
	.middleware([optionalUserMiddleware])
	.handler(async ({ context }) => ({
		viewer: context.user ? await getViewer(context.user.id) : null,
		googleEnabled: isGoogleEnabled(),
	}));
