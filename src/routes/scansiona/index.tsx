import { Link, createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { z } from "zod";

import { Button } from "@/components/ds/button";
import { ScanPage } from "@/components/scan/scan-page";
import { Scanner } from "@/components/scan/scanner";

// The camera, or the code typed by hand: both land on `/scansiona/<code>`, so a result is a URL
// and the back button returns to the camera.

// Only the form without JavaScript sends `?codice=`; the router reads it as a number, so it is
// coerced back (a code with a leading zero isn't valid JSON and stays a string anyway).
const typedSchema = z.object({
	codice: z.coerce
		.string()
		.regex(/^\d{8,14}$/)
		.optional()
		.catch(undefined),
});

export const Route = createFileRoute("/scansiona/")({
	validateSearch: typedSchema,
	beforeLoad: ({ search }) => {
		if (search.codice)
			throw redirect({ to: "/scansiona/$codice", params: { codice: search.codice } });
	},
	head: () => ({ meta: [{ title: "Scansiona · Zuppapp" }] }),
	component: Camera,
});

function Camera() {
	const navigate = useNavigate();

	return (
		<ScanPage>
			<Scanner
				onCode={code =>
					navigate({ to: "/scansiona/$codice", params: { codice: code } })
				}
			/>
			{/* A plain GET form: it works without the camera, and without JavaScript. */}
			<form
				method="get"
				action="/scansiona"
				onSubmit={event => {
					event.preventDefault();
					const code = new FormData(event.currentTarget).get("codice");
					navigate({ to: "/scansiona/$codice", params: { codice: String(code) } });
				}}
				className="flex flex-col gap-2"
			>
				<label htmlFor="scan-code" className="text-body font-semibold">
					Le cifre sotto il codice a barre
				</label>
				<div className="flex gap-2">
					<input
						id="scan-code"
						name="codice"
						inputMode="numeric"
						autoComplete="off"
						required
						pattern="\d{8,14}"
						maxLength={14}
						placeholder="8001234567890"
						className="bg-ground-raised text-body placeholder:text-text-soft min-h-12 w-full min-w-0 rounded-full px-5 tabular-nums"
					/>
					<Button type="submit" variant="ink">
						Cerca
					</Button>
				</div>
			</form>
			<Link to="/" className="text-body self-center underline">
				Cerca per nome
			</Link>
		</ScanPage>
	);
}
