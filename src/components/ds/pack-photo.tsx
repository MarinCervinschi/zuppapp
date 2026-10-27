import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

/**
 * The pack's photo, whole unless the caller crops it, on a white plate with rounded corners:
 * white, because the photos from Open Food Facts are shot on white. No photo, no plate. Until it
 * arrives it is invisible and its `.plate` shimmers; then it fades in.
 */
export function PackPhoto({
	src,
	alt,
	size,
	className,
}: {
	src: string | null;
	alt: string;
	size: "thumb" | "shelf";
	className?: string;
}) {
	const image = useRef<HTMLImageElement>(null);
	const [loaded, setLoaded] = useState(false);
	// A photo that loaded before React hydrated fired its load event unheard.
	useEffect(() => {
		if (image.current?.complete) setLoaded(true);
	}, []);

	if (!src) return null;
	return (
		<img
			ref={image}
			src={src}
			alt={alt}
			loading={size === "thumb" ? "lazy" : undefined}
			decoding="async"
			data-loaded={loaded}
			onLoad={() => setLoaded(true)}
			onError={() => setLoaded(true)}
			className={cn(
				"bg-white object-contain transition-opacity duration-300 data-[loaded=false]:opacity-0",
				size === "thumb" ? "rounded-thumb size-16 shrink-0" : "max-h-64 w-auto",
				className
			)}
		/>
	);
}
