import { type ExternalToast, toast as sonner } from "sonner";

// The app's toasts, sonner's API with one twist: while a sheet is open they go to the toaster
// inside it. A modal dialog sits in the browser's top layer, above every z-index, and leaves the
// page behind inert: a toast on the page would show under the sheet, its button out of reach.

export const SHEET_TOASTER = "sheet";

let openSheets = 0;

/** Called by a sheet as it opens; the function it returns is called as it closes. */
export function sheetOpened() {
	openSheets += 1;
	return () => {
		openSheets -= 1;
	};
}

type Message = Parameters<typeof sonner>[0];

const where = (data?: ExternalToast): ExternalToast | undefined =>
	openSheets > 0 ? { toasterId: SHEET_TOASTER, ...data } : data;

export const toast = Object.assign(
	(message: Message, data?: ExternalToast) => sonner(message, where(data)),
	{
		success: (message: Message, data?: ExternalToast) =>
			sonner.success(message, where(data)),
		error: (message: Message, data?: ExternalToast) =>
			sonner.error(message, where(data)),
		dismiss: sonner.dismiss,
	}
);
