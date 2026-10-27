import { useEffect, useRef, useState } from "react";

import { useNavigate } from "@tanstack/react-router";

const TYPING_PAUSE_MS = 300;

/** Searches as you type, after a short pause; the text lives in the URL, page reset to 1. */
export function SearchBox({ value }: { value: string }) {
	const navigate = useNavigate({ from: "/" });
	const [text, setText] = useState(value);
	const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
	const input = useRef<HTMLInputElement>(null);

	// Back and forward change the URL under us: follow it. But not while typing: the URL holds the
	// text of the last pause, trimmed, and writing it back would drop a trailing space or, on a slow
	// render, the letters typed since.
	useEffect(() => {
		if (document.activeElement === input.current) return;
		setText(text => (text.trim() === value ? text : value));
	}, [value]);
	useEffect(() => () => clearTimeout(timer.current), []);

	function go(next: string, replace: boolean) {
		navigate({
			search: prev => ({ ...prev, q: next.trim() || undefined, pagina: undefined }),
			replace,
		});
	}

	return (
		<form
			role="search"
			onSubmit={event => {
				event.preventDefault();
				clearTimeout(timer.current);
				go(text, false);
			}}
			className="w-full"
		>
			<label htmlFor="catalog-search" className="sr-only">
				Cerca una zuppa
			</label>
			<div className="bg-ground-raised float-shadow focus-within:outline-text flex min-h-14 items-center gap-3 rounded-full px-5 focus-within:outline-3 focus-within:outline-offset-2">
				<svg
					aria-hidden
					viewBox="0 0 24 24"
					className="text-text size-5 shrink-0"
					fill="none"
					stroke="currentColor"
					strokeWidth="2"
					strokeLinecap="round"
				>
					<circle cx="11" cy="11" r="6.5" />
					<path d="M16 16l4.5 4.5" />
				</svg>
				<input
					ref={input}
					id="catalog-search"
					type="search"
					name="q"
					value={text}
					autoComplete="off"
					enterKeyHint="search"
					placeholder="minestrone, ceci, Knorr…"
					onChange={event => {
						const next = event.target.value;
						setText(next);
						clearTimeout(timer.current);
						timer.current = setTimeout(() => go(next, true), TYPING_PAUSE_MS);
					}}
					className="text-text text-body placeholder:text-text-soft min-h-12 w-full min-w-0 bg-transparent outline-none"
				/>
			</div>
		</form>
	);
}
