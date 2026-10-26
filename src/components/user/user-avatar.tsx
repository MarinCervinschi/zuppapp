import { useMemo } from "react";

import { avatarDataUri } from "@/lib/avatar/dicebear";
import { cn } from "@/lib/utils";

/**
 * A voter's Critters face, drawn in the browser from its seed (about 5 KB of style, gzipped).
 * Square, on the raised paper, like every other object in the system. Decorative: the name
 * beside it says who it is.
 */
export function UserAvatar({ seed, className }: { seed: string; className?: string }) {
	const src = useMemo(() => avatarDataUri(seed, 96), [seed]);
	return (
		<img
			src={src}
			alt=""
			width={96}
			height={96}
			className={cn("bg-ground-raised size-10 shrink-0", className)}
		/>
	);
}
