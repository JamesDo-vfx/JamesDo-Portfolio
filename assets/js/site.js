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
