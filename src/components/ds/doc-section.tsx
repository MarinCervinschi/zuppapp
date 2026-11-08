/**
 * A section of a page that is only words (`/dati`, `/privacy`): a heading and paragraphs or
 * lists at reading width. Links inside are underlined, as everywhere in body text.
 */
export function DocSection({
	title,
	children,
}: {
	title: string;
	children: React.ReactNode;
}) {
	return (
		<section className="text-body flex flex-col gap-3 [&_a]:underline [&_ul]:flex [&_ul]:list-disc [&_ul]:flex-col [&_ul]:gap-2 [&_ul]:pl-5">
			<h2 className="font-display text-lead font-semibold">{title}</h2>
			{children}
		</section>
	);
}
