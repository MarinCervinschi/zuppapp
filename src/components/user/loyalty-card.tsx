import { Barcode } from "@/components/ds/barcode";
import { VOTI, count } from "@/lib/plural";
import { loyaltyCode } from "@/lib/user/loyalty";
import { cn } from "@/lib/utils";

import { UserAvatar } from "./user-avatar";

/**
 * The Zuppapp card, set like a supermarket loyalty card: credit-card proportions, the shelf
 * yellow, the voter's face and name, and a real barcode. Signing in is "taking your card".
 */
export function LoyaltyCard({
	userId,
	name,
	avatarSeed,
	votes,
	className,
}: {
	/** The card's number comes from it; a visitor who never voted gets a specimen card. */
	userId: string;
	name: string;
	avatarSeed: string;
	votes: number;
	className?: string;
}) {
	const code = loyaltyCode(userId);
	return (
		<figure
			aria-label={`Tessera di ${name}`}
			className={cn(
				"bg-field on-field flex aspect-[1.586] w-full max-w-md flex-col justify-between p-4 sm:p-6",
				className
			)}
		>
			<div className="flex items-baseline justify-between gap-3">
				<span className="font-condensed text-lead font-black uppercase">Zuppapp</span>
				<span className="label-caps text-small">Tessera assaggiatore</span>
			</div>
			<div className="flex items-center gap-3">
				<UserAvatar seed={avatarSeed} className="size-14 bg-white sm:size-20" />
				<div className="flex min-w-0 flex-col">
					<span className="font-semicondensed text-lead truncate font-bold">
						{name}
					</span>
					<span className="text-small">
						{votes > 0 ? `${count(votes, VOTI)} sulla tessera` : "Nessun voto, ancora"}
					</span>
				</div>
			</div>
			<Barcode ean={code} caption={`N. ${code}`} aria-hidden className="self-start" />
		</figure>
	);
}
