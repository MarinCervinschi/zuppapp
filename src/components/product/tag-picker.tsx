import { Pill } from "@/components/ds/pill";
import type { TagOption } from "@/lib/catalog/types";
import { MAX_TAGS_PER_VOTE } from "@/lib/voting/schemas";

// Meaning is told twice, so neither has to carry it alone: the group and the sign.
const SIGN = { positive: "+", negative: "−", neutral: "·" } as const;

const GROUPS = [
	{ sentiment: "positive", title: "Pro" },
	{ sentiment: "negative", title: "Contro" },
	{ sentiment: "neutral", title: "Com’è" },
] as const;

type Props = {
	options: TagOption[];
	selected: string[];
	onChange: (tagIds: string[]) => void;
};

export function TagPicker({ options, selected, onChange }: Props) {
	const full = selected.length >= MAX_TAGS_PER_VOTE;

	function toggle(id: string) {
		onChange(
			selected.includes(id) ? selected.filter(t => t !== id) : [...selected, id]
		);
	}

	return (
		<fieldset className="flex flex-col gap-5">
			<legend className="font-display text-lead mb-4 font-medium">
				Due parole in più?{" "}
				<span className="text-body text-text-soft block font-sans font-normal">
					{full
						? "Ne hai scelte tre: togline una per sceglierne un’altra."
						: `Fino a ${MAX_TAGS_PER_VOTE}, tra tutte.`}
				</span>
			</legend>
			{/* Grouped by what they say about the soup: the reasons for, against, and how it is. */}
			{GROUPS.map(group => {
				const tags = options.filter(tag => tag.sentiment === group.sentiment);
				if (tags.length === 0) return null;
				return (
					<div
						key={group.sentiment}
						role="group"
						aria-labelledby={`tags-${group.sentiment}`}
						className="flex flex-col gap-2"
					>
						<p
							id={`tags-${group.sentiment}`}
							className="text-small text-text-soft font-medium"
						>
							{group.title}
						</p>
						<div className="flex flex-wrap gap-2">
							{tags.map(tag => {
								const on = selected.includes(tag.id);
								return (
									<Pill
										key={tag.id}
										pressed={on}
										disabled={!on && full}
										onClick={() => toggle(tag.id)}
									>
										<span aria-hidden className="font-semibold">
											{SIGN[tag.sentiment]}
										</span>
										{tag.label}
									</Pill>
								);
							})}
						</div>
					</div>
				);
			})}
		</fieldset>
	);
}
