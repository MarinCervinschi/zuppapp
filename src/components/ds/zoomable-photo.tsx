import { useRef } from "react";

import { sizedImage } from "@/lib/catalog/image";
import { cn } from "@/lib/utils";

import { Button } from "./button";
import { PackPhoto } from "./pack-photo";

/**
 * A pack photo that opens large instead of leading anywhere: people tap a photo to read the
 * pack, not to change page. A native dialog, so Escape closes it and focus comes back to the
 * photo; a tap outside the picture closes it too.
 */
export function ZoomablePhoto({
	src,
	name,
	size,
	thumb = 200,
	className,
	imageClassName,
}: {
	src: string | null;
	/** The product's name: the photo's alt text and the dialog's title. */
	name: string;
	size: "thumb" | "shelf";
	/** Which Open Food Facts size to draw small; the dialog always asks for the full one. */
	thumb?: 100 | 200 | 400;
	className?: string;
	imageClassName?: string;
}) {
	const dialog = useRef<HTMLDialogElement>(null);
	if (!src) return null;

	return (
		<>
			<button
				type="button"
				onClick={() => dialog.current?.showModal()}
				aria-label={`Ingrandisci la foto di ${name}`}
				className={cn(
					"relative z-10 cursor-zoom-in transition-[scale] duration-150 ease-out motion-safe:active:scale-[0.96]",
					className
				)}
			>
				<PackPhoto
					src={sizedImage(src, thumb)}
					alt=""
					size={size}
					className={imageClassName}
				/>
			</button>
			<dialog
				ref={dialog}
				aria-label={`Foto di ${name}`}
				className="bg-ground-raised text-text m-auto max-h-[92dvh] w-[min(92vw,40rem)] max-w-none overflow-y-auto overscroll-contain p-0 backdrop:bg-black/70"
				onClick={event => {
					if (event.target === dialog.current) dialog.current.close();
				}}
			>
				<div className="flex items-center justify-between gap-4 p-3 pl-4">
					<p className="font-semicondensed text-body font-bold text-balance">{name}</p>
					<Button onClick={() => dialog.current?.close()}>Chiudi la foto</Button>
				</div>
				<div className="flex justify-center bg-white p-4">
					{/* Loaded only when opened: lazy images inside a closed dialog are never fetched. A fixed
					    height, so a small original still opens large. */}
					<img
						src={sizedImage(src, "full") ?? src}
						alt={`Confezione di ${name}`}
						loading="lazy"
						decoding="async"
						className="h-[min(70dvh,40rem)] w-auto max-w-full object-contain"
					/>
				</div>
			</dialog>
		</>
	);
}
