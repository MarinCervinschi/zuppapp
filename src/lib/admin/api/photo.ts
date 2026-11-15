import { createServerFn } from "@tanstack/react-start";

import { adminMiddleware } from "@/lib/server/middleware/auth";

import { parseProductPhotoForm } from "../schemas";
import { setProductPhoto } from "../service";

export const setProductPhotoFn = createServerFn({ method: "POST" })
	.middleware([adminMiddleware])
	.validator(parseProductPhotoForm)
	.handler(({ data }) => setProductPhoto(data));
