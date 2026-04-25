const SITE_MOTION = {
    // Central place to tune the editorial motion language without chasing magic numbers.
    hero: {
        initialDelayMs: 120,
        staggerMs: 95
    },
    reveal: {
        offset: 18,
        staggerMs: 56,
        threshold: 0.16,
        rootMargin: "0px 0px -12% 0px"
    },
    cardHover: {
        maxLift: 12,
        maxScale: 0.01,
        influenceRadius: 280
    },
    toolTilt: {
        maxTiltX: 3.6,
        maxTiltY: 4.4,
        glowOpacity: 0.22
    },
    portraitCard: {
        maxTiltX: 5.6,
        maxTiltY: 7.2,
        mediaShift: 2.8,
        mediaScale: 1.024,
        badgeShiftX: 4.5,
        badgeFloatY: 6,
        badgeDepthZ: 32
    }
};

(() => {
    const menuToggle = document.getElementById("menu-toggle");
    const nav = document.getElementById("site-nav");

    if (!menuToggle || !nav) {
        return;
    }

    const closeMenu = () => {
        menuToggle.setAttribute("aria-expanded", "false");
        nav.classList.remove("is-open");
        document.body.classList.remove("is-menu-open");
    };

    menuToggle.addEventListener("click", () => {
        const isOpen = menuToggle.getAttribute("aria-expanded") === "true";
        menuToggle.setAttribute("aria-expanded", String(!isOpen));
        nav.classList.toggle("is-open", !isOpen);
        document.body.classList.toggle("is-menu-open", !isOpen);
    });

    nav.querySelectorAll("a").forEach((link) => {
        link.addEventListener("click", closeMenu);
    });

    document.addEventListener("click", (event) => {
        if (!nav.contains(event.target) && !menuToggle.contains(event.target)) {
            closeMenu();
        }
    });

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
            closeMenu();
        }
    });

    window.addEventListener("resize", () => {
        if (window.innerWidth > 980) {
            closeMenu();
        }
    });
})();

(() => {
    const stage = document.querySelector(".showreel-stage");
    const follower = document.querySelector(".showreel-follower");
    const safeZone = document.querySelector(".showreel-actions");

    if (!stage || !follower || !safeZone) {
        return;
    }

    const canTrackPointer = window.matchMedia("(pointer: fine)").matches;
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (!canTrackPointer || prefersReducedMotion) {
        return;
    }

    const state = {
        currentX: 0,
        currentY: 0,
        targetX: 0,
        targetY: 0,
        frameId: 0,
        hovered: false,
        paused: false
    };

    const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

    const getRestingPosition = () => {
        const stageRect = stage.getBoundingClientRect();
        const followerRect = follower.getBoundingClientRect();
        const padding = 28;
        const x = stageRect.width * 0.58 - followerRect.width / 2;
        const y = stageRect.height * 0.2 - followerRect.height / 2;

        return {
            x: clamp(x, padding, Math.max(padding, stageRect.width - followerRect.width - padding)),
            y: clamp(y, padding, Math.max(padding, stageRect.height - followerRect.height - padding))
        };
    };

    const applyPosition = (x, y) => {
        stage.style.setProperty("--showreel-follower-x", `${x}px`);
        stage.style.setProperty("--showreel-follower-y", `${y}px`);
    };

    const animate = () => {
        const dx = state.targetX - state.currentX;
        const dy = state.targetY - state.currentY;

        state.currentX += dx * 0.16;
        state.currentY += dy * 0.16;
        applyPosition(state.currentX, state.currentY);

        if (Math.abs(dx) < 0.35 && Math.abs(dy) < 0.35) {
            state.currentX = state.targetX;
            state.currentY = state.targetY;
            applyPosition(state.currentX, state.currentY);
            state.frameId = 0;
            return;
        }

        state.frameId = window.requestAnimationFrame(animate);
    };

    const queueAnimation = () => {
        if (!state.frameId) {
            state.frameId = window.requestAnimationFrame(animate);
        }
    };

    const parkFollower = () => {
        const resting = getRestingPosition();
        state.targetX = resting.x;
        state.targetY = resting.y;
        queueAnimation();
    };

    const updateFollower = (event) => {
        const stageRect = stage.getBoundingClientRect();
        const safeRect = safeZone.getBoundingClientRect();
        const followerRect = follower.getBoundingClientRect();
        const padding = 22;
        const isInsideSafeZone =
            event.clientX >= safeRect.left &&
            event.clientX <= safeRect.right &&
            event.clientY >= safeRect.top &&
            event.clientY <= safeRect.bottom;

        state.paused = isInsideSafeZone;
        stage.classList.toggle("is-showreel-paused", isInsideSafeZone);

        if (isInsideSafeZone) {
            parkFollower();
            return;
        }

        state.targetX = clamp(
            event.clientX - stageRect.left - followerRect.width / 2,
            padding,
            Math.max(padding, stageRect.width - followerRect.width - padding)
        );
        state.targetY = clamp(
            event.clientY - stageRect.top - followerRect.height / 2,
            padding,
            Math.max(padding, stageRect.height - followerRect.height - padding)
        );
        queueAnimation();
    };

    stage.addEventListener("pointerenter", (event) => {
        if (event.pointerType !== "mouse") {
            return;
        }

        state.hovered = true;
        stage.classList.add("is-showreel-hovered");

        const resting = getRestingPosition();
        state.currentX = resting.x;
        state.currentY = resting.y;
        state.targetX = resting.x;
        state.targetY = resting.y;
        applyPosition(resting.x, resting.y);
        stage.classList.add("is-showreel-ready");

        updateFollower(event);
    });

    stage.addEventListener("pointermove", (event) => {
        if (!state.hovered || event.pointerType !== "mouse") {
            return;
        }

        updateFollower(event);
    });

    stage.addEventListener("pointerleave", () => {
        state.hovered = false;
        state.paused = false;
        stage.classList.remove("is-showreel-hovered", "is-showreel-paused");
        parkFollower();
    });

    window.addEventListener("resize", () => {
        parkFollower();
    });
})();

(() => {
    const card = document.querySelector("[data-portrait-card]");

    if (!card) {
        return;
    }

    const media = card.querySelector("[data-portrait-media]");
    const badge = card.querySelector("[data-portrait-badge]");
    const glow = card.querySelector("[data-portrait-glow]");

    if (!media || !badge || !glow) {
        return;
    }

    const isFinePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (!isFinePointer || prefersReducedMotion) {
        return;
    }

    const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
    const lerp = (start, end, amount) => start + (end - start) * amount;

    const state = {
        hovered: false,
        frameId: 0,
        rect: null,
        current: {
            tiltX: 0,
            tiltY: 0,
            mediaX: 0,
            mediaY: 0,
            mediaScale: 1,
            badgeX: 0,
            badgeY: 0,
            badgeZ: 0,
            highlightX: 50,
            highlightY: 50,
            highlightOpacity: 0,
            shadowDepth: 0
        },
        target: {
            tiltX: 0,
            tiltY: 0,
            mediaX: 0,
            mediaY: 0,
            mediaScale: 1,
            badgeX: 0,
            badgeY: 0,
            badgeZ: 0,
            highlightX: 50,
            highlightY: 50,
            highlightOpacity: 0,
            shadowDepth: 0
        }
    };

    const writeStyles = () => {
        card.style.setProperty("--portrait-tilt-x", `${state.current.tiltX.toFixed(3)}deg`);
        card.style.setProperty("--portrait-tilt-y", `${state.current.tiltY.toFixed(3)}deg`);
        card.style.setProperty("--portrait-media-x", `${state.current.mediaX.toFixed(3)}px`);
        card.style.setProperty("--portrait-media-y", `${state.current.mediaY.toFixed(3)}px`);
        card.style.setProperty("--portrait-media-scale", state.current.mediaScale.toFixed(4));
        card.style.setProperty("--portrait-badge-x", `${state.current.badgeX.toFixed(3)}px`);
        card.style.setProperty("--portrait-badge-y", `${state.current.badgeY.toFixed(3)}px`);
        card.style.setProperty("--portrait-badge-z", `${state.current.badgeZ.toFixed(3)}px`);
        card.style.setProperty("--portrait-highlight-x", `${state.current.highlightX.toFixed(2)}%`);
        card.style.setProperty("--portrait-highlight-y", `${state.current.highlightY.toFixed(2)}%`);
        card.style.setProperty("--portrait-highlight-opacity", state.current.highlightOpacity.toFixed(4));
        card.style.setProperty("--portrait-shadow-depth", state.current.shadowDepth.toFixed(4));
    };

    const resetTarget = () => {
        state.target.tiltX = 0;
        state.target.tiltY = 0;
        state.target.mediaX = 0;
        state.target.mediaY = 0;
        state.target.mediaScale = 1;
        state.target.badgeX = 0;
        state.target.badgeY = 0;
        state.target.badgeZ = 0;
        state.target.highlightX = 50;
        state.target.highlightY = 50;
        state.target.highlightOpacity = 0;
        state.target.shadowDepth = 0;
    };

    const animate = () => {
        state.frameId = 0;

        const smoothing = state.hovered ? 0.17 : 0.1;

        state.current.tiltX = lerp(state.current.tiltX, state.target.tiltX, smoothing);
        state.current.tiltY = lerp(state.current.tiltY, state.target.tiltY, smoothing);
        state.current.mediaX = lerp(state.current.mediaX, state.target.mediaX, smoothing);
        state.current.mediaY = lerp(state.current.mediaY, state.target.mediaY, smoothing);
        state.current.mediaScale = lerp(state.current.mediaScale, state.target.mediaScale, smoothing);
        state.current.badgeX = lerp(state.current.badgeX, state.target.badgeX, smoothing);
        state.current.badgeY = lerp(state.current.badgeY, state.target.badgeY, smoothing);
        state.current.badgeZ = lerp(state.current.badgeZ, state.target.badgeZ, smoothing);
        state.current.highlightX = lerp(state.current.highlightX, state.target.highlightX, smoothing);
        state.current.highlightY = lerp(state.current.highlightY, state.target.highlightY, smoothing);
        state.current.highlightOpacity = lerp(state.current.highlightOpacity, state.target.highlightOpacity, smoothing);
        state.current.shadowDepth = lerp(state.current.shadowDepth, state.target.shadowDepth, smoothing);
        writeStyles();

        const hasMotion = Math.abs(state.current.tiltX - state.target.tiltX) > 0.015 ||
            Math.abs(state.current.tiltY - state.target.tiltY) > 0.015 ||
            Math.abs(state.current.mediaX - state.target.mediaX) > 0.02 ||
            Math.abs(state.current.mediaY - state.target.mediaY) > 0.02 ||
            Math.abs(state.current.mediaScale - state.target.mediaScale) > 0.0008 ||
            Math.abs(state.current.badgeX - state.target.badgeX) > 0.02 ||
            Math.abs(state.current.badgeY - state.target.badgeY) > 0.02 ||
            Math.abs(state.current.badgeZ - state.target.badgeZ) > 0.02 ||
            Math.abs(state.current.highlightX - state.target.highlightX) > 0.04 ||
            Math.abs(state.current.highlightY - state.target.highlightY) > 0.04 ||
            Math.abs(state.current.highlightOpacity - state.target.highlightOpacity) > 0.003 ||
            Math.abs(state.current.shadowDepth - state.target.shadowDepth) > 0.004;

        if (hasMotion) {
            state.frameId = window.requestAnimationFrame(animate);
            return;
        }

        if (!state.hovered) {
            card.classList.remove("is-portrait-active");
        }
    };

    const requestTick = () => {
        if (!state.frameId) {
            state.frameId = window.requestAnimationFrame(animate);
        }
    };

    const refreshRect = () => {
        state.rect = media.getBoundingClientRect();
    };

    const handlePointer = (event) => {
        if (!state.rect || event.pointerType !== "mouse") {
            return;
        }

        const localX = clamp((event.clientX - state.rect.left) / state.rect.width, 0, 1);
        const localY = clamp((event.clientY - state.rect.top) / state.rect.height, 0, 1);
        const nx = localX * 2 - 1;
        const ny = localY * 2 - 1;
        const distanceFromCenter = clamp(Math.hypot(nx, ny), 0, 1);

        state.target.tiltX = -ny * SITE_MOTION.portraitCard.maxTiltX;
        state.target.tiltY = nx * SITE_MOTION.portraitCard.maxTiltY;
        state.target.mediaX = nx * SITE_MOTION.portraitCard.mediaShift;
        state.target.mediaY = ny * SITE_MOTION.portraitCard.mediaShift;
        state.target.mediaScale = SITE_MOTION.portraitCard.mediaScale;
        state.target.badgeX = nx * SITE_MOTION.portraitCard.badgeShiftX;
        state.target.badgeY = (-SITE_MOTION.portraitCard.badgeFloatY) + (ny * 2);
        state.target.badgeZ = SITE_MOTION.portraitCard.badgeDepthZ + (distanceFromCenter * 5);
        state.target.highlightX = localX * 100;
        state.target.highlightY = localY * 100;
        state.target.highlightOpacity = 0.12 + (distanceFromCenter * 0.14);
        state.target.shadowDepth = 0.5 + (distanceFromCenter * 0.22);

        requestTick();
    };

    card.addEventListener("pointerenter", (event) => {
        if (event.pointerType !== "mouse") {
            return;
        }

        state.hovered = true;
        card.classList.add("is-portrait-active");
        refreshRect();
        handlePointer(event);
    });

    card.addEventListener("pointermove", (event) => {
        if (!state.hovered || event.pointerType !== "mouse") {
            return;
        }

        handlePointer(event);
    });

    card.addEventListener("pointerleave", () => {
        state.hovered = false;
        resetTarget();
        requestTick();
    });

    card.addEventListener("pointercancel", () => {
        state.hovered = false;
        resetTarget();
        requestTick();
    });

    window.addEventListener("resize", () => {
        if (state.hovered) {
            refreshRect();
        }
    });

    window.addEventListener("scroll", () => {
        if (state.hovered) {
            refreshRect();
        }
    }, { passive: true });
})();

(() => {
    const accordions = document.querySelectorAll("[data-accordion]");

    if (!accordions.length) {
        return;
    }

    accordions.forEach((accordion) => {
        const items = Array.from(accordion.querySelectorAll(".plugin-faq-item"));

        const setOpenItem = (targetItem) => {
            items.forEach((item) => {
                const trigger = item.querySelector(".plugin-faq-trigger");
                const shouldOpen = item === targetItem;

                item.classList.toggle("is-open", shouldOpen);
                trigger.setAttribute("aria-expanded", String(shouldOpen));
            });
        };

        items.forEach((item) => {
            const trigger = item.querySelector(".plugin-faq-trigger");

            trigger.addEventListener("click", () => {
                const isOpen = item.classList.contains("is-open");
                setOpenItem(isOpen ? null : item);
            });
        });

        setOpenItem(items.find((item) => item.classList.contains("is-open")) ?? null);
    });
})();

(() => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const desktopMotion = window.matchMedia("(min-width: 981px) and (hover: hover) and (pointer: fine)");
    const pageSections = Array.from(document.querySelectorAll("main > section, .plugin-page-header, .plugin-section, .site-footer"));
    const cardSelectors = [".project-feature", ".project-card"];

    const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
    const isDesktopMotion = () => desktopMotion.matches && !prefersReducedMotion.matches;
    const isReducedMotion = () => prefersReducedMotion.matches;

    const setupMotionAttributes = () => {
        pageSections.forEach((section, index) => {
            if (!section.dataset.section) {
                section.dataset.section = section.id || `section-${index + 1}`;
            }

            const anchor = section.querySelector("[data-eyebrow-anchor], .eyebrow, .display-title, h1, h2");

            if (anchor && !anchor.hasAttribute("data-eyebrow-anchor")) {
                anchor.setAttribute("data-eyebrow-anchor", "");
            }

            const region = section.querySelector("[data-card-region], .projects-showcase, .projects-grid, .tools-grid");

            if (region && !region.hasAttribute("data-card-region")) {
                region.setAttribute("data-card-region", section.dataset.section);
            }

            cardSelectors.forEach((selector) => {
                section.querySelectorAll(selector).forEach((card) => {
                    if (!card.hasAttribute("data-card-interactive")) {
                        card.setAttribute("data-card-interactive", "");
                    }
                });
            });
        });
    };

    const markRevealTarget = (target, delayMs = 0) => {
        if (!target) {
            return;
        }
        target.setAttribute("data-reveal", "");
        target.style.setProperty("--reveal-delay", `${Math.max(0, delayMs)}ms`);
    };

    const setupHeroReveal = () => {
        const hero = document.querySelector(".showreel-hero");
        if (!hero) {
            return;
        }

        const targets = [
            hero.querySelector(".showreel-topbar .eyebrow"),
            hero.querySelector(".showreel-title"),
            hero.querySelector(".showreel-role"),
            hero.querySelector(".showreel-description"),
            ...Array.from(hero.querySelectorAll(".showreel-actions .btn"))
        ].filter(Boolean);

        if (!targets.length) {
            return;
        }

        targets.forEach((target, index) => {
            target.setAttribute("data-hero-reveal", "");
            markRevealTarget(target, SITE_MOTION.hero.initialDelayMs + (index * SITE_MOTION.hero.staggerMs));
            target.classList.add("is-reveal-ready");
        });

        if (isReducedMotion()) {
            targets.forEach((target) => {
                target.classList.add("is-revealed");
                target.classList.remove("is-reveal-ready");
            });
            return;
        }

        window.requestAnimationFrame(() => {
            window.requestAnimationFrame(() => {
                targets.forEach((target) => {
                    target.classList.add("is-revealed");
                    target.classList.remove("is-reveal-ready");
                });
            });
        });
    };

    const setupRevealMotion = () => {
        const revealTargets = new Set();
        const addTarget = (target, delay = 0) => {
            if (!target || revealTargets.has(target)) {
                return;
            }
            markRevealTarget(target, delay);
            revealTargets.add(target);
        };
        const addTargets = (selector) => {
            document.querySelectorAll(selector).forEach((target) => addTarget(target));
        };
        const addStaggered = (containerSelector, itemSelector, stagger = SITE_MOTION.reveal.staggerMs) => {
            const scopedSelector = itemSelector
                .split(",")
                .map((selector) => `:scope > ${selector.trim()}`)
                .join(", ");
            document.querySelectorAll(containerSelector).forEach((container) => {
                Array.from(container.querySelectorAll(scopedSelector)).forEach((item, index) => {
                    addTarget(item, index * stagger);
                });
            });
        };

        addTargets(".split-heading > *");
        addTargets(".eyebrow:not([data-hero-reveal])");
        addTargets(".resource-stage-copy > *");
        addTargets(".plugin-page-header > *");
        addTargets(".plugin-intro, .plugin-media");
        addTargets(".plugin-section > .eyebrow, .plugin-section > h2, .plugin-section > p");
        addTargets(".plugin-detail-card, .plugin-setup-card");
        addTargets(".about-story, .resource-intro, .resource-card, .archive-summary");
        addStaggered(".projects-showcase", ".project-feature");
        addStaggered(".projects-grid", ".project-card");
        addStaggered(".tools-grid", ".tool-card");
        addStaggered(".about-grid", "*");
        addStaggered(".about-detail-grid", ".about-story");
        addStaggered(".resource-grid", ".resource-card");
        addStaggered(".plugin-detail-grid", ".plugin-detail-card");
        addStaggered(".plugin-setup-grid", ".plugin-setup-card");
        addStaggered(".footer-panel", ".footer-card", 70);
        document.querySelectorAll(".footer-links > a, .footer-links > span").forEach((item) => {
            item.classList.remove("is-reveal-ready");
            item.classList.add("is-revealed");
            item.removeAttribute("data-reveal");
        });

        const targets = Array.from(revealTargets);
        if (!targets.length) {
            return;
        }

        document.documentElement.classList.add("has-motion");

        if (isReducedMotion() || !("IntersectionObserver" in window)) {
            targets.forEach((target) => {
                target.classList.add("is-revealed");
                target.classList.remove("is-reveal-ready");
            });
            return;
        }

        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) {
                    return;
                }
                entry.target.classList.add("is-revealed");
                entry.target.classList.remove("is-reveal-ready");
                observer.unobserve(entry.target);
            });
        }, {
            threshold: SITE_MOTION.reveal.threshold,
            rootMargin: SITE_MOTION.reveal.rootMargin
        });

        targets.forEach((target) => {
            if (target.classList.contains("is-revealed")) {
                return;
            }
            const rect = target.getBoundingClientRect();
            const closeToViewport = rect.top < (window.innerHeight * 0.92) && rect.bottom > 0;
            if (closeToViewport) {
                target.classList.add("is-revealed");
                target.classList.remove("is-reveal-ready");
            } else {
                target.classList.add("is-reveal-ready");
                observer.observe(target);
            }
        });
    };

    const setupCardPointerMotion = () => {
        const regions = Array.from(document.querySelectorAll(".projects-showcase, .projects-grid, [data-card-region]"));

        if (!regions.length || !isDesktopMotion()) {
            return;
        }

        const resetCard = (card) => {
            card.style.setProperty("--card-hover-lift", "0px");
            card.style.setProperty("--card-hover-scale", "1");
            card.style.setProperty("--card-shadow-depth", "0");
        };

        regions.forEach((region) => {
            const cards = Array.from(region.querySelectorAll("[data-card-interactive]"));

            if (!cards.length) {
                return;
            }

            const state = {
                pointerX: 0,
                pointerY: 0,
                frameId: 0,
                active: false
            };

            const updateCards = () => {
                state.frameId = 0;

                cards.forEach((card) => {
                    const rect = card.getBoundingClientRect();
                    const isInViewport = rect.bottom > 0 && rect.top < window.innerHeight;

                    if (!state.active || !isInViewport) {
                        resetCard(card);
                        return;
                    }

                    const centerX = rect.left + rect.width / 2;
                    const centerY = rect.top + rect.height / 2;
                    const distance = Math.hypot(state.pointerX - centerX, (state.pointerY - centerY) * 1.08);
                    const intensity = clamp(1 - distance / SITE_MOTION.cardHover.influenceRadius, 0, 1);
                    const eased = Math.pow(intensity, 1.85);
                    const lift = -SITE_MOTION.cardHover.maxLift * eased;
                    const scale = 1 + SITE_MOTION.cardHover.maxScale * eased;
                    const shadowDepth = clamp(eased * 0.9, 0, 0.9);

                    card.style.setProperty("--card-hover-lift", `${lift.toFixed(2)}px`);
                    card.style.setProperty("--card-hover-scale", scale.toFixed(4));
                    card.style.setProperty("--card-shadow-depth", shadowDepth.toFixed(3));
                });
            };

            const requestUpdate = () => {
                if (!state.frameId) {
                    state.frameId = window.requestAnimationFrame(updateCards);
                }
            };

            region.addEventListener("pointerenter", (event) => {
                if (event.pointerType !== "mouse" || !isDesktopMotion()) {
                    return;
                }

                state.active = true;
                state.pointerX = event.clientX;
                state.pointerY = event.clientY;
                requestUpdate();
            });

            region.addEventListener("pointermove", (event) => {
                if (event.pointerType !== "mouse" || !isDesktopMotion()) {
                    return;
                }

                state.active = true;
                state.pointerX = event.clientX;
                state.pointerY = event.clientY;
                requestUpdate();
            });

            region.addEventListener("pointerleave", () => {
                state.active = false;
                requestUpdate();
            });

            window.addEventListener("resize", requestUpdate);
            window.addEventListener("scroll", requestUpdate, { passive: true });
        });
    };

    const setupToolCardTilt = () => {
        if (!isDesktopMotion()) {
            return;
        }

        const cards = Array.from(document.querySelectorAll(".tool-card--link"));
        if (!cards.length) {
            return;
        }

        const lerp = (start, end, amount) => start + ((end - start) * amount);
        const clamp01 = (value) => clamp(value, 0, 1);

        cards.forEach((card) => {
            const state = {
                active: false,
                frameId: 0,
                rect: null,
                currentTiltX: 0,
                currentTiltY: 0,
                currentGlowX: 50,
                currentGlowY: 50,
                currentGlowOpacity: 0,
                targetTiltX: 0,
                targetTiltY: 0,
                targetGlowX: 50,
                targetGlowY: 50,
                targetGlowOpacity: 0
            };

            const write = () => {
                card.style.setProperty("--motion-tilt-x", `${state.currentTiltX.toFixed(3)}deg`);
                card.style.setProperty("--motion-tilt-y", `${state.currentTiltY.toFixed(3)}deg`);
                card.style.setProperty("--tool-glow-x", `${state.currentGlowX.toFixed(2)}%`);
                card.style.setProperty("--tool-glow-y", `${state.currentGlowY.toFixed(2)}%`);
                card.style.setProperty("--tool-glow-opacity", state.currentGlowOpacity.toFixed(4));
            };

            const animate = () => {
                state.frameId = 0;
                const smoothing = state.active ? 0.17 : 0.14;
                state.currentTiltX = lerp(state.currentTiltX, state.targetTiltX, smoothing);
                state.currentTiltY = lerp(state.currentTiltY, state.targetTiltY, smoothing);
                state.currentGlowX = lerp(state.currentGlowX, state.targetGlowX, smoothing);
                state.currentGlowY = lerp(state.currentGlowY, state.targetGlowY, smoothing);
                state.currentGlowOpacity = lerp(state.currentGlowOpacity, state.targetGlowOpacity, smoothing);
                write();

                const isMoving = Math.abs(state.currentTiltX - state.targetTiltX) > 0.015 ||
                    Math.abs(state.currentTiltY - state.targetTiltY) > 0.015 ||
                    Math.abs(state.currentGlowX - state.targetGlowX) > 0.03 ||
                    Math.abs(state.currentGlowY - state.targetGlowY) > 0.03 ||
                    Math.abs(state.currentGlowOpacity - state.targetGlowOpacity) > 0.003;

                if (isMoving) {
                    state.frameId = window.requestAnimationFrame(animate);
                }
            };

            const requestTick = () => {
                if (!state.frameId) {
                    state.frameId = window.requestAnimationFrame(animate);
                }
            };

            const resetTarget = () => {
                state.targetTiltX = 0;
                state.targetTiltY = 0;
                state.targetGlowX = 50;
                state.targetGlowY = 50;
                state.targetGlowOpacity = 0;
                requestTick();
            };

            const setTargetFromEvent = (event) => {
                if (!state.rect) {
                    return;
                }
                const localX = clamp01((event.clientX - state.rect.left) / state.rect.width);
                const localY = clamp01((event.clientY - state.rect.top) / state.rect.height);
                const nx = localX * 2 - 1;
                const ny = localY * 2 - 1;
                const distance = clamp01(Math.hypot(nx, ny));

                state.targetTiltX = -ny * SITE_MOTION.toolTilt.maxTiltX;
                state.targetTiltY = nx * SITE_MOTION.toolTilt.maxTiltY;
                state.targetGlowX = localX * 100;
                state.targetGlowY = localY * 100;
                state.targetGlowOpacity = SITE_MOTION.toolTilt.glowOpacity * (0.45 + (distance * 0.55));
                requestTick();
            };

            const refreshRect = () => {
                state.rect = card.getBoundingClientRect();
            };

            card.addEventListener("pointerenter", (event) => {
                if (event.pointerType !== "mouse" || !isDesktopMotion()) {
                    return;
                }
                state.active = true;
                refreshRect();
                setTargetFromEvent(event);
            });

            card.addEventListener("pointermove", (event) => {
                if (!state.active || event.pointerType !== "mouse" || !isDesktopMotion()) {
                    return;
                }
                setTargetFromEvent(event);
            });

            card.addEventListener("pointerleave", () => {
                state.active = false;
                resetTarget();
            });

            window.addEventListener("resize", () => {
                if (state.active) {
                    refreshRect();
                }
            });
        });
    };

    setupMotionAttributes();
    setupHeroReveal();
    setupRevealMotion();
    setupCardPointerMotion();
    setupToolCardTilt();
})();

(() => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sections = Array.from(document.querySelectorAll("main > section, .plugin-page-header, .plugin-section, .site-footer"));
    const header = document.querySelector(".site-header");
    const IDLE_DELAY_MS = 2600;
    const SNAP_EPSILON = 12;
    let idleTimer = 0;
    let isAutoSnapping = false;

    if (!sections.length || prefersReducedMotion.matches) {
        return;
    }

    const isTypingContext = () => {
        const active = document.activeElement;
        return Boolean(
            active &&
            (active.tagName === "INPUT" ||
            active.tagName === "TEXTAREA" ||
            active.tagName === "SELECT" ||
            active.isContentEditable)
        );
    };

    const getHeaderOffset = () => {
        if (!header) {
            return 0;
        }
        return Math.max(0, Math.round(header.getBoundingClientRect().height + 8));
    };

    const getNearestSection = () => {
        const viewportCenterY = window.scrollY + (window.innerHeight * 0.5);
        let nearest = null;
        let minDistance = Number.POSITIVE_INFINITY;

        sections.forEach((section) => {
            const rect = section.getBoundingClientRect();
            const top = rect.top + window.scrollY;
            const center = top + (rect.height * 0.5);
            const distance = Math.abs(viewportCenterY - center);

            if (distance < minDistance) {
                minDistance = distance;
                nearest = section;
            }
        });

        return nearest;
    };

    const snapToNearestSection = () => {
        idleTimer = 0;

        if (document.visibilityState !== "visible" || isTypingContext()) {
            return;
        }

        if (document.body.classList.contains("is-menu-open")) {
            return;
        }

        const nearest = getNearestSection();
        if (!nearest) {
            return;
        }

        const targetY = Math.max(
            0,
            Math.round(nearest.getBoundingClientRect().top + window.scrollY - getHeaderOffset())
        );
        const delta = Math.abs(window.scrollY - targetY);

        if (delta <= SNAP_EPSILON) {
            return;
        }

        isAutoSnapping = true;
        window.scrollTo({
            top: targetY,
            behavior: "smooth"
        });

        window.setTimeout(() => {
            isAutoSnapping = false;
        }, 520);
    };

    const queueIdleSnap = () => {
        if (idleTimer) {
            window.clearTimeout(idleTimer);
        }
        idleTimer = window.setTimeout(snapToNearestSection, IDLE_DELAY_MS);
    };

    const handleUserActivity = () => {
        if (isAutoSnapping) {
            return;
        }
        queueIdleSnap();
    };

    ["scroll", "wheel", "touchstart", "touchmove", "pointerdown", "keydown"].forEach((eventName) => {
        window.addEventListener(eventName, handleUserActivity, { passive: true });
    });

    document.addEventListener("visibilitychange", () => {
        if (document.visibilityState !== "visible") {
            if (idleTimer) {
                window.clearTimeout(idleTimer);
                idleTimer = 0;
            }
            return;
        }
        queueIdleSnap();
    });

    queueIdleSnap();
})();

const initSalesCtaState = () => {
    const body = document.body;
    const salesCtas = Array.from(document.querySelectorAll("[data-sales-cta]"));

    if (!body || !salesCtas.length) {
        return;
    }

    const LOCKED_LABEL = "Coming Soon";
    const LOCKED_TITLE = "Coming soon";

    const getSalesState = (cta) => {
        const scopedRoot = cta.closest("[data-sales-state]");
        const root = scopedRoot || body;
        const rawState = root.dataset.salesState || "live";
        return String(rawState).toLowerCase() === "locked" ? "locked" : "live";
    };

    const getLiveLabel = (cta) => {
        if (cta.dataset.liveLabel) {
            return cta.dataset.liveLabel.trim();
        }

        const labelEl = cta.querySelector(".sales-cta-label");
        const sourceText = labelEl ? labelEl.textContent : cta.textContent;
        const label = (sourceText || "").replace(/\s+/g, " ").trim();

        if (label) {
            cta.dataset.liveLabel = label;
        }

        return label;
    };

    const ensureLabelElement = (cta, initialText) => {
        let labelEl = cta.querySelector(".sales-cta-label");
        if (labelEl) {
            return labelEl;
        }

        labelEl = document.createElement("span");
        labelEl.className = "sales-cta-label";
        labelEl.textContent = initialText;
        cta.textContent = "";
        cta.appendChild(labelEl);
        return labelEl;
    };

    const handleLockedClick = (event) => {
        const cta = event.currentTarget;
        if (!(cta instanceof HTMLElement)) {
            return;
        }

        if (cta.getAttribute("aria-disabled") !== "true") {
            return;
        }

        event.preventDefault();
        event.stopPropagation();
    };

    salesCtas.forEach((cta) => {
        if (!(cta instanceof HTMLElement)) {
            return;
        }

        const salesState = getSalesState(cta);
        const liveLabel = getLiveLabel(cta);
        const labelEl = ensureLabelElement(cta, liveLabel);

        if (cta.dataset.liveTitle === undefined) {
            cta.dataset.liveTitle = cta.getAttribute("title") || "";
        }

        if (cta.dataset.salesBound !== "true") {
            cta.addEventListener("click", handleLockedClick);
            cta.dataset.salesBound = "true";
        }

        if (salesState === "locked") {
            labelEl.textContent = LOCKED_LABEL;
            cta.setAttribute("aria-disabled", "true");
            cta.setAttribute("title", LOCKED_TITLE);
            cta.setAttribute("tabindex", "-1");
            return;
        }

        labelEl.textContent = liveLabel || LOCKED_LABEL;
        cta.removeAttribute("aria-disabled");
        cta.removeAttribute("tabindex");

        if (cta.dataset.liveTitle) {
            cta.setAttribute("title", cta.dataset.liveTitle);
        } else {
            cta.removeAttribute("title");
        }
    });
};

initSalesCtaState();
