import { createServerFn } from "@tanstack/react-start";

import { accountMiddleware } from "@/lib/server/middleware/auth";

import { avatarSeedSchema, nicknameSchema } from "../schemas";
import { setAvatarSeed, setNickname } from "../service";

export const setNicknameFn = createServerFn({ method: "POST" })
	.middleware([accountMiddleware])
	.validator(nicknameSchema)
	.handler(({ data, context }) => setNickname(context.user.id, data.nickname));

export const setAvatarSeedFn = createServerFn({ method: "POST" })
	.middleware([accountMiddleware])
	.validator(avatarSeedSchema)
	.handler(({ data, context }) => setAvatarSeed(context.user.id, data.seed));
