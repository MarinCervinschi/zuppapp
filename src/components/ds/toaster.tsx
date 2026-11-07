import { Toaster } from "sonner";

import { CheckIcon, InfoIcon } from "./icons";

/**
 * A toast as the app draws it: an ink pill at the top of the screen, away from the tab bar, the
 * thumb and the sheet, with its action as a cream button inside. Success and error each carry an
 * icon besides their words, never colour alone. `id` names a second toaster (the one inside a
 * sheet, see `lib/toast.ts`).
 */
export function AppToaster({ id }: { id?: string }) {
	return (
		<Toaster
			id={id}
			position="top-center"
			offset={{ top: 16 }}
			mobileOffset={{ top: "calc(env(safe-area-inset-top) + 12px)" }}
			icons={{
				success: <CheckIcon className="text-badge-good size-5" />,
				error: <InfoIcon className="text-soup-tomato size-5" />,
			}}
			toastOptions={{
				unstyled: true,
				classNames: {
					toast:
						"bg-ink text-on-ink overlay-shadow ring-on-ink/10 flex w-full ring-1 items-center gap-3 rounded-[1.75rem] py-2 pr-2 pl-5 min-h-14",
					icon: "shrink-0",
					content: "flex min-w-0 flex-1 flex-col py-1",
					title: "text-body font-medium",
					description: "text-small text-on-ink/75",
					actionButton:
						"bg-on-ink text-ink text-small min-h-10 shrink-0 rounded-full px-4 font-semibold transition-[scale] duration-150 motion-safe:active:scale-[0.96]",
				},
			}}
		/>
	);
}
