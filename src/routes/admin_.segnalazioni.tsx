import { useQuery } from "@tanstack/react-query";
import { createFileRoute, notFound } from "@tanstack/react-router";

import { AdminHeader } from "@/components/admin/admin-tabs";
import { ReportGroupCard } from "@/components/admin/report-group";
import { NotFoundPage } from "@/components/error/error-pages";
import { isAdminFn } from "@/lib/admin/api";
import { adminQueries } from "@/lib/admin/queries";
import { PRODOTTI, count } from "@/lib/plural";

export const Route = createFileRoute("/admin_/segnalazioni")({
	// Like /admin: to anyone but an admin this page does not exist.
	beforeLoad: async () => {
		if (!(await isAdminFn())) throw notFound();
	},
	loader: ({ context }) => context.queryClient.ensureQueryData(adminQueries.reports()),
	head: () => ({ meta: [{ title: "Segnalazioni · Zuppapp" }] }),
	notFoundComponent: NotFoundPage,
	component: ReportsPage,
});

function ReportsPage() {
	const { data } = useQuery(adminQueries.reports());
	if (!data) return null;

	return (
		<main className="mx-auto flex max-w-3xl flex-col gap-6 px-4 pt-[max(2.5rem,env(safe-area-inset-top))]">
			<AdminHeader counts={data.counts} current="reports" />
			{data.groups.length === 0 ? (
				<p className="text-body">
					Nessuna segnalazione da guardare. Arrivano da chi scansiona una zuppa che non
					abbiamo.
				</p>
			) : (
				<>
					<p className="text-body">
						{count(data.groups.length, PRODOTTI)} da guardare, prima i più richiesti.
						Ogni scelta vale per tutte le segnalazioni dello stesso EAN.
					</p>
					<ul className="flex flex-col gap-3">
						{data.groups.map(group => (
							<ReportGroupCard key={group.ean} group={group} />
						))}
					</ul>
				</>
			)}
		</main>
	);
}
