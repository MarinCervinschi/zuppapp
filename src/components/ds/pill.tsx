import { cn } from "@/lib/utils";

type Props = {
	children: React.ReactNode;
	pressed?: boolean;
	disabled?: boolean;
	onClick?: () => void;
	className?: string;
};

/**
 * A rounded pill on a sheet: an allergen the soup is free of, a tag, a filter. As a toggle it
 * inks in when pressed. Without `onClick` it is plain text.
 */
export function Pill({ children, pressed, disabled, onClick, className }: Props) {
	const interactive = onClick !== undefined;
	const Tag = interactive ? "button" : "span";

	return (
		<Tag
			{...(interactive
				? { type: "button" as const, "aria-pressed": pressed, disabled, onClick }
				: {})}
			className={cn(
				pillClass(pressed),
				interactive && "disabled:opacity-40",
				className
			)}
		>
			{/* A toggle shows its state twice: inked in, and a tick that draws itself. */}
			{interactive && pressed && (
				<svg aria-hidden viewBox="0 0 16 16" className="-mr-1 size-4 shrink-0">
					<path
						d="M3.5 8.5l3 3 6-7"
						fill="none"
						stroke="currentColor"
						strokeWidth="2"
						strokeLinecap="round"
						strokeLinejoin="round"
						pathLength={1}
						className="[stroke-dasharray:1] motion-safe:animate-[draw_220ms_var(--ease-out-snap)_both]"
					/>
				</svg>
			)}
			{children}
		</Tag>
	);
}

/** The pill's look, for links that are pills (filters). */
export function pillClass(pressed?: boolean) {
	return cn(
		"text-body inline-flex min-h-11 items-center gap-1.5 rounded-full px-4 no-underline",
		"transition-[scale,background-color,color] duration-150 ease-out motion-safe:not-disabled:active:scale-[0.96]",
		pressed ? "bg-text text-ground" : "bg-ground-raised text-text hover:bg-text/10"
	);
}
