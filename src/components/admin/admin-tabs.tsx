import { Link } from "@tanstack/react-router";

import { KeyIcon } from "@/components/ds/icons";
import { SegmentCount, segment, segmentedBar } from "@/components/ds/segmented";
import type { AdminCounts } from "@/lib/admin/service";
import { EXACT_SEARCH } from "@/lib/catalog/schemas";
import { cn } from "@/lib/utils";

type Tab = keyof AdminCounts;

const TABS: [Tab, string][] = [
	["draft", "Bozze"],
	["published", "Pubblicati"],
	["archived", "Archiviati"],
	["reports", "Segnalazioni"],
];

/**
 * The admin's header and its queues: products by status, then the reports of products we don't
 * have. The queues are one pill bar, as the app's other tabs, that scrolls sideways on a phone.
 */
export function AdminHeader({
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
		<header className="flex flex-col gap-5">
			<div className="flex items-center gap-3">
				<span className="bg-text text-ground grid size-12 shrink-0 place-items-center rounded-full">
					<KeyIcon className="size-6" />
				</span>
				<div className="flex flex-col">
					<span className="wordmark text-wordmark text-text-soft">Zuppapp</span>
					<h1 className="font-display text-title leading-tight font-semibold">
						Gestione prodotti
					</h1>
				</div>
			</div>
			<nav
				aria-label="Code dell’admin"
				className="fade-x -mx-4 -my-1.5 [scrollbar-width:none] overflow-x-auto py-1.5 lg:mx-0 [&::-webkit-scrollbar]:hidden"
			>
				<ul className={cn(segmentedBar, "mx-4 flex w-max lg:mx-0")}>
					{TABS.map(([key, label]) => {
						const active = current === key;
						const className = segment(active);
						const content = (
							<>
								{label}
								<SegmentCount
									n={counts[key]}
									active={active}
									// Open reports wait for someone: the count stands out until the tab is open.
									className={cn(
										key === "reports" &&
											counts.reports > 0 &&
											!active &&
											"bg-field text-on-field rounded-full px-1.5 font-semibold"
									)}
								/>
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
										activeOptions={{ ...EXACT_SEARCH, exact: true }}
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
		</header>
	);
}
