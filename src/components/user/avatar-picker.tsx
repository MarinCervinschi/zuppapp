import { useState } from "react";

import { useSetAvatarSeed } from "@/lib/user/mutations";
import { cn } from "@/lib/utils";

import { UserAvatar } from "./user-avatar";

const CHOICES = 12;

/**
 * Twelve Critters to choose from, seeded from the user id so the same faces come back; «Altre
 * facce» deals the next twelve. A radio group: picking one saves it.
 */
export function AvatarPicker({
	userId,
	current,
	onRaised = false,
}: {
	userId: string;
	current: string;
	/** On a raised panel the unchosen faces step down to the ground. */
	onRaised?: boolean;
}) {
	const [round, setRound] = useState(0);
	const save = useSetAvatarSeed();
	const seeds = Array.from(
		{ length: CHOICES },
		(_, i) => `${userId}:${round * CHOICES + i}`
	);

	return (
		<fieldset className="flex flex-col gap-4">
			<legend className="font-display text-lead mb-4 font-medium">La tua faccia</legend>
			<div
				role="radiogroup"
				aria-label="Scegli la tua faccia"
				className="grid grid-cols-4 gap-2 sm:grid-cols-6"
			>
				{seeds.map((seed, index) => {
					const chosen = seed === current;
					return (
						<button
							key={seed}
							type="button"
							role="radio"
							aria-checked={chosen}
							aria-label={`Faccia ${index + 1}`}
							disabled={save.isPending}
							onClick={() => save.mutate(seed)}
							className={cn(
								"flex aspect-square items-center justify-center rounded-full p-1 transition-[background-color,scale] duration-150 ease-out motion-safe:active:scale-[0.96]",
								chosen
									? "bg-text"
									: cn(onRaised ? "bg-ground" : "bg-ground-raised", "hover:bg-text/10")
							)}
						>
							<UserAvatar seed={seed} className="size-full bg-transparent" />
						</button>
					);
				})}
			</div>
			<button
				type="button"
				onClick={() => setRound(value => value + 1)}
				className="text-body min-h-11 self-start font-medium underline"
			>
				Altre facce
			</button>
		</fieldset>
	);
}
