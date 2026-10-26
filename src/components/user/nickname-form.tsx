import { useState } from "react";

import { Button } from "@/components/ds/button";
import { useSetNickname } from "@/lib/user/mutations";
import { NICKNAME_MAX, NICKNAME_MIN, nicknameSchema } from "@/lib/user/schemas";

/** The public name. Checked here with the server's own rule, so the message sits by the field. */
export function NicknameForm({ current }: { current: string | null }) {
	const save = useSetNickname();
	const [error, setError] = useState<string | null>(null);

	return (
		<form
			className="flex flex-col gap-2"
			onSubmit={event => {
				event.preventDefault();
				const parsed = nicknameSchema.safeParse({
					nickname: new FormData(event.currentTarget).get("nickname"),
				});
				if (!parsed.success) {
					setError(parsed.error.issues[0]?.message ?? "Controlla il nome.");
					return;
				}
				setError(null);
				save.mutate(parsed.data.nickname, {
					onError: () =>
						setError("Il nome non è stato salvato. Riprova tra un momento."),
				});
			}}
		>
			<label
				htmlFor="nickname"
				className="font-condensed text-lead font-extrabold uppercase"
			>
				Il tuo nome
			</label>
			<p id="nickname-help" className="text-small text-text-soft">
				Lo vedono gli altri. Da {NICKNAME_MIN} a {NICKNAME_MAX} caratteri.
			</p>
			<div className="flex gap-2">
				<input
					id="nickname"
					name="nickname"
					defaultValue={current ?? ""}
					placeholder="Minestrone Furioso"
					maxLength={NICKNAME_MAX}
					autoComplete="nickname"
					aria-invalid={error ? true : undefined}
					aria-describedby={error ? "nickname-help nickname-error" : "nickname-help"}
					className="bg-ground-raised text-body placeholder:text-text-soft border-text min-h-12 w-full border-b-[3px] px-4"
				/>
				<Button type="submit" variant="ink" disabled={save.isPending}>
					{save.isPending ? "Salvo…" : "Salva"}
				</Button>
			</div>
			{error && (
				<p id="nickname-error" role="alert" className="text-body text-accent">
					{error}
				</p>
			)}
		</form>
	);
}
