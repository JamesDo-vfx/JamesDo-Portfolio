const SITE_MOTION = {
    // Central place to tune the editorial motion language without chasing magic numbers.
    reveal: {
        offset: 18,
        staggerMs: 48,
        threshold: 0.22,
        rootMargin: "0px 0px -10% 0px"
    },
    cardHover: {
        maxLift: 12,
        maxScale: 0.01,
        influenceRadius: 280
    },
    snap: {
        enabled: true,
        idleMs: 3000,
        cooldownMs: 9000,
        sameSectionCooldownMs: 22000,
        settleMs: 950,
        nearAnchorPx: 28,
        minVisiblePx: 120
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
    const pageSections = Array.from(document.querySelectorAll("main > section, .plugin-page-header, .plugin-section"));
    const cardSelectors = [".project-feature", ".project-card"];

    const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
    const isDesktopMotion = () => desktopMotion.matches && !prefersReducedMotion.matches;

    const setupMotionAttributes = () => {
        pageSections.forEach((section, index) => {
            if (!section.dataset.section) {
                section.dataset.section = section.id || `section-${index + 1}`;
            }

            const anchor = section.querySelector("[data-eyebrow-anchor], .eyebrow, .display-title, h1, h2");

            if (anchor && !anchor.hasAttribute("data-eyebrow-anchor")) {
                anchor.setAttribute("data-eyebrow-anchor", "");
            }

            const region = section.querySelector("[data-card-region], .projects-showcase, .projects-grid");

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

    const setupRevealMotion = () => {
        const targets = Array.from(
            document.querySelectorAll(`
                .showreel-topbar > *,
                .showreel-copy > *,
                .resource-stage-copy > *,
                .split-heading > *,
                .plugin-page-header > *,
                .plugin-intro,
                .plugin-media,
                .plugin-section > .eyebrow,
                .plugin-section > h2,
                .plugin-section > p,
                .plugin-detail-card,
                .plugin-setup-card,
                .project-feature,
                .project-card,
                .tool-card,
                .about-panel,
                .about-story,
                .resource-intro,
                .resource-card,
                .archive-summary,
                .footer-card
            `)
        );

        if (!targets.length) {
            return;
        }

        const groups = Array.from(document.querySelectorAll(".projects-grid, .tools-grid, .resource-grid, .plugin-detail-grid, .plugin-setup-grid, .footer-panel"));

        groups.forEach((group) => {
            Array.from(group.children).forEach((item, index) => {
                item.setAttribute("data-reveal", "");
                item.style.setProperty("--reveal-delay", `${index * SITE_MOTION.reveal.staggerMs}ms`);
            });
        });

        targets.forEach((target) => {
            target.setAttribute("data-reveal", "");
        });

        const revealTargets = Array.from(document.querySelectorAll("[data-reveal]"));

        revealTargets.forEach((target) => {
            const rect = target.getBoundingClientRect();
            const isInitiallyVisible = rect.top < window.innerHeight * 0.9;

            if (isInitiallyVisible || prefersReducedMotion.matches) {
                target.classList.add("is-revealed");
                return;
            }

            target.classList.add("is-reveal-ready");
        });

        document.documentElement.classList.add("has-motion");

        if (prefersReducedMotion.matches || !("IntersectionObserver" in window)) {
            revealTargets.forEach((target) => {
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

        revealTargets.forEach((target) => {
            if (!target.classList.contains("is-revealed")) {
                observer.observe(target);
            }
        });
    };

    const setupCardPointerMotion = () => {
        const regions = Array.from(document.querySelectorAll("[data-card-region]"));

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

    const setupIdleSnap = () => {
        if (!SITE_MOTION.snap.enabled || !isDesktopMotion()) {
            return;
        }

        const sections = pageSections
            .map((section) => ({
                element: section,
                anchor: section.querySelector("[data-eyebrow-anchor]")
            }))
            .filter((item) => item.anchor);

        if (!sections.length) {
            return;
        }

        const state = {
            idleTimer: 0,
            cooldownUntil: 0,
            lastActivityAt: performance.now(),
            lastSnapAt: 0,
            lastSnappedSection: "",
            lastScrollAt: performance.now(),
            hoverInteractive: false
        };

        const focusGuardSelector = "button, input, textarea, select, [contenteditable=\"true\"], [role=\"button\"]";
        const hoverGuardSelector = "a, button, input, textarea, select, label, [role=\"button\"], [contenteditable=\"true\"], .nav-links, .menu-toggle";

        const getHeaderOffset = () => {
            const header = document.querySelector(".site-header");
            const headerHeight = header ? header.getBoundingClientRect().height : 0;

            return headerHeight + 18;
        };

        const isSelectionActive = () => {
            const selection = window.getSelection();
            return Boolean(selection && selection.toString().trim());
        };

        const isUserBusy = () => {
            const activeElement = document.activeElement;
            const hasInteractiveFocus = activeElement && activeElement !== document.body && activeElement.matches(focusGuardSelector);
            const modalOpen = document.querySelector("[aria-modal=\"true\"], dialog[open], .is-modal-open");

            return document.body.classList.contains("is-menu-open") ||
                hasInteractiveFocus ||
                state.hoverInteractive ||
                isSelectionActive() ||
                Boolean(modalOpen);
        };

        const getSectionVisibility = (section) => {
            const rect = section.element.getBoundingClientRect();
            const visiblePx = Math.min(rect.bottom, window.innerHeight) - Math.max(rect.top, 0);

            if (visiblePx <= SITE_MOTION.snap.minVisiblePx) {
                return 0;
            }

            return visiblePx / Math.min(window.innerHeight, rect.height || window.innerHeight);
        };

        const getBestSection = () => {
            return sections.reduce((best, section) => {
                const visibility = getSectionVisibility(section);

                if (!best || visibility > best.visibility) {
                    return { section, visibility };
                }

                return best;
            }, null);
        };

        const trySnap = () => {
            const now = performance.now();

            if (!isDesktopMotion() || now < state.cooldownUntil || isUserBusy()) {
                return;
            }

            if (now - state.lastScrollAt < SITE_MOTION.snap.settleMs) {
                return;
            }

            const bestMatch = getBestSection();

            if (!bestMatch || bestMatch.visibility <= 0) {
                return;
            }

            const { section } = bestMatch;
            const anchorRect = section.anchor.getBoundingClientRect();
            const anchorTop = anchorRect.top + window.scrollY - getHeaderOffset();

            if (Math.abs(anchorRect.top - getHeaderOffset()) <= SITE_MOTION.snap.nearAnchorPx) {
                state.cooldownUntil = now + SITE_MOTION.snap.cooldownMs;
                return;
            }

            if (state.lastSnappedSection === section.element.dataset.section &&
                now - state.lastSnapAt < SITE_MOTION.snap.sameSectionCooldownMs) {
                return;
            }

            state.lastSnappedSection = section.element.dataset.section;
            state.lastSnapAt = now;
            state.cooldownUntil = now + SITE_MOTION.snap.cooldownMs;

            window.scrollTo({
                top: Math.max(0, anchorTop),
                behavior: "smooth"
            });
        };

        const queueIdleCheck = () => {
            window.clearTimeout(state.idleTimer);
            state.idleTimer = window.setTimeout(trySnap, SITE_MOTION.snap.idleMs);
        };

        const noteActivity = () => {
            state.lastActivityAt = performance.now();
            queueIdleCheck();
        };

        ["mousemove", "pointerdown", "keydown", "touchstart"].forEach((eventName) => {
            window.addEventListener(eventName, noteActivity, { passive: true });
        });

        window.addEventListener("wheel", () => {
            state.lastScrollAt = performance.now();
            noteActivity();
        }, { passive: true });

        window.addEventListener("scroll", () => {
            state.lastScrollAt = performance.now();
        }, { passive: true });

        document.addEventListener("pointerover", (event) => {
            state.hoverInteractive = event.target instanceof Element
                ? Boolean(event.target.closest(hoverGuardSelector))
                : false;
        });

        document.addEventListener("pointerout", (event) => {
            if (!event.relatedTarget) {
                state.hoverInteractive = false;
                return;
            }

            state.hoverInteractive = event.relatedTarget instanceof Element
                ? Boolean(event.relatedTarget.closest(hoverGuardSelector))
                : false;
        });

        queueIdleCheck();
    };

    setupMotionAttributes();
    setupRevealMotion();
    setupCardPointerMotion();
    setupIdleSnap();
})();
