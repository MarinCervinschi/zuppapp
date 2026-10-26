import { useEffect, useRef, useState } from "react";

import { useNavigate } from "@tanstack/react-router";

const TYPING_PAUSE_MS = 300;

/** Searches as you type, after a short pause; the text lives in the URL, page reset to 1. */
export function SearchBox({ value }: { value: string }) {
	const navigate = useNavigate({ from: "/" });
	const [text, setText] = useState(value);
	const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

	// Back and forward change the URL under us: follow it.
	useEffect(() => setText(value), [value]);
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
			className="flex flex-col gap-2"
		>
			<label htmlFor="catalog-search" className="text-body font-semibold">
				Cerca una zuppa
			</label>
			<input
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
				className="bg-ground text-text text-body placeholder:text-text-soft border-text min-h-12 w-full border-b-[3px] px-4"
			/>
		</form>
	);
}
