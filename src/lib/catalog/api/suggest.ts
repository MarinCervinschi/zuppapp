import { createServerFn } from "@tanstack/react-start";

import { suggestSchema } from "../schemas";
import { suggest } from "../suggest";

export const suggestFn = createServerFn({ method: "GET" })
	.validator(suggestSchema)
	.handler(({ data }) => suggest(data.q));
