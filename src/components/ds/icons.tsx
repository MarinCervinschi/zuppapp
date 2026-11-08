// The app's line icons: one 24 px grid, a 1.6 stroke in the text colour, always next to a word or
// with a name for screen readers (they are aria-hidden themselves).

type IconProps = { className?: string };

/** The heart's outline, filled or stroked by whoever draws it (the heart button, the profile). */
export const HEART_PATH =
	"M12 20.5s-7.5-4.6-7.5-10.1A4.4 4.4 0 0 1 12 7.6a4.4 4.4 0 0 1 7.5 2.8c0 5.5-7.5 10.1-7.5 10.1Z";

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

export function TrashIcon({ className }: IconProps) {
	return (
		<Line className={className}>
			<path d="M4 7h16M9.5 7V4.5h5V7" />
			<path d="M6 7l1 12.5A1.5 1.5 0 0 0 8.5 21h7a1.5 1.5 0 0 0 1.5-1.5L18 7" />
			<path d="M10 11v6M14 11v6" />
		</Line>
	);
}

export function ShieldIcon({ className }: IconProps) {
	return (
		<Line className={className}>
			<path d="M12 3.5 5 6v5.5c0 4.4 3 7.6 7 9 4-1.4 7-4.6 7-9V6Z" />
			<path d="m9 12 2 2 4-4" />
		</Line>
	);
}

export function DownloadIcon({ className }: IconProps) {
	return (
		<Line className={className}>
			<path d="M12 4v11M7 10.5 12 15.5l5-5" />
			<path d="M5 19.5h14" />
		</Line>
	);
}

// The digits of a path look like an IP address to the public scan.
const GITHUB_PATH =
	"M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8Z"; // check-public: allow

/** GitHub's mark, filled: a logo is drawn as its owner draws it, not in our line style. */
export function GitHubIcon({ className }: IconProps) {
	return (
		<svg aria-hidden viewBox="0 0 16 16" fill="currentColor" className={className}>
			<path d={GITHUB_PATH} />
		</svg>
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

export function InfoIcon({ className }: IconProps) {
	return (
		<Line className={className}>
			<circle cx="12" cy="12" r="9" />
			<path d="M12 11v5M12 8h.01" />
		</Line>
	);
}

export function ChevronRightIcon({ className }: IconProps) {
	return (
		<Line className={className}>
			<path d="m9 6 6 6-6 6" />
		</Line>
	);
}

export function SunIcon({ className }: IconProps) {
	return (
		<Line className={className}>
			<circle cx="12" cy="12" r="4" />
			<path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4" />
		</Line>
	);
}
