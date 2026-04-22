const DEFAULT_TIMEOUT_MS = 12000;
const DEFAULT_DASHBOARD_PATH = "renders";

export class RealtimeDbRestError extends Error {
    constructor(code, message, details = {}) {
        super(message);
        this.name = "RealtimeDbRestError";
        this.code = code;
        this.details = details;
    }
}

function normalizeSegment(value) {
    return String(value || "").trim().replace(/^\/+|\/+$/g, "");
}

export function normalizeRealtimeDatabaseUrl(databaseURL, { defaultPath = DEFAULT_DASHBOARD_PATH } = {}) {
    const raw = String(databaseURL || "").trim();
    if (!raw) {
        throw new RealtimeDbRestError("MALFORMED_DATABASE_URL", "Missing connection.databaseURL.");
    }

    let parsed;
    try {
        parsed = new URL(raw);
    } catch (error) {
        throw new RealtimeDbRestError("MALFORMED_DATABASE_URL", `Malformed connection.databaseURL: ${error.message || error}`);
    }

    const inputSegments = parsed.pathname.split("/").map(normalizeSegment).filter(Boolean);
    if (inputSegments.length) {
        inputSegments[inputSegments.length - 1] = inputSegments[inputSegments.length - 1].replace(/\.json$/i, "");
        if (!inputSegments[inputSegments.length - 1]) {
            inputSegments.pop();
        }
    }
    const pathSegments = inputSegments.length ? inputSegments : [normalizeSegment(defaultPath)].filter(Boolean);
    parsed.pathname = "/";
    parsed.search = "";
    parsed.hash = "";

    return {
        origin: parsed.toString().replace(/\/$/, ""),
        pathSegments,
        requestUrl: `${parsed.toString().replace(/\/$/, "")}/${pathSegments.join("/")}.json`
    };
}

export function createRealtimeDatabaseRestClient({ databaseURL, timeoutMs = DEFAULT_TIMEOUT_MS, defaultPath = DEFAULT_DASHBOARD_PATH } = {}) {
    const normalized = normalizeRealtimeDatabaseUrl(databaseURL, { defaultPath });
    const requestTimeoutMs = Math.max(1000, Number(timeoutMs || DEFAULT_TIMEOUT_MS) || DEFAULT_TIMEOUT_MS);

    function buildRequestUrl(childPath = "") {
        const extraSegments = Array.isArray(childPath)
            ? childPath.map(normalizeSegment).filter(Boolean)
            : String(childPath || "").split("/").map(normalizeSegment).filter(Boolean);
        const segments = [...normalized.pathSegments, ...extraSegments];
        return `${normalized.origin}/${segments.join("/")}.json`;
    }

    async function fetchJson(childPath = "", fetchOptions = {}) {
        const controller = new AbortController();
        const timeoutId = window.setTimeout(() => controller.abort(), requestTimeoutMs);
        const requestUrl = buildRequestUrl(childPath);

        try {
            let response;
            try {
                response = await fetch(requestUrl, {
                    cache: "no-store",
                    ...fetchOptions,
                    signal: controller.signal
                });
            } catch (error) {
                if (error?.name === "AbortError") {
                    throw new RealtimeDbRestError("NETWORK_TIMEOUT", `Connection timed out after ${requestTimeoutMs}ms.`, { requestUrl });
                }
                throw new RealtimeDbRestError("NETWORK_FAILURE", `Network request failed: ${error.message || error}`, { requestUrl });
            }

            const text = await response.text();
            if (!response.ok) {
                throw new RealtimeDbRestError("REST_FETCH_FAILED", `REST fetch failed with HTTP ${response.status}.`, { requestUrl, status: response.status });
            }

            if (!text.trim()) {
                return null;
            }

            try {
                return JSON.parse(text);
            } catch (error) {
                throw new RealtimeDbRestError("INVALID_JSON_RESPONSE", `Server returned invalid JSON: ${error.message || error}`, { requestUrl });
            }
        } finally {
            window.clearTimeout(timeoutId);
        }
    }

    return {
        databaseURL: normalized.requestUrl,
        pathSegments: [...normalized.pathSegments],
        buildRequestUrl,
        fetchJson
    };
}
