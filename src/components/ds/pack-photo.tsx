import { cn } from "@/lib/utils";

/**
 * The pack as it stands on the shelf: its photo on the paper, never cropped, with the thin
 * neutral outline that keeps a white pack from melting into a light page. No photo, no box.
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
	if (!src) return null;
	return (
		<img
			src={src}
			alt={alt}
			loading={size === "thumb" ? "lazy" : undefined}
			decoding="async"
			className={cn(
				"object-contain outline-1 -outline-offset-1 outline-black/10 dark:outline-white/10",
				size === "thumb" ? "size-16 shrink-0 bg-white" : "max-h-64 w-auto",
				className
			)}
		/>
	);
}
