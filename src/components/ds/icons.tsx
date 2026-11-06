// The app's line icons: one 24 px grid, a 1.6 stroke in the text colour, always next to a word or
// with a name for screen readers (they are aria-hidden themselves).

type IconProps = { className?: string };

function Line({ className, children }: IconProps & { children: React.ReactNode }) {
	return (
		<svg
			aria-hidden
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="1.6"
			strokeLinecap="round"
			strokeLinejoin="round"
			className={className}
		>
			{children}
		</svg>
	);
}

export function BowlIcon({ className }: IconProps) {
	return (
		<Line className={className}>
			<path d="M3 12h18a9 9 0 0 1-18 0Z" />
			<path d="M8 20h8" />
			<path d="M8 4c-.6.8-.6 1.7 0 2.5s.6 1.7 0 2.5M12 3c-.6.8-.6 1.7 0 2.5s.6 1.7 0 2.5M16 4c-.6.8-.6 1.7 0 2.5s.6 1.7 0 2.5" />
		</Line>
	);
}

export function TrophyIcon({ className }: IconProps) {
	return (
		<Line className={className}>
			<path d="M7 4h10v5a5 5 0 0 1-10 0V4Z" />
			<path d="M7 6H4.5a2.5 2.5 0 0 0 2.6 3.4M17 6h2.5a2.5 2.5 0 0 1-2.6 3.4" />
			<path d="M12 14v4M8.5 20h7" />
		</Line>
	);
}

export function PersonIcon({ className }: IconProps) {
	return (
		<Line className={className}>
			<circle cx="12" cy="8" r="4" />
			<path d="M4.5 21a7.5 7.5 0 0 1 15 0" />
		</Line>
	);
}

export function ScanIcon({ className }: IconProps) {
	return (
		<Line className={className}>
			<path d="M3 8V5.5A2.5 2.5 0 0 1 5.5 3H8M16 3h2.5A2.5 2.5 0 0 1 21 5.5V8M21 16v2.5a2.5 2.5 0 0 1-2.5 2.5H16M8 21H5.5A2.5 2.5 0 0 1 3 18.5V16" />
			<path d="M7.5 8v8M10.5 8v8M13.5 8v8M16.5 8v8" />
		</Line>
	);
}

/** The admin: a key, the one who holds the keys to the catalogue. */
export function KeyIcon({ className }: IconProps) {
	return (
		<Line className={className}>
			<circle cx="8" cy="15" r="4.5" />
			<path d="m11.2 11.8 8.3-8.3M16.5 6.5l2.5 2.5M14 9l2 2" />
		</Line>
	);
}

export function PencilIcon({ className }: IconProps) {
	return (
		<Line className={className}>
			<path d="M15.5 4.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4 10.5-10.5Z" />
			<path d="m13.5 6.5 3 3" />
		</Line>
	);
}

export function CheckIcon({ className }: IconProps) {
	return (
		<Line className={className}>
			<path d="m5 12.5 4.5 4.5L19 7.5" />
		</Line>
	);
}

export function CloseIcon({ className }: IconProps) {
	return (
		<Line className={className}>
			<path d="M6 6l12 12M18 6 6 18" />
		</Line>
	);
}

export function SearchIcon({ className }: IconProps) {
	return (
		<Line className={className}>
			<circle cx="11" cy="11" r="6.5" />
			<path d="m16 16 4.5 4.5" />
		</Line>
	);
}

export function ArchiveIcon({ className }: IconProps) {
	return (
		<Line className={className}>
			<rect x="3" y="4" width="18" height="4.5" rx="1.2" />
			<path d="M5 8.5V18a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8.5M10 12.5h4" />
		</Line>
	);
}

export function UndoIcon({ className }: IconProps) {
	return (
		<Line className={className}>
			<path d="M9 14 4 9l5-5" />
			<path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11" />
		</Line>
	);
}

export function LogoutIcon({ className }: IconProps) {
	return (
		<Line className={className}>
			<path d="M14 4H6.5A2.5 2.5 0 0 0 4 6.5v11A2.5 2.5 0 0 0 6.5 20H14" />
			<path d="M10 12h10M16.5 8.5 20 12l-3.5 3.5" />
		</Line>
	);
}

export function ExternalIcon({ className }: IconProps) {
	return (
		<Line className={className}>
			<path d="M13 5h6v6M19 5l-8.5 8.5" />
			<path d="M17 14v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h4" />
		</Line>
	);
}

export function ArrowRightIcon({ className }: IconProps) {
	return (
		<Line className={className}>
			<path d="M5 12h14M13 6l6 6-6 6" />
		</Line>
	);
}

export function StarLineIcon({ className }: IconProps) {
	return (
		<Line className={className}>
			<path d="m12 3.5 2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9L12 3.5Z" />
		</Line>
	);
}

export function SettingsIcon({ className }: IconProps) {
	return (
		<Line className={className}>
			<path d="M4 7h9M17 7h3M4 17h3M11 17h9" />
			<circle cx="15" cy="7" r="2" />
			<circle cx="9" cy="17" r="2" />
		</Line>
	);
}

export function EyeIcon({ className }: IconProps) {
	return (
		<Line className={className}>
			<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
			<circle cx="12" cy="12" r="2.8" />
		</Line>
	);
}
