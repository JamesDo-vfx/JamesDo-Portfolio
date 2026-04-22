const DEFAULT_ICON_LIBRARY = "lucide";
const DEFAULT_HERO_ICON = "building-2";
const ICONIFY_LUCIDE_COLLECTION_URL = "https://api.iconify.design/collection?prefix=lucide";
const ICONIFY_LUCIDE_ICON_URL_TEMPLATE = "https://api.iconify.design/lucide/%s.svg?height=512";
const FALLBACK_ICON_NAMES = ["building-2", "factory", "rocket", "clapperboard", "film"];
let lucideCatalogPromise = null;
const lucideSvgMarkupCache = new Map();

function normalizeIconLibrary(iconLibrary) {
    return String(iconLibrary || "").trim().toLowerCase() === "lucide" ? "lucide" : DEFAULT_ICON_LIBRARY;
}

function normalizeIconName(iconName) {
    const normalized = String(iconName || "")
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9-]+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");
    return normalized || DEFAULT_HERO_ICON;
}

function getLucideIconSvgUrl(iconName) {
    return ICONIFY_LUCIDE_ICON_URL_TEMPLATE.replace("%s", encodeURIComponent(normalizeIconName(iconName)));
}

function parseLucideCatalogNames(payload) {
    const names = new Set(FALLBACK_ICON_NAMES);
    if (!payload || typeof payload !== "object") {
        return names;
    }

    const uncategorized = Array.isArray(payload.uncategorized) ? payload.uncategorized : [];
    uncategorized.forEach((iconName) => {
        names.add(normalizeIconName(iconName));
    });

    const categories = payload.categories && typeof payload.categories === "object" ? payload.categories : {};
    Object.values(categories).forEach((iconNames) => {
        if (!Array.isArray(iconNames)) return;
        iconNames.forEach((iconName) => {
            names.add(normalizeIconName(iconName));
        });
    });

    return names;
}

async function loadLucideCatalogNames() {
    if (!lucideCatalogPromise) {
        lucideCatalogPromise = fetch(ICONIFY_LUCIDE_COLLECTION_URL)
            .then((response) => {
                if (!response.ok) {
                    throw new Error(`Lucide catalog request failed with status ${response.status}`);
                }
                return response.json();
            })
            .then((payload) => parseLucideCatalogNames(payload))
            .catch(() => new Set(FALLBACK_ICON_NAMES));
    }
    return lucideCatalogPromise;
}

function sanitizeInlineSvg(svgText, iconName) {
    const raw = String(svgText || "").trim();
    if (!raw) {
        return "";
    }

    return raw.replace(
        /<svg\b([^>]*)>/i,
        `<svg$1 class="overview-hero__bg-svg" data-icon-name="${iconName}" aria-hidden="true" focusable="false">`
    );
}

async function loadLucideIconSvgMarkup(iconName) {
    const normalizedName = normalizeIconName(iconName);
    if (lucideSvgMarkupCache.has(normalizedName)) {
        return lucideSvgMarkupCache.get(normalizedName) || "";
    }

    const catalogNames = await loadLucideCatalogNames();
    const resolvedName = catalogNames.has(normalizedName) ? normalizedName : DEFAULT_HERO_ICON;

    if (lucideSvgMarkupCache.has(resolvedName)) {
        const cached = lucideSvgMarkupCache.get(resolvedName) || "";
        lucideSvgMarkupCache.set(normalizedName, cached);
        return cached;
    }

    const response = await fetch(getLucideIconSvgUrl(resolvedName));
    if (!response.ok) {
        throw new Error(`Lucide icon request failed with status ${response.status}`);
    }

    const svgMarkup = sanitizeInlineSvg(await response.text(), resolvedName);
    lucideSvgMarkupCache.set(resolvedName, svgMarkup);
    lucideSvgMarkupCache.set(normalizedName, svgMarkup);
    return svgMarkup;
}

async function hydrateDecorativeHeroIconNode(node) {
    if (!node || node.dataset.iconHydrated === "true") {
        return;
    }

    const iconLibrary = normalizeIconLibrary(node.dataset.heroIconLibrary);
    const iconName = normalizeIconName(node.dataset.heroIconName);
    node.dataset.iconHydrated = "true";

    if (iconLibrary !== "lucide") {
        node.innerHTML = "";
        return;
    }

    try {
        node.innerHTML = await loadLucideIconSvgMarkup(iconName);
    } catch (_error) {
        if (iconName !== DEFAULT_HERO_ICON) {
            try {
                node.innerHTML = await loadLucideIconSvgMarkup(DEFAULT_HERO_ICON);
                return;
            } catch (_fallbackError) {
            }
        }
        node.innerHTML = "";
    }
}

export function renderDecorativeHeroIcon(iconLibrary, iconName) {
    const library = normalizeIconLibrary(iconLibrary);
    const normalizedName = normalizeIconName(iconName);
    return `<div class="overview-hero__bg-icon" data-hero-icon-library="${library}" data-hero-icon-name="${normalizedName}"></div>`;
}

export function hydrateDecorativeHeroIcons(root = document) {
    const nodes = root && typeof root.querySelectorAll === "function"
        ? root.querySelectorAll("[data-hero-icon-library][data-hero-icon-name]")
        : [];
    nodes.forEach((node) => {
        hydrateDecorativeHeroIconNode(node);
    });
}
