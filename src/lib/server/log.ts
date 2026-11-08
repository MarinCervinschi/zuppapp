// Structured logs: to Seq in CLEF when SEQ_URL is set, to the console otherwise.
// Plain Node TypeScript (relative imports, erasable syntax only): scripts/migrate.mjs imports this file
// directly in the runtime image, where nothing compiles it.

export type LogLevel = "Debug" | "Information" | "Warning" | "Error";

export type LogProperties = Record<string, unknown>;

export type LogEvent = {
	timestamp: string;
	level: LogLevel;
	template: string;
	properties: LogProperties;
	error?: unknown;
};

const LEVEL_ORDER: Record<LogLevel, number> = {
	Debug: 10,
	Information: 20,
	Warning: 30,
	Error: 40,
};

export function parseLevel(value: string | undefined): LogLevel {
	switch (value?.trim().toLowerCase()) {
		case "debug":
			return "Debug";
		case "warn":
		case "warning":
			return "Warning";
		case "error":
			return "Error";
		default:
			return "Information";
	}
}

// A safety net, not a licence: a call never passes a whole user or request object.
const REDACTED = [
	"password",
	"token",
	"secret",
	"apikey",
	"api_key",
	"authorization",
	"cookie",
	"email",
	"ipaddress",
	"note",
];
const MAX_STRING = 2_000;
const MAX_DEPTH = 3;

function isRedacted(key: string): boolean {
	const lower = key.toLowerCase();
	// `Ip`, `ClientIp`: an IP is personal data.
	return lower.endsWith("ip") || REDACTED.some(needle => lower.includes(needle));
}

function sanitize(value: unknown, depth: number): unknown {
	if (value === null || value === undefined) return null;
	if (typeof value === "string")
		return value.length > MAX_STRING ? `${value.slice(0, MAX_STRING)}…` : value;
	if (typeof value === "number") return Number.isFinite(value) ? value : String(value);
	if (typeof value === "boolean") return value;
	if (typeof value === "bigint") return value.toString();
	if (value instanceof Date) return value.toISOString();
	if (value instanceof Error) return `${value.name}: ${value.message}`;
	if (typeof value !== "object") return undefined;
	if (depth >= MAX_DEPTH) return "[depth limit]";
	if (Array.isArray(value))
		return value.slice(0, 50).map(item => sanitize(item, depth + 1));
	const result: Record<string, unknown> = {};
	for (const [key, nested] of Object.entries(value)) {
		result[key] = isRedacted(key) ? "[redacted]" : sanitize(nested, depth + 1);
	}
	return result;
}

/**
 * The stack and up to three causes.
 * Drops the `params:` line of a Drizzle query error: the values can be text a user wrote.
 */
export function formatError(error: unknown): string {
	if (!(error instanceof Error)) return String(error);
	const parts = [error.stack ?? `${error.name}: ${error.message}`];
	let cause = error.cause;
	for (let depth = 0; cause instanceof Error && depth < 3; depth++) {
		parts.push(`Caused by: ${cause.stack ?? `${cause.name}: ${cause.message}`}`);
		cause = cause.cause;
	}
	return parts.join("\n").replace(/^params: .*$/gm, "params: [redacted]");
}

/** The Postgres SQLSTATE and constraint, from the error or its cause; never `detail`, which quotes the row. */
function errorProperties(error: unknown): LogProperties {
	for (let current = error, depth = 0; depth < 4; depth++) {
		if (typeof current !== "object" || current === null) return {};
		const { code, constraint, cause } = current as {
			code?: unknown;
			constraint?: unknown;
			cause?: unknown;
		};
		if (typeof code === "string")
			return {
				ErrorCode: code,
				...(typeof constraint === "string" ? { ErrorConstraint: constraint } : {}),
			};
		current = cause;
	}
	return {};
}

export function toClef(event: LogEvent): string {
	const payload: Record<string, unknown> = {
		"@t": event.timestamp,
		"@l": event.level,
		"@mt": event.template,
	};
	if (event.error !== undefined) payload["@x"] = formatError(event.error);
	for (const [key, value] of Object.entries(event.properties)) {
		const clean = isRedacted(key) ? "[redacted]" : sanitize(value, 0);
		if (clean === undefined) continue;
		// CLEF reserves names starting with @; a doubled @ escapes one.
		payload[key.startsWith("@") ? `@${key}` : key] = clean;
	}
	return JSON.stringify(payload);
}

/** The template with its properties filled in, for the console; Seq renders templates itself. */
export function render(template: string, properties: LogProperties): string {
	return template.replace(/\{(\w+)(?::[^}]*)?\}/g, (match, name: string) =>
		!(name in properties)
			? match
			: isRedacted(name)
				? "[redacted]"
				: String(sanitize(properties[name], 0))
	);
}

function writeToConsole(event: LogEvent): void {
	const line = `[${event.level}] ${render(event.template, event.properties)}`;
	const detail = event.error === undefined ? "" : `\n${formatError(event.error)}`;
	if (event.level === "Error") console.error(line + detail);
	else if (event.level === "Warning") console.warn(line + detail);
	else console.log(line + detail);
}

// Shipping. Nothing below may throw into a caller or hold a request up.

const FLUSH_MS = 2_000;
const MAX_BATCH_EVENTS = 100;
const MAX_QUEUE_EVENTS = 5_000;
const SEND_TIMEOUT_MS = 5_000;

type Target = { url: string; apiKey: string | undefined };

let target: Target | null | undefined;
let queue: LogEvent[] = [];
let dropped = 0;
let timer: ReturnType<typeof setTimeout> | null = null;
let sending: Promise<void> | null = null;
let hooked = false;

function resolveTarget(): Target | null {
	if (target !== undefined) return target;
	const base = process.env.SEQ_URL?.trim();
	target = base
		? {
				url: `${base.replace(/\/+$/, "")}/ingest/clef`,
				apiKey: process.env.SEQ_API_KEY?.trim() || undefined,
			}
		: null;
	return target;
}

async function send(destination: Target, batch: LogEvent[]): Promise<void> {
	try {
		const response = await fetch(destination.url, {
			method: "POST",
			headers: {
				"Content-Type": "application/vnd.serilog.clef",
				...(destination.apiKey ? { "X-Seq-ApiKey": destination.apiKey } : {}),
			},
			body: batch.map(toClef).join("\n"),
			signal: AbortSignal.timeout(SEND_TIMEOUT_MS),
		});
		if (response.ok) return;
		throw new Error(`${response.status} ${response.statusText}`);
	} catch (error) {
		// Not requeued: a backlog against a Seq that is down would grow until the process dies.
		// The container's own log keeps the events instead.
		console.warn(
			`[log] Seq did not take ${batch.length} events (${error instanceof Error ? error.message : String(error)}); they follow here`
		);
		for (const event of batch) writeToConsole(event);
	}
}

/** Sends whatever is queued; scripts await it before `process.exit`. */
export async function flushLogs(): Promise<void> {
	if (timer) {
		clearTimeout(timer);
		timer = null;
	}
	if (sending) await sending;
	const destination = resolveTarget();
	if (!destination || queue.length === 0) return;

	const batch = queue;
	queue = [];
	if (dropped > 0) {
		console.warn(`[log] dropped ${dropped} events: the queue was full`);
		dropped = 0;
	}
	sending = send(destination, batch).finally(() => {
		sending = null;
	});
	await sending;
	if (queue.length > 0) scheduleFlush();
}

function scheduleFlush(): void {
	if (timer) return;
	timer = setTimeout(() => void flushLogs(), FLUSH_MS);
	// So a finished script still exits; `beforeExit` sends the rest.
	timer.unref?.();
}

function hookShutdown(): void {
	if (hooked) return;
	hooked = true;
	for (const signal of ["SIGTERM", "SIGINT"] as const) {
		process.once(signal, () => {
			// Raised again after the flush, or the container would hang on every redeploy.
			void flushLogs().finally(() => process.kill(process.pid, signal));
		});
	}
	process.once("beforeExit", () => void flushLogs());
}

function ship(event: LogEvent): void {
	const destination = resolveTarget();
	if (!destination) {
		writeToConsole(event);
		return;
	}
	hookShutdown();
	if (queue.length >= MAX_QUEUE_EVENTS) {
		dropped++;
		return;
	}
	queue.push(event);
	if (queue.length >= MAX_BATCH_EVENTS) void flushLogs();
	else scheduleFlush();
}

// The API.

let minimum: LogLevel | undefined;

function version(): string | undefined {
	return (
		process.env.APP_VERSION?.trim() || process.env.SOURCE_COMMIT?.trim() || undefined
	);
}

export type Logger = {
	debug(template: string, properties?: LogProperties): void;
	info(template: string, properties?: LogProperties): void;
	warn(template: string, properties?: LogProperties, error?: unknown): void;
	error(template: string, properties?: LogProperties, error?: unknown): void;
};

/**
 * A logger whose events all carry `base`, such as `{ Source: "migrate" }`.
 * Templates name their properties (`"Imported {Count}"`, `{ Count: n }`), never interpolate them.
 * Never pass an email, a user id, an IP or text a user wrote.
 */
export function createLogger(base: LogProperties = {}): Logger {
	function emit(
		level: LogLevel,
		template: string,
		properties: LogProperties = {},
		error?: unknown
	) {
		minimum ??= parseLevel(process.env.LOG_LEVEL);
		if (LEVEL_ORDER[level] < LEVEL_ORDER[minimum]) return;
		const release = version();
		ship({
			timestamp: new Date().toISOString(),
			level,
			template,
			error,
			properties: {
				...(release ? { Version: release } : {}),
				...base,
				...properties,
				...(error === undefined ? {} : errorProperties(error)),
			},
		});
	}
	return {
		debug: (template, properties) => emit("Debug", template, properties),
		info: (template, properties) => emit("Information", template, properties),
		warn: (template, properties, error) => emit("Warning", template, properties, error),
		error: (template, properties, error) => emit("Error", template, properties, error),
	};
}

export const log = createLogger({ Source: "server" });
