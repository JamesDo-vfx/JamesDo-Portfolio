export const STORAGE_KEY = "doneyet_web_config_v1";
export const SHARE_PROFILE_PARAM = "profile";

const DEFAULT_ACCENT_COLOR = "#51ff84";
const DEFAULT_THEME_MODE = "dark";
const DEFAULT_COMPANY_NAME_COLOR = "#98a5ba";
const DEFAULT_ICON_LIBRARY = "lucide";
const DEFAULT_HERO_BACKGROUND_ICON = "building-2";
const DEFAULT_HERO_ICON_COLOR = "#FFFFFF";
const DEFAULT_HERO_ICON_OPACITY = 0.08;
const DEFAULT_HERO_ICON_SCALE = 1.0;
const DEFAULT_HERO_ICON_HOVER_SCALE = 1.06;
const DEFAULT_PERMISSIONS = Object.freeze({
    allowDeleteShot: false,
    allowClearDatabase: false
});
const FIXED_BRAND_LABEL = "DoneYet Monitor";
const SHARE_PROFILE_TYPE = "DoneYetShareProfile";
const SHARE_PROFILE_VERSION = 1;

function clonePlainObject(value) {
    return JSON.parse(JSON.stringify(value));
}

function makeError(code, message) {
    const error = new Error(message);
    error.code = code;
    return error;
}

function sanitizePastedJsonText(rawText) {
    return String(rawText || "")
        .replace(/^\uFEFF/, "")
        .replace(/[\u201C\u201D]/g, "\"")
        .replace(/[\u2018\u2019]/g, "'")
        .replace(/\u00A0/g, " ")
        .replace(/[\u200B-\u200D\u2060]/g, "");
}

function normalizeAccentColor(value) {
    const raw = String(value || "").trim();
    if (!raw) return DEFAULT_ACCENT_COLOR;
    const normalized = raw.startsWith("#") ? raw : `#${raw}`;
    const shortHexMatch = /^#([0-9a-f]{3})$/i.exec(normalized);
    if (shortHexMatch) {
        const expanded = shortHexMatch[1].split("").map((char) => char + char).join("");
        return `#${expanded}`.toLowerCase();
    }
    if (/^#([0-9a-f]{6})$/i.test(normalized)) {
        return normalized.toLowerCase();
    }
    return DEFAULT_ACCENT_COLOR;
}

function normalizeCompanyNameColor(value) {
    const raw = String(value || "").trim();
    if (!raw) return DEFAULT_COMPANY_NAME_COLOR;
    const normalized = raw.startsWith("#") ? raw : `#${raw}`;
    const shortHexMatch = /^#([0-9a-f]{3})$/i.exec(normalized);
    if (shortHexMatch) {
        const expanded = shortHexMatch[1].split("").map((char) => char + char).join("");
        return `#${expanded}`.toLowerCase();
    }
    if (/^#([0-9a-f]{6})$/i.test(normalized)) {
        return normalized.toLowerCase();
    }
    return DEFAULT_COMPANY_NAME_COLOR;
}

function normalizeThemeMode(value) {
    const raw = String(value || "").trim().toLowerCase();
    if (raw === "light" || raw === "dark" || raw === "system") {
        return raw;
    }
    if (raw === "auto") {
        return "system";
    }
    return DEFAULT_THEME_MODE;
}

function normalizeIconLibrary(value) {
    return String(value || "").trim().toLowerCase() === "lucide" ? "lucide" : DEFAULT_ICON_LIBRARY;
}

function normalizeHeroBackgroundIcon(value) {
    const normalized = String(value || "")
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9-]+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");
    return normalized || DEFAULT_HERO_BACKGROUND_ICON;
}

function normalizeDatabaseUrl(value) {
    return String(value || "").trim().replace(/\/+$/, "");
}

function normalizeBoolean(value, fallback = false) {
    if (value === null || value === undefined) {
        return Boolean(fallback);
    }
    if (typeof value === "boolean") {
        return value;
    }
    if (typeof value === "number") {
        return value !== 0;
    }
    const raw = String(value).trim().toLowerCase();
    if (raw === "true" || raw === "1" || raw === "yes" || raw === "on") {
        return true;
    }
    if (raw === "false" || raw === "0" || raw === "no" || raw === "off") {
        return false;
    }
    return Boolean(fallback);
}

function normalizePermissions(value) {
    const permissions = value && typeof value === "object" && !Array.isArray(value) ? value : {};
    return {
        allowDeleteShot: normalizeBoolean(permissions.allowDeleteShot, DEFAULT_PERMISSIONS.allowDeleteShot),
        allowClearDatabase: normalizeBoolean(permissions.allowClearDatabase, DEFAULT_PERMISSIONS.allowClearDatabase)
    };
}

function resolvePermissions(value, legacySource = null) {
    const normalized = normalizePermissions(value);
    const legacy = legacySource && typeof legacySource === "object" && !Array.isArray(legacySource) ? legacySource : {};
    return {
        allowDeleteShot: normalizeBoolean(legacy.allowDeleteShot, normalized.allowDeleteShot),
        allowClearDatabase: normalizeBoolean(legacy.allowClearDatabase, normalized.allowClearDatabase)
    };
}

function materializePermissions(value, legacySource = null) {
    const resolved = resolvePermissions(value, legacySource);
    return {
        allowDeleteShot: resolved.allowDeleteShot,
        allowClearDatabase: resolved.allowClearDatabase
    };
}

export function parseWebConfigJson(rawText) {
    try {
        return JSON.parse(sanitizePastedJsonText(rawText));
    } catch (error) {
        throw makeError("invalid_json", "Invalid JSON. Please paste a valid DoneYet profile JSON.");
    }
}

function buildMinimalWebConfig({ databaseURL, companyName, themeMode, iconLibrary, heroBackgroundIcon, permissions, sourceConfig = null }) {
    return {
        type: "DoneYetWebConfig",
        version: 1,
        connection: {
            databaseURL,
        },
        branding: {
            companyName,
            themeMode,
            iconLibrary,
            heroBackgroundIcon,
        },
        permissions: materializePermissions(permissions, sourceConfig),
    };
}

function getBrandingVisualDefaults() {
    return {
        companyNameColor: DEFAULT_COMPANY_NAME_COLOR,
        heroIconColor: DEFAULT_HERO_ICON_COLOR,
        heroIconOpacity: DEFAULT_HERO_ICON_OPACITY,
        heroIconScale: DEFAULT_HERO_ICON_SCALE,
        heroIconHoverScale: DEFAULT_HERO_ICON_HOVER_SCALE,
    };
}

export function validateWebConfig(inputConfig) {
    if (!inputConfig || typeof inputConfig !== "object" || Array.isArray(inputConfig)) {
        throw makeError("invalid_json", "Invalid JSON. The profile must be a JSON object.");
    }

    if (inputConfig.type !== "DoneYetWebConfig") {
        throw makeError("wrong_type", "Wrong config type. Expected type \"DoneYetWebConfig\".");
    }

    if (Number(inputConfig.version) !== 1) {
        throw makeError("unsupported_version", "Unsupported config version. Only version 1 is supported.");
    }

    const connection = inputConfig.connection && typeof inputConfig.connection === "object" ? inputConfig.connection : {};
    const branding = inputConfig.branding && typeof inputConfig.branding === "object" ? inputConfig.branding : {};
    const databaseURL = normalizeDatabaseUrl(connection.databaseURL);
    const companyName = String(branding.companyName || "").trim();

    if (!databaseURL) {
        throw makeError("missing_database_url", "Missing databaseURL. Provide connection.databaseURL in the config bundle.");
    }

    if (!companyName) {
        throw makeError("missing_company_name", "Missing companyName. Provide branding.companyName in the config bundle.");
    }

    return buildMinimalWebConfig({
        databaseURL,
        companyName,
        themeMode: normalizeThemeMode(branding.themeMode),
        iconLibrary: normalizeIconLibrary(branding.iconLibrary),
        heroBackgroundIcon: normalizeHeroBackgroundIcon(branding.heroBackgroundIcon),
        permissions: inputConfig.permissions,
        sourceConfig: inputConfig,
    });
}

export function parseAndValidateWebConfig(rawText) {
    return validateWebConfig(parseWebConfigJson(rawText));
}

function normalizeImportText(rawText) {
    return sanitizePastedJsonText(rawText).trim();
}

function tryParseImportUrl(rawText) {
    const normalized = normalizeImportText(rawText);
    if (!normalized) {
        return null;
    }
    try {
        const parsedUrl = new URL(normalized);
        const rawValue = parsedUrl.searchParams.get(SHARE_PROFILE_PARAM);
        return rawValue ? decodeSharedProfileParam(rawValue) : null;
    } catch (error) {
        return null;
    }
}

export function serializeWebConfig(config) {
    return JSON.stringify(validateWebConfig(config), null, 2);
}

function decodeBase64Url(rawValue) {
    const normalized = String(rawValue || "").trim().replace(/-/g, "+").replace(/_/g, "/");
    if (!normalized) {
        throw makeError("invalid_share_profile", "Shared profile is empty.");
    }
    const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
    try {
        return window.atob(padded);
    } catch (error) {
        throw makeError("invalid_share_profile", "Shared profile URL is invalid.");
    }
}

export function decodeSharedProfileParam(rawValue) {
    let parsed;
    try {
        parsed = JSON.parse(decodeBase64Url(rawValue));
    } catch (error) {
        if (error && error.code) {
            throw error;
        }
        throw makeError("invalid_share_profile", "Shared profile URL is invalid.");
    }
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        throw makeError("invalid_share_profile", "Shared profile URL is invalid.");
    }
    if (parsed.type === "DoneYetWebConfig" && Number(parsed.version) === 1) {
        return validateWebConfig(parsed);
    }
    if (parsed.type !== SHARE_PROFILE_TYPE || Number(parsed.version) !== SHARE_PROFILE_VERSION) {
        throw makeError("invalid_share_profile", "Unsupported shared profile format.");
    }
    return validateWebConfig(parsed.webConfig || {});
}

export function parseImportedProfileText(rawText) {
    const normalized = normalizeImportText(rawText);
    if (!normalized) {
        throw makeError("empty_profile_import", "Paste a DoneYet share link or profile JSON first.");
    }

    const importedFromUrl = tryParseImportUrl(normalized);
    if (importedFromUrl) {
        return importedFromUrl;
    }

    let parsed;
    try {
        parsed = JSON.parse(normalized);
    } catch (error) {
        throw makeError("invalid_profile_import", "Paste a valid DoneYet share link or profile JSON.");
    }

    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        if (parsed.type === SHARE_PROFILE_TYPE && Number(parsed.version) === SHARE_PROFILE_VERSION) {
            return validateWebConfig(parsed.webConfig || {});
        }
        return validateWebConfig(parsed);
    }

    throw makeError("invalid_profile_import", "Paste a valid DoneYet share link or profile JSON.");
}

export function readSharedProfileFromUrl(search = window.location.search) {
    const params = new URLSearchParams(String(search || ""));
    const rawValue = params.get(SHARE_PROFILE_PARAM);
    if (!rawValue) {
        return null;
    }
    return decodeSharedProfileParam(rawValue);
}

function encodeBase64Url(rawValue) {
    const utf8Value = unescape(encodeURIComponent(String(rawValue || "")));
    return window.btoa(utf8Value).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function buildShareProfilePayload(config) {
    return {
        type: SHARE_PROFILE_TYPE,
        version: SHARE_PROFILE_VERSION,
        webConfig: validateWebConfig(config),
    };
}

export function serializeShareProfile(config, pretty = true) {
    const payload = buildShareProfilePayload(config);
    const permissions = payload?.webConfig?.permissions;
    if (!permissions || typeof permissions !== "object" || !("allowDeleteShot" in permissions) || !("allowClearDatabase" in permissions)) {
        throw makeError("invalid_share_profile", "Shared profile permissions are incomplete.");
    }
    return pretty
        ? JSON.stringify(payload, null, 2)
        : JSON.stringify(payload);
}

export function buildShareDashboardUrl(config, baseUrl = window.location.href) {
    const validated = validateWebConfig(config);
    let parsedUrl;
    try {
        parsedUrl = new URL(String(baseUrl || window.location.href || ""));
    } catch (error) {
        return "";
    }

    parsedUrl.searchParams.delete(SHARE_PROFILE_PARAM);
    parsedUrl.searchParams.set(SHARE_PROFILE_PARAM, encodeBase64Url(serializeShareProfile(validated, false)));
    return parsedUrl.toString();
}

export function readStoredWebConfig() {
    let rawText = null;
    try {
        rawText = window.localStorage.getItem(STORAGE_KEY);
    } catch (error) {
        throw makeError("storage_read_failed", "Could not read the saved profile from browser storage.");
    }
    if (!rawText) {
        return null;
    }
    return parseAndValidateWebConfig(rawText);
}

export function saveStoredWebConfig(config) {
    const validated = validateWebConfig(config);
    try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(validated));
    } catch (error) {
        throw makeError("storage_write_failed", "Could not save the profile to browser storage.");
    }
    return validated;
}

export function forgetStoredWebConfig() {
    try {
        window.localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
        throw makeError("storage_write_failed", "Could not remove the saved profile from browser storage.");
    }
}

function hexToRgb(hex) {
    const normalized = normalizeAccentColor(hex).replace("#", "");
    return {
        r: parseInt(normalized.slice(0, 2), 16),
        g: parseInt(normalized.slice(2, 4), 16),
        b: parseInt(normalized.slice(4, 6), 16),
    };
}

function withAlpha(hex, alpha) {
    const rgb = hexToRgb(hex);
    return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
}

function resolveThemeMode(themeMode) {
    if (themeMode !== "system") {
        return normalizeThemeMode(themeMode);
    }
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

export function applyBranding(config, runtimeMetadata = {}) {
    const validated = validateWebConfig(config);
    const branding = validated.branding || {};
    const visualDefaults = getBrandingVisualDefaults();
    const accentColor = DEFAULT_ACCENT_COLOR;
    const requestedTheme = normalizeThemeMode(branding.themeMode);
    const resolvedTheme = resolveThemeMode(requestedTheme);
    const productName = String((runtimeMetadata && runtimeMetadata.product_name) || "DoneYet / JDTool for Houdini").trim();
    const buildId = String((runtimeMetadata && runtimeMetadata.build_id) || "").trim();

    document.documentElement.dataset.themeMode = resolvedTheme;
    document.documentElement.dataset.themePreference = requestedTheme;
    document.documentElement.style.setProperty("--accent", accentColor);
    document.documentElement.style.setProperty("--accent-soft", withAlpha(accentColor, 0.2));
    document.documentElement.style.setProperty("--accent-strong", withAlpha(accentColor, 0.34));
    document.documentElement.style.setProperty("--accent-glow", withAlpha(accentColor, 0.3));
    document.documentElement.style.setProperty("--success", accentColor);
    document.documentElement.style.setProperty("--brand-company-color", visualDefaults.companyNameColor);
    document.documentElement.style.setProperty("--hero-icon-color", visualDefaults.heroIconColor);
    document.documentElement.style.setProperty("--hero-icon-opacity", String(visualDefaults.heroIconOpacity));
    document.documentElement.style.setProperty("--hero-icon-scale", String(visualDefaults.heroIconScale));
    document.documentElement.style.setProperty("--hero-icon-hover-scale", String(visualDefaults.heroIconHoverScale));

    const brandCompanyName = document.getElementById("brandCompanyName");
    const brandHeaderTitle = document.getElementById("brandHeaderTitle");
    const appFooterBrand = document.getElementById("appFooterBrand");
    const appMetaPrimary = document.getElementById("appMetaPrimary");
    const resolvedCompanyName = String(branding.companyName || "").trim();

    if (brandCompanyName) {
        brandCompanyName.textContent = FIXED_BRAND_LABEL;
    }
    if (brandHeaderTitle) {
        brandHeaderTitle.textContent = resolvedCompanyName || "Company Name";
    }
    if (appFooterBrand) {
        appFooterBrand.textContent = "DoneYet";
    }
    if (appMetaPrimary) {
        appMetaPrimary.textContent = buildId ? `${productName} | Build ${buildId}` : productName;
    }

    document.title = resolvedCompanyName || FIXED_BRAND_LABEL;
    return validated;
}
