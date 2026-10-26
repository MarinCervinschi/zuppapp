import { cn } from "@/lib/utils";

type Props = {
	children: React.ReactNode;
	className?: string;
	/** Plays the press once; off for stamps that were already there when the page loaded. */
	pressed?: boolean;
};

/**
 * The rubber stamp: your vote, inked onto the label. Red, condensed, tilted, with the
 * double frame of a real stamp. The only red on a screen besides the focus ring.
 */
export function Stamp({ children, className, pressed = false }: Props) {
	return (
		<span
			className={cn(
				"border-accent text-accent inline-block -rotate-6 border-[3px] p-[3px]",
				pressed && "animate-stamp",
				className
			)}
		>
			<span className="font-condensed border-accent text-lead block border px-2 py-0.5 leading-none font-black whitespace-nowrap uppercase">
				{children}
			</span>
		</span>
	);
}
