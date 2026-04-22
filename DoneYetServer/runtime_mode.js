const DEFAULT_TIMEOUT_MS = 2200;

export const RUNTIME_MODE_SELF_HOST = "self_host";
export const RUNTIME_MODE_STATIC = "static";

function trimRelativePath(value) {
    return String(value || "")
        .trim()
        .replace(/\\/g, "/")
        .replace(/^\/+/, "")
        .replace(/^\.\//, "");
}

export function resolveModuleAssetUrl(relativePath = "") {
    const normalized = trimRelativePath(relativePath);
    return new URL(normalized || ".", import.meta.url).toString();
}

export function buildLocalApiUrl(endpoint = "") {
    const normalized = trimRelativePath(endpoint);
    return resolveModuleAssetUrl(`./api/${normalized}`);
}

export function getServerRuntimeUrl() {
    return resolveModuleAssetUrl("./server_runtime.json");
}

async function fetchWithTimeout(url, options = {}, timeoutMs = DEFAULT_TIMEOUT_MS) {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), Math.max(500, Number(timeoutMs || DEFAULT_TIMEOUT_MS) || DEFAULT_TIMEOUT_MS));
    try {
        return await fetch(url, {
            cache: "no-store",
            ...options,
            signal: controller.signal,
        });
    } finally {
        window.clearTimeout(timeoutId);
    }
}

async function probeServerRuntime(timeoutMs) {
    const url = getServerRuntimeUrl();
    try {
        const response = await fetchWithTimeout(url, {}, timeoutMs);
        if (!response.ok) {
            return {
                available: false,
                url,
                reason: `HTTP ${response.status}`,
                metadata: null,
            };
        }
        const metadata = await response.json().catch(() => null);
        return {
            available: true,
            url,
            reason: "",
            metadata: metadata && typeof metadata === "object" ? metadata : null,
        };
    } catch (error) {
        return {
            available: false,
            url,
            reason: error?.name === "AbortError" ? "timeout" : String(error?.message || error || "runtime_probe_failed"),
            metadata: null,
        };
    }
}

async function probeLocalApi(timeoutMs) {
    const serviceStatusUrl = buildLocalApiUrl("service_status");
    const dataUrl = buildLocalApiUrl("data");

    try {
        const statusResponse = await fetchWithTimeout(serviceStatusUrl, {}, timeoutMs);
        if (statusResponse.ok) {
            return {
                available: true,
                url: serviceStatusUrl,
                reason: "",
            };
        }
    } catch (error) {
        // Fall through to the data endpoint probe.
    }

    try {
        const dataResponse = await fetchWithTimeout(dataUrl, { method: "HEAD" }, timeoutMs);
        if (dataResponse.ok) {
            return {
                available: true,
                url: dataUrl,
                reason: "",
            };
        }
        return {
            available: false,
            url: dataUrl,
            reason: `HTTP ${dataResponse.status}`,
        };
    } catch (error) {
        return {
            available: false,
            url: dataUrl,
            reason: error?.name === "AbortError" ? "timeout" : String(error?.message || error || "local_api_probe_failed"),
        };
    }
}

export async function resolveRuntimeMode({ timeoutMs = DEFAULT_TIMEOUT_MS } = {}) {
    const [runtimeProbe, localApiProbe] = await Promise.all([
        probeServerRuntime(timeoutMs),
        probeLocalApi(timeoutMs),
    ]);

    const localBackendAvailable = !!localApiProbe.available;
    const mode = localBackendAvailable ? RUNTIME_MODE_SELF_HOST : RUNTIME_MODE_STATIC;

    return {
        mode,
        localBackendAvailable,
        runtimeMetadata: runtimeProbe.metadata,
        probes: {
            serverRuntime: runtimeProbe,
            localApi: localApiProbe,
        },
        urls: {
            serverRuntime: runtimeProbe.url,
            serviceStatus: buildLocalApiUrl("service_status"),
            data: buildLocalApiUrl("data"),
            clearAll: buildLocalApiUrl("clear_all"),
            delete: buildLocalApiUrl("delete"),
            syncToFirebase: buildLocalApiUrl("sync_to_firebase"),
        },
    };
}
