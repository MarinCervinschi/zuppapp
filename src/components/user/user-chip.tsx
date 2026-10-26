import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";

import { userQueries } from "@/lib/user/queries";
import { cn } from "@/lib/utils";

import { UserAvatar } from "./user-avatar";

/**
 * Top right of every page: who you are. With an account, your face and name, leading to your
 * profile; without one, «Accedi», and «Le mie zuppe» as soon as you have voted once.
 */
export function UserChip({ className }: { className?: string }) {
	const { data } = useQuery(userQueries.viewer());
	const viewer = data?.viewer;
	const link = "text-body inline-flex min-h-11 items-center font-semibold";

	if (viewer && !viewer.isAnonymous) {
		return (
			<Link
				to="/profilo"
				aria-label={`Il tuo profilo, ${viewer.displayName}`}
				className={cn(link, "hover:bg-text/10 gap-2 pr-2 no-underline", className)}
			>
				<UserAvatar seed={viewer.avatarSeed} className="size-11" />
				<span className="max-w-[22ch] truncate max-sm:sr-only">
					{viewer.displayName}
				</span>
			</Link>
		);
	}

	return (
		<span className={cn("flex items-center gap-4", className)}>
			{viewer && viewer.votesCount > 0 && (
				<Link to="/le-mie-zuppe" className={cn(link, "underline")}>
					Le mie zuppe
				</Link>
			)}
			<Link to="/accedi" className={cn(link, "underline")}>
				Accedi
			</Link>
		</span>
	);
}
