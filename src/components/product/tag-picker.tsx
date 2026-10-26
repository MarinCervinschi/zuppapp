import { Sticker } from "@/components/ds/sticker";
import type { TagOption } from "@/lib/catalog/types";
import { MAX_TAGS_PER_VOTE } from "@/lib/voting/schemas";

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
		<fieldset className="flex flex-col gap-3">
			<legend className="text-body mb-3 font-semibold">
				Due parole in più?{" "}
				<span className="text-text-soft font-normal">
					{full ? "Hai scelto le tue tre." : `Fino a ${MAX_TAGS_PER_VOTE}.`}
				</span>
			</legend>
			<div className="flex flex-wrap gap-2">
				{options.map(tag => {
					const on = selected.includes(tag.id);
					return (
						<Sticker
							key={tag.id}
							tone={tag.sentiment}
							pressed={on}
							disabled={!on && full}
							onClick={() => toggle(tag.id)}
						>
							{tag.label}
						</Sticker>
					);
				})}
			</div>
		</fieldset>
	);
}
