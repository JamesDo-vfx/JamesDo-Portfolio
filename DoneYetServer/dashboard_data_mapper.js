import { RealtimeDbRestError } from "./realtime_db_rest_client.js";

function isObjectRecord(value) {
    return !!value && typeof value === "object" && !Array.isArray(value);
}

export function mapDashboardPayload(payload) {
    if (payload === null) {
        return {
            records: {},
            recordCount: 0,
            isEmpty: true
        };
    }

    const candidate = isObjectRecord(payload?.renders) ? payload.renders : payload;
    if (!isObjectRecord(candidate)) {
        throw new RealtimeDbRestError("MISSING_EXPECTED_DATA", "Dashboard data is missing the expected object map.");
    }

    const entries = Object.entries(candidate).filter(([key, value]) => {
        return !!String(key || "").trim() && isObjectRecord(value);
    });

    return {
        records: Object.fromEntries(entries),
        recordCount: entries.length,
        isEmpty: entries.length === 0
    };
}
