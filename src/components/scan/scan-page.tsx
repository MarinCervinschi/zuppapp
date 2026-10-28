import { PageHead } from "@/components/ds/page-head";

/** The frame of both scan screens: the camera and a code's result. */
export function ScanPage({ children }: { children: React.ReactNode }) {
	return (
		<>
			<PageHead blob="pea" title="Scansiona una zuppa">
				<p>Dal codice a barre alla scheda, per votarla al volo.</p>
			</PageHead>
			<main className="mx-auto flex max-w-md flex-col gap-8 px-4">{children}</main>
		</>
	);
}
