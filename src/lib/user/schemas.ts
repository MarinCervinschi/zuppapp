import { z } from "zod";

export const NICKNAME_MIN = 2;
export const NICKNAME_MAX = 24;

export const nicknameSchema = z.object({
	nickname: z
		.string()
		.trim()
		.min(NICKNAME_MIN, `Usa almeno ${NICKNAME_MIN} caratteri.`)
		.max(NICKNAME_MAX, `Usa al massimo ${NICKNAME_MAX} caratteri.`)
		// Letters of any language, digits, spaces and a few joiners: a name, not a link or markup.
		.regex(/^[\p{L}\p{N} '’._-]+$/u, "Usa lettere, numeri, spazi, punti o trattini."),
});

export const avatarSeedSchema = z.object({
	seed: z.string().min(1).max(80),
});

export const MY_VOTES_PAGE_SIZE = 20;

export const myVotesSchema = z.object({
	pagina: z.coerce.number().int().min(1).max(1000).optional().catch(undefined),
});
