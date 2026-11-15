import { useEffect, useState } from "react";

/**
 * A number that counts up from zero when it comes into the page, then stays. The page the server
 * sent shows it whole: it only counts on a page opened inside the app (after hydration), so a
 * number already on screen never jumps back to zero. Held still with reduced motion.
 */
export function CountUp({
	value,
	format = String,
	delay = 0,
	duration = 900,
}: {
	value: number;
	format?: (value: number) => string;
	delay?: number;
	duration?: number;
}) {
	const [shown, setShown] = useState(value);

	useEffect(() => {
		const root = document.documentElement;
		if (
			!root.hasAttribute("data-hydrated") ||
			matchMedia("(prefers-reduced-motion: reduce)").matches
		) {
			setShown(value);
			return;
		}
		setShown(0);
		let frame = 0;
		const start = performance.now() + delay;
		const step = (now: number) => {
			const progress = Math.min(1, Math.max(0, (now - start) / duration));
			setShown(Math.round(value * (1 - (1 - progress) ** 3)));
			if (progress < 1) frame = requestAnimationFrame(step);
		};
		frame = requestAnimationFrame(step);
		return () => cancelAnimationFrame(frame);
	}, [value, delay, duration]);

	return <>{format(shown)}</>;
}
