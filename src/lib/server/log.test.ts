import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const event = {
	timestamp: "2026-11-07T10:00:00.000Z",
	level: "Error" as const,
	template: "{Fn} failed",
	properties: { Fn: "voteFn" },
};

async function freshLog() {
	vi.resetModules();
	return import("./log");
}

describe("toClef", () => {
	it("writes the reserved fields and the properties", async () => {
		const { toClef } = await freshLog();
		expect(JSON.parse(toClef({ ...event, error: new Error("boom") }))).toMatchObject({
			"@t": event.timestamp,
			"@l": "Error",
			"@mt": "{Fn} failed",
			"@x": expect.stringContaining("Error: boom"),
			Fn: "voteFn",
		});
	});

	it("redacts personal and secret keys, nested ones too", async () => {
		const { toClef } = await freshLog();
		const line = toClef({
			...event,
			properties: {
				Email: "valore-email",
				ClientIp: "valore-ip",
				Ip: "valore-ip",
				Note: "testo",
				Request: { headers: { cookie: "x", authorization: "y" } },
				Ean: "8001234567890",
			},
		});
		expect(line).not.toMatch(/valore-email|valore-ip|testo|"x"|"y"/);
		expect(JSON.parse(line).Ean).toBe("8001234567890");
	});

	it("escapes a property name that starts with @", async () => {
		const { toClef } = await freshLog();
		const line = toClef({ ...event, properties: { "@l": "Debug" } });
		expect(JSON.parse(line)).toMatchObject({ "@l": "Error", "@@l": "Debug" });
	});
});

describe("errors", () => {
	it("drops query parameters and finds the Postgres code in the cause", async () => {
		const { toClef } = await freshLog();
		const cause = Object.assign(new Error("connect ECONNREFUSED"), {
			code: "ECONNREFUSED",
		});
		const error = new Error("Failed query: select $1\nparams: la mia nota", { cause });
		const payload = JSON.parse(toClef({ ...event, properties: {}, error }));
		expect(payload["@x"]).not.toContain("la mia nota");
		expect(payload["@x"]).toContain("Caused by: Error: connect ECONNREFUSED");
	});
});

describe("render", () => {
	it("fills the template and leaves unknown names alone", async () => {
		const { render } = await freshLog();
		expect(
			render("{Count} in {Elapsed:0}ms, {Missing}", { Count: 3, Elapsed: 12 })
		).toBe("3 in 12ms, {Missing}");
	});
});

describe("shipping", () => {
	const env = { ...process.env };

	beforeEach(() => {
		vi.spyOn(console, "log").mockImplementation(() => {});
		vi.spyOn(console, "warn").mockImplementation(() => {});
		vi.spyOn(console, "error").mockImplementation(() => {});
	});

	afterEach(() => {
		process.env = { ...env };
		vi.restoreAllMocks();
		vi.unstubAllGlobals();
	});

	it("writes to the console without SEQ_URL", async () => {
		delete process.env.SEQ_URL;
		const fetch = vi.fn();
		vi.stubGlobal("fetch", fetch);
		const { log } = await freshLog();
		log.error("{Fn} failed", { Fn: "voteFn" }, new Error("boom"));
		expect(fetch).not.toHaveBeenCalled();
		expect(console.error).toHaveBeenCalledWith(
			expect.stringContaining("[Error] voteFn failed")
		);
	});

	it("posts CLEF lines to Seq with the API key", async () => {
		process.env.SEQ_URL = "http://seq.test/";
		process.env.SEQ_API_KEY = "key";
		const fetch = vi.fn().mockResolvedValue(new Response(null, { status: 201 }));
		vi.stubGlobal("fetch", fetch);
		const { log, flushLogs } = await freshLog();
		log.info("one");
		log.warn("two");
		await flushLogs();
		expect(fetch).toHaveBeenCalledOnce();
		const [url, init] = fetch.mock.calls[0];
		expect(url).toBe("http://seq.test/ingest/clef");
		expect(init.headers["X-Seq-ApiKey"]).toBe("key");
		expect(
			String(init.body)
				.split("\n")
				.map(line => JSON.parse(line)["@mt"])
		).toEqual(["one", "two"]);
	});

	it("adds the Postgres code of a wrapped error", async () => {
		process.env.SEQ_URL = "http://seq.test";
		const fetch = vi.fn().mockResolvedValue(new Response(null, { status: 201 }));
		vi.stubGlobal("fetch", fetch);
		const { log, flushLogs } = await freshLog();
		const cause = Object.assign(new Error("duplicate"), {
			code: "23505",
			constraint: "votes_pkey",
		});
		log.error("{Fn} failed", { Fn: "voteFn" }, new Error("Failed query", { cause }));
		await flushLogs();
		expect(JSON.parse(fetch.mock.calls[0][1].body)).toMatchObject({
			ErrorCode: "23505",
			ErrorConstraint: "votes_pkey",
		});
	});

	it("falls back to the console when Seq does not answer", async () => {
		process.env.SEQ_URL = "http://seq.test";
		vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("ECONNREFUSED")));
		const { log, flushLogs } = await freshLog();
		log.error("{Fn} failed", { Fn: "voteFn" });
		await flushLogs();
		expect(console.error).toHaveBeenCalledWith("[Error] voteFn failed");
	});

	it("drops events below LOG_LEVEL", async () => {
		delete process.env.SEQ_URL;
		process.env.LOG_LEVEL = "warn";
		const { log } = await freshLog();
		log.info("quiet");
		expect(console.log).not.toHaveBeenCalled();
	});
});
