import { type ExternalToast, toast as sonner } from "sonner";

// The app's toasts, sonner's API with two twists. While a sheet is open they go to the toaster
// inside it: a modal dialog sits in the browser's top layer, above every z-index, and leaves the
// page behind inert, so a toast on the page would show under the sheet, its button out of reach.
// And they are short: a few words read at a glance, a little longer when there is a button to reach.

export const SHEET_TOASTER = "sheet";

const DURATION_MS = 2500;
const DURATION_WITH_ACTION_MS = 4000;

let openSheets = 0;
/** The toasts shown inside a sheet: they go with it, or the next sheet would show them again. */
const sheetToasts = new Set<string | number>();

/** Called by a sheet as it opens; the function it returns is called as it closes. */
export function sheetOpened() {
	openSheets += 1;
	return () => {
		openSheets -= 1;
		if (openSheets > 0) return;
		for (const id of sheetToasts) sonner.dismiss(id);
		sheetToasts.clear();
	};
}

type Message = Parameters<typeof sonner>[0];

function show(
	send: (message: Message, data?: ExternalToast) => string | number,
	message: Message,
	data?: ExternalToast
) {
	const inSheet = openSheets > 0;
	const id = send(message, {
		duration: data?.action ? DURATION_WITH_ACTION_MS : DURATION_MS,
		...(inSheet && { toasterId: SHEET_TOASTER }),
		...data,
	});
	if (inSheet) sheetToasts.add(id);
	return id;
}

export const toast = Object.assign(
	(message: Message, data?: ExternalToast) => show(sonner, message, data),
	{
		success: (message: Message, data?: ExternalToast) =>
			show(sonner.success, message, data),
		error: (message: Message, data?: ExternalToast) =>
			show(sonner.error, message, data),
		dismiss: sonner.dismiss,
	}
);
