import { Avatar, Style } from "@dicebear/core";
import critters from "@dicebear/styles/critters.json" with { type: "json" };

/** Critters, by DiceBear, under CC0 1.0. */
export const AVATAR_STYLE = "critters";

const style = new Style(critters);

/** The seed is the user's own choice when set, else the user id, so every voter has a face. */
export function avatarSeed(user: { id: string; avatarSeed?: string | null }) {
	return user.avatarSeed || user.id;
}

export function renderAvatarSvg(seed: string, size = 128): string {
	return new Avatar(style, { seed, size }).toString();
}

export function avatarDataUri(seed: string, size = 128): string {
	return new Avatar(style, { seed, size }).toDataUri();
}
