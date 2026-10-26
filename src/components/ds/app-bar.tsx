import { Link } from "@tanstack/react-router";

import { UserChip } from "@/components/user/user-chip";
import { cn } from "@/lib/utils";

/** A plain bar: the wordmark, the way back on inner pages, and who you are. No chrome. */
export function AppBar({
	back = false,
	wide = false,
}: {
	back?: boolean;
	/** Match a page laid out wider than the reading column, so the bar lines up with it. */
	wide?: boolean;
}) {
	return (
		<header
			className={cn(
				"mx-auto flex items-center justify-between gap-4 px-4 pt-4",
				wide ? "max-w-4xl" : "max-w-xl"
			)}
		>
			<Link
				to="/"
				className="font-condensed text-lead font-black uppercase no-underline"
			>
				Zuppapp
			</Link>
			<span className="flex items-center gap-4">
				{back && (
					<Link
						to="/"
						className="text-body min-h-11 content-center underline max-sm:hidden"
					>
						Tutte le zuppe
					</Link>
				)}
				<UserChip />
			</span>
		</header>
	);
}
