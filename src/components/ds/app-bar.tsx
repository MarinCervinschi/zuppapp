import { Link } from "@tanstack/react-router";

/** A plain bar: the wordmark, and on inner pages the way back. No chrome. */
export function AppBar({ back = false }: { back?: boolean }) {
	return (
		<header className="mx-auto flex max-w-xl items-center justify-between px-4 pt-4">
			<Link
				to="/"
				className="font-condensed text-lead font-black uppercase no-underline"
			>
				Zuppapp
			</Link>
			{back && (
				<Link to="/" className="text-body min-h-11 content-center underline">
					Tutte le zuppe
				</Link>
			)}
		</header>
	);
}
