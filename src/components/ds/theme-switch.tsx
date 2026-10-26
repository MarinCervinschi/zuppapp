import { useEffect, useState } from "react";

import { THEME_EVENT, type ThemeChoice, applyTheme, readTheme } from "@/lib/theme";
import { cn } from "@/lib/utils";

const CHOICES: { value: ThemeChoice; label: string }[] = [
	{ value: "system", label: "Sistema" },
	{ value: "light", label: "Chiaro" },
	{ value: "dark", label: "Scuro" },
];

/**
 * Sistema · Chiaro · Scuro: three segments of one radio group, the chosen one inked in. The
 * arrow keys move between them, as in any radio group.
 */
export function ThemeSwitch({ className }: { className?: string }) {
	// The server cannot know the stored choice: render "Sistema", then read it once mounted.
	const [choice, setChoice] = useState<ThemeChoice>("system");
	useEffect(() => {
		setChoice(readTheme());
		const follow = (event: Event) =>
			setChoice((event as CustomEvent<ThemeChoice>).detail);
		window.addEventListener(THEME_EVENT, follow);
		return () => window.removeEventListener(THEME_EVENT, follow);
	}, []);

	function pick(next: ThemeChoice) {
		applyTheme(next);
	}

	return (
		<div
			role="radiogroup"
			aria-label="Tema"
			className={cn("bg-ground-raised inline-flex p-1", className)}
		>
			{CHOICES.map(({ value, label }, index) => {
				const on = choice === value;
				return (
					<button
						key={value}
						type="button"
						role="radio"
						aria-checked={on}
						tabIndex={on ? 0 : -1}
						onClick={() => pick(value)}
						onKeyDown={event => {
							const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[
								event.key
							];
							if (!step) return;
							event.preventDefault();
							const next = (index + step + CHOICES.length) % CHOICES.length;
							pick(CHOICES[next].value);
							(
								event.currentTarget.parentElement?.children[next] as
									HTMLElement | undefined
							)?.focus();
						}}
						className={cn(
							"text-body min-h-11 px-4 font-semibold transition-[background-color] duration-150",
							on ? "bg-text text-ground" : "hover:bg-text/10"
						)}
					>
						{label}
					</button>
				);
			})}
		</div>
	);
}
