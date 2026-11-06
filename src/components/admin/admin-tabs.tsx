import { Link } from "@tanstack/react-router";

import type { AdminCounts } from "@/lib/admin/service";
import { cn } from "@/lib/utils";

type Tab = keyof AdminCounts;

const TABS: [Tab, string][] = [
	["draft", "Bozze"],
	["published", "Pubblicati"],
	["archived", "Archiviati"],
	["reports", "Segnalazioni"],
];

const tab =
	"text-body inline-flex min-h-11 items-center gap-2 rounded-full px-4 font-medium no-underline";

/** The admin's queues: products by status, then the reports of products we don't have. */
export function AdminTabs({
	counts,
	current,
	q,
	onChange,
}: {
	counts: AdminCounts;
	current: Tab;
	/** The search, kept from tab to tab: a product not found here may be in another. */
	q?: string;
	onChange?: () => void;
}) {
	return (
		<nav aria-label="Code dell’admin">
			<ul className="flex flex-wrap gap-2">
				{TABS.map(([key, label]) => {
					const active = current === key;
					const className = cn(
						tab,
						active ? "bg-text text-ground" : "bg-ground-raised hover:bg-text/10"
					);
					const content = (
						<>
							{label}
							<span
								className={cn(
									"text-small tabular-nums",
									active ? "text-ground/80" : "text-text-soft"
								)}
							>
								{counts[key]}
							</span>
						</>
					);
					return (
						<li key={key}>
							{key === "reports" ? (
								<Link
									to="/admin/segnalazioni"
									aria-current={active ? "page" : undefined}
									className={className}
								>
									{content}
								</Link>
							) : (
								<Link
									to="/admin"
									search={{ stato: key === "draft" ? undefined : key, q }}
									aria-current={active ? "page" : undefined}
									onClick={onChange}
									className={className}
								>
									{content}
								</Link>
							)}
						</li>
					);
				})}
			</ul>
		</nav>
	);
}
