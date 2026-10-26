import { createServerFn } from "@tanstack/react-start";

import { listProducts } from "../service";

export const listProductsFn = createServerFn({ method: "GET" }).handler(() =>
	listProducts()
);
