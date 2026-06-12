/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * HAIR PLAY COIFFURE — Premium Salon Website
 * Complete Interactive JavaScript Module
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Modules:
 *   1. Particle Engine (Canvas)       — Golden micro-particles with physics
 *   2. Dynamic Navbar                 — Scroll-aware + mobile menu
 *   3. Animated Counters              — IntersectionObserver + easeOutCubic
 *   4. Pricing Tabs Engine            — Cinematic panel transitions
 *   5. Gallery Filter                 — Category filter with stagger
 *   6. Scroll-Driven Reveal           — Staggered viewport animations
 *   7. FAQ Accordion                  — Single-open with max-height animation
 *   8. Smooth Scroll                  — Anchor links with navbar offset
 *
 * Author: Hair Play Coiffure Dev Team
 * Version: 1.0.0
 * ═══════════════════════════════════════════════════════════════════════════════
 */

document.addEventListener('DOMContentLoaded', () => {
    'use strict';

    // ═══════════════════════════════════════════════════════════════════════════
    // 1. PARTICLE ENGINE (Canvas)
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * Creates an interactive particle system on the hero canvas.
     * Particles are golden and white, float fluidly, react to mouse movement,
     * and draw connecting lines between nearby neighbors.
     */
    const ParticleEngine = (() => {
        // --- DOM references ---
        const canvas = document.getElementById('particle-canvas');
        // Guard: if canvas is missing, return a no-op module
        if (!canvas) {
            return { init: () => {} };
        }
        const ctx = canvas.getContext('2d');

        // --- Configuration ---
        const CONFIG = {
            /** Particle count adapts to screen width */
            desktopCount: 80,
            mobileCount: 40,
            mobileBreakpoint: 768,
            /** Particle appearance */
            minRadius: 1,
            maxRadius: 3,
            minOpacity: 0.2,
            maxOpacity: 0.8,
            /** Particle movement */
            minSpeed: 0.15,
            maxSpeed: 0.6,
            /** Available particle colors (gold palette + white) */
            colors: ['#C9A84C', '#E8C96A', '#FFFFFF'],
            /** Connecting lines */
            lineDistance: 100,
            lineOpacity: 0.12,
            /** Mouse interaction */
            mouseRadius: 150,
            mouseForce: 0.02
        };

        // --- State ---
        let particles = [];
        let animationId = null;
        /** Mouse position; defaults to off-screen so no interaction until move */
        let mouse = { x: -9999, y: -9999 };

        /**
         * Returns a random float between min and max (inclusive of min, exclusive of max).
         * @param {number} min - Lower bound.
         * @param {number} max - Upper bound.
         * @returns {number} Random float.
         */
        const randomRange = (min, max) => Math.random() * (max - min) + min;

        /**
         * Returns the ideal particle count based on current viewport width.
         * @returns {number} Particle count.
         */
        const getParticleCount = () =>
            window.innerWidth <= CONFIG.mobileBreakpoint
                ? CONFIG.mobileCount
                : CONFIG.desktopCount;

        /**
         * Resizes the canvas to match its parent container dimensions.
         * Uses the parent element (the #hero section) so the canvas always fills it.
         */
        const resizeCanvas = () => {
            const parent = canvas.parentElement;
            canvas.width = parent.offsetWidth;
            canvas.height = parent.offsetHeight;
        };

        /**
         * Creates a single particle object with randomized properties.
         * @returns {Object} Particle with position, velocity, radius, opacity, and color.
         */
        const createParticle = () => ({
            x: randomRange(0, canvas.width),
            y: randomRange(0, canvas.height),
            vx: randomRange(-CONFIG.maxSpeed, CONFIG.maxSpeed) || CONFIG.minSpeed,
            vy: randomRange(-CONFIG.maxSpeed, CONFIG.maxSpeed) || CONFIG.minSpeed,
            radius: randomRange(CONFIG.minRadius, CONFIG.maxRadius),
            opacity: randomRange(CONFIG.minOpacity, CONFIG.maxOpacity),
            color: CONFIG.colors[Math.floor(Math.random() * CONFIG.colors.length)]
        });

        /**
         * Populates the particles array with freshly created particles.
         * Clears any existing particles first.
         */
        const populateParticles = () => {
            particles = [];
            const count = getParticleCount();
            for (let i = 0; i < count; i++) {
                particles.push(createParticle());
            }
        };

        /**
         * Updates a single particle's position, applies boundary wrapping,
         * and applies gentle mouse attraction/repulsion.
         * @param {Object} p - The particle to update.
         */
        const updateParticle = (p) => {
            // --- Mouse interaction: gentle repulsion ---
            const dx = p.x - mouse.x;
            const dy = p.y - mouse.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < CONFIG.mouseRadius && dist > 0) {
                // Normalize the direction vector and scale by force
                const force = (CONFIG.mouseRadius - dist) / CONFIG.mouseRadius * CONFIG.mouseForce;
                p.vx += (dx / dist) * force;
                p.vy += (dy / dist) * force;
            }

            // --- Apply velocity with light damping for smooth deceleration ---
            p.vx *= 0.99;
            p.vy *= 0.99;

            // Clamp velocity so particles don't fly away
            const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
            if (speed > CONFIG.maxSpeed) {
                p.vx = (p.vx / speed) * CONFIG.maxSpeed;
                p.vy = (p.vy / speed) * CONFIG.maxSpeed;
            }
            // Ensure a minimum drift so particles never fully stop
            if (speed < CONFIG.minSpeed) {
                const angle = Math.atan2(p.vy, p.vx);
                p.vx = Math.cos(angle) * CONFIG.minSpeed;
                p.vy = Math.sin(angle) * CONFIG.minSpeed;
            }

            // --- Move ---
            p.x += p.vx;
            p.y += p.vy;

            // --- Boundary wrapping (seamless edges) ---
            if (p.x < -p.radius) p.x = canvas.width + p.radius;
            if (p.x > canvas.width + p.radius) p.x = -p.radius;
            if (p.y < -p.radius) p.y = canvas.height + p.radius;
            if (p.y > canvas.height + p.radius) p.y = -p.radius;
        };

        /**
         * Draws a single particle as a filled circle with its assigned color and opacity.
         * @param {Object} p - The particle to draw.
         */
        const drawParticle = (p) => {
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            ctx.fillStyle = p.color;
            ctx.globalAlpha = p.opacity;
            ctx.fill();
        };

        /**
         * Draws semi-transparent connecting lines between particles that are
         * within CONFIG.lineDistance of each other. Uses a double-loop avoiding
         * duplicate pairs (i < j).
         */
        const drawConnections = () => {
            const len = particles.length;
            for (let i = 0; i < len; i++) {
                for (let j = i + 1; j < len; j++) {
                    const a = particles[i];
                    const b = particles[j];
                    const dx = a.x - b.x;
                    const dy = a.y - b.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);

                    if (dist < CONFIG.lineDistance) {
                        // Opacity fades as distance approaches the threshold
                        const opacity = CONFIG.lineOpacity * (1 - dist / CONFIG.lineDistance);
                        ctx.beginPath();
                        ctx.moveTo(a.x, a.y);
                        ctx.lineTo(b.x, b.y);
                        ctx.strokeStyle = '#C9A84C';
                        ctx.globalAlpha = opacity;
                        ctx.lineWidth = 0.5;
                        ctx.stroke();
                    }
                }
            }
        };

        /**
         * Main animation loop. Clears the canvas, updates every particle,
         * draws connections, then draws each particle. Runs via requestAnimationFrame.
         */
        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Update all particles
            for (let i = 0; i < particles.length; i++) {
                updateParticle(particles[i]);
            }

            // Draw connecting lines first (behind particles)
            drawConnections();

            // Draw particles on top
            ctx.globalAlpha = 1; // Reset alpha before individual particle draws
            for (let i = 0; i < particles.length; i++) {
                drawParticle(particles[i]);
            }

            // Reset global alpha for next frame
            ctx.globalAlpha = 1;

            animationId = requestAnimationFrame(animate);
        };

        /**
         * Handles window resize: re-sizes canvas and re-populates particles
         * to match the new count for the current breakpoint.
         */
        const handleResize = () => {
            resizeCanvas();
            populateParticles();
        };

        /**
         * Tracks mouse position relative to the canvas for interaction.
         * @param {MouseEvent} e - The mousemove event.
         */
        const handleMouseMove = (e) => {
            const rect = canvas.getBoundingClientRect();
            mouse.x = e.clientX - rect.left;
            mouse.y = e.clientY - rect.top;
        };

        /**
         * Resets mouse to off-screen when cursor leaves the canvas area,
         * preventing particles from being stuck in a repulsed state.
         */
        const handleMouseLeave = () => {
            mouse.x = -9999;
            mouse.y = -9999;
        };

        /**
         * Initializes the particle engine: sizes the canvas, creates particles,
         * binds event listeners, and starts the animation loop.
         */
        const init = () => {
            resizeCanvas();
            populateParticles();

            // Debounced resize handler (150ms debounce)
            let resizeTimer;
            window.addEventListener('resize', () => {
                clearTimeout(resizeTimer);
                resizeTimer = setTimeout(handleResize, 150);
            });

            // Mouse interaction listeners (on canvas for accurate coordinates)
            canvas.addEventListener('mousemove', handleMouseMove);
            canvas.addEventListener('mouseleave', handleMouseLeave);

            // Touch support: map first touch to mouse position
            canvas.addEventListener('touchmove', (e) => {
                if (e.touches.length > 0) {
                    const rect = canvas.getBoundingClientRect();
                    mouse.x = e.touches[0].clientX - rect.left;
                    mouse.y = e.touches[0].clientY - rect.top;
                }
            }, { passive: true });

            canvas.addEventListener('touchend', handleMouseLeave);

            // Start animation
            animate();
        };

        return { init };
    })();


    // ═══════════════════════════════════════════════════════════════════════════
    // 2. DYNAMIC NAVBAR
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * Manages navbar scroll state (add/remove 'scrolled' class),
     * mobile hamburger menu toggle, and link click handling.
     */
    const DynamicNavbar = (() => {
        // --- DOM references ---
        const navbar = document.getElementById('navbar');
        const burger = document.getElementById('nav-burger');
        const mobileNav = document.getElementById('mobile-nav');

        // Guard: if navbar elements are missing, return no-op
        if (!navbar) {
            return { init: () => {} };
        }

        /** Scroll threshold in pixels before applying the 'scrolled' class */
        const SCROLL_THRESHOLD = 50;

        /**
         * Checks window scroll position and toggles the 'scrolled' class
         * on the navbar element.
         */
        const handleScroll = () => {
            if (window.scrollY > SCROLL_THRESHOLD) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
        };

        /**
         * Toggles the mobile navigation overlay and burger button active state.
         * Also manages the aria-expanded attribute for accessibility.
         */
        const toggleMobileNav = () => {
            if (!burger || !mobileNav) return;

            const isOpen = burger.classList.toggle('active');
            mobileNav.classList.toggle('active');
            burger.setAttribute('aria-expanded', isOpen.toString());

            // Prevent body scroll when mobile nav is open
            document.body.style.overflow = isOpen ? 'hidden' : '';
        };

        /**
         * Closes the mobile navigation if it's currently open.
         * Called when a link inside the mobile nav is clicked.
         */
        const closeMobileNav = () => {
            if (!burger || !mobileNav) return;

            burger.classList.remove('active');
            mobileNav.classList.remove('active');
            burger.setAttribute('aria-expanded', 'false');
            document.body.style.overflow = '';
        };

        /**
         * Initializes the dynamic navbar: binds scroll listener (passive),
         * burger toggle, and mobile nav link click handlers.
         */
        const init = () => {
            // Passive scroll listener for performance
            window.addEventListener('scroll', handleScroll, { passive: true });

            // Run once on load to set initial state (e.g., if page is refreshed mid-scroll)
            handleScroll();

            // Burger menu toggle
            if (burger) {
                burger.addEventListener('click', toggleMobileNav);
            }

            // Close mobile nav when clicking any link inside it
            if (mobileNav) {
                const mobileLinks = mobileNav.querySelectorAll('a');
                mobileLinks.forEach((link) => {
                    link.addEventListener('click', closeMobileNav);
                });
            }
        };

        return { init };
    })();


    // ═══════════════════════════════════════════════════════════════════════════
    // 3. ANIMATED COUNTERS (Intersection Observer)
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * Animates numeric counters from 0 to their data-count value when they
     * scroll into the viewport. Uses easeOutCubic for a decelerating feel.
     */
    const AnimatedCounters = (() => {
        /** All elements with a data-count attribute */
        const counters = document.querySelectorAll('.hero__stat-number[data-count]');

        // Guard: no counters found
        if (counters.length === 0) {
            return { init: () => {} };
        }

        /** Animation duration in milliseconds */
        const DURATION = 2000;

        /**
         * EaseOutCubic easing function.
         * Starts fast, then decelerates to a smooth stop.
         * @param {number} t - Normalized time (0 to 1).
         * @returns {number} Eased value (0 to 1).
         */
        const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

        /**
         * Animates a single counter element from 0 to its target value.
         * Uses requestAnimationFrame for smooth 60fps updates.
         * @param {HTMLElement} el - The counter DOM element.
         */
        const animateCounter = (el) => {
            const target = parseInt(el.getAttribute('data-count'), 10);
            if (isNaN(target)) return;

            const startTime = performance.now();

            /**
             * Per-frame update callback.
             * @param {DOMHighResTimeStamp} currentTime - Current timestamp from rAF.
             */
            const step = (currentTime) => {
                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / DURATION, 1); // Clamp to [0, 1]
                const easedProgress = easeOutCubic(progress);
                const currentValue = Math.round(easedProgress * target);

                el.textContent = currentValue;

                if (progress < 1) {
                    requestAnimationFrame(step);
                } else {
                    // Ensure final value is exact
                    el.textContent = target;
                }
            };

            requestAnimationFrame(step);
        };

        /**
         * Initializes the counters module. Creates an IntersectionObserver that
         * watches each counter and triggers animation when it enters the viewport.
         * Each counter only animates once (unobserved after trigger).
         */
        const init = () => {
            const observer = new IntersectionObserver(
                (entries, obs) => {
                    entries.forEach((entry) => {
                        if (entry.isIntersecting) {
                            animateCounter(entry.target);
                            obs.unobserve(entry.target); // Only animate once
                        }
                    });
                },
                {
                    threshold: 0.5 // Trigger when 50% of the element is visible
                }
            );

            counters.forEach((counter) => observer.observe(counter));
        };

        return { init };
    })();


    // ═══════════════════════════════════════════════════════════════════════════
    // 4. PRICING TABS ENGINE
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * Manages the pricing section tab navigation with cinematic fade transitions.
     * Clicking a tab fades out the current panel, swaps visibility, then fades in
     * the new panel, and re-triggers reveal animations on newly visible items.
     */
    const PricingTabs = (() => {
        const tabs = document.querySelectorAll('.pricing__tab[data-tab]');
        const panels = document.querySelectorAll('.pricing__panel[data-panel]');

        // Guard: no tabs or panels
        if (tabs.length === 0 || panels.length === 0) {
            return { init: () => {} };
        }

        /** Delay (ms) between fade-out and fade-in for the cinematic swap */
        const TRANSITION_DELAY = 200;

        /**
         * Retrieves the currently active tab name (data-tab value).
         * @returns {string|null} The active tab name, or null if none is active.
         */
        const getActiveTabName = () => {
            const activeTab = document.querySelector('.pricing__tab.active');
            return activeTab ? activeTab.getAttribute('data-tab') : null;
        };

        /**
         * Re-triggers reveal animations on pricing items inside a panel.
         * Removes 'active' from reveal elements, forces reflow, then re-adds
         * with a stagger delay.
         * @param {HTMLElement} panel - The panel whose items should re-animate.
         */
        const retriggerReveals = (panel) => {
            const revealItems = panel.querySelectorAll('.reveal');
            revealItems.forEach((item, index) => {
                // Remove active to reset the animation state
                item.classList.remove('active');
                // Force a reflow so removing + re-adding the class actually triggers CSS
                void item.offsetHeight;
                // Stagger each item by 100ms
                item.style.transitionDelay = `${index * 100}ms`;
                item.classList.add('active');
            });
        };

        /**
         * Switches to the specified tab and panel with a cinematic transition.
         * @param {string} tabName - The data-tab / data-panel value to activate.
         */
        const switchTab = (tabName) => {
            // If this tab is already active, do nothing
            if (tabName === getActiveTabName()) return;

            // Find the target panel
            const targetPanel = document.querySelector(`.pricing__panel[data-panel="${tabName}"]`);
            if (!targetPanel) return;

            // Step 1: Fade out all currently active panels
            panels.forEach((panel) => {
                if (panel.classList.contains('active')) {
                    panel.style.opacity = '0';
                }
            });

            // Step 2: Remove 'active' from all tabs, add to the clicked one
            tabs.forEach((tab) => tab.classList.remove('active'));
            const targetTab = document.querySelector(`.pricing__tab[data-tab="${tabName}"]`);
            if (targetTab) targetTab.classList.add('active');

            // Step 3: After the fade-out delay, swap panel visibility
            setTimeout(() => {
                // Hide all panels
                panels.forEach((panel) => {
                    panel.classList.remove('active');
                    panel.style.opacity = '0';
                });

                // Show target panel
                targetPanel.classList.add('active');

                // Force reflow before fading in, so the browser registers opacity: 0 first
                void targetPanel.offsetHeight;

                // Fade in
                targetPanel.style.opacity = '1';

                // Re-trigger reveal animations inside the newly visible panel
                retriggerReveals(targetPanel);
            }, TRANSITION_DELAY);
        };

        /**
         * Initializes the pricing tabs: binds click handlers to each tab button.
         */
        const init = () => {
            tabs.forEach((tab) => {
                tab.addEventListener('click', () => {
                    const tabName = tab.getAttribute('data-tab');
                    switchTab(tabName);
                });
            });

            // Ensure the initially active panel has opacity = 1
            const initialPanel = document.querySelector('.pricing__panel.active');
            if (initialPanel) {
                initialPanel.style.opacity = '1';
            }
        };

        return { init };
    })();


    // ═══════════════════════════════════════════════════════════════════════════
    // 5. GALLERY FILTER (Cinematic)
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * Manages gallery filtering by category with staggered show/hide animations.
     * Items that don't match the filter get class 'hidden'; matching items get
     * class 'visible' with incrementing transition delays for a cinematic stagger.
     */
    const GalleryFilter = (() => {
        const filterButtons = document.querySelectorAll('.gallery__filter[data-filter]');
        const galleryItems = document.querySelectorAll('.gallery__item[data-category]');

        // Guard: no filter buttons or gallery items
        if (filterButtons.length === 0 || galleryItems.length === 0) {
            return { init: () => {} };
        }

        /** Per-item stagger delay in milliseconds */
        const STAGGER_DELAY = 80;

        /**
         * Filters gallery items based on the selected category.
         * @param {string} category - The category to show ('all' shows everything).
         */
        const filterItems = (category) => {
            let visibleIndex = 0;

            galleryItems.forEach((item) => {
                const itemCategory = item.getAttribute('data-category');
                const matches = category === 'all' || itemCategory === category;

                if (matches) {
                    // Show this item with a staggered delay
                    item.classList.remove('hidden');
                    item.classList.add('visible');
                    item.style.transitionDelay = `${visibleIndex * STAGGER_DELAY}ms`;
                    visibleIndex++;
                } else {
                    // Hide this item
                    item.classList.add('hidden');
                    item.classList.remove('visible');
                    item.style.transitionDelay = '0ms';
                }
            });
        };

        /**
         * Initializes the gallery filter: binds click handlers to filter buttons.
         */
        const init = () => {
            filterButtons.forEach((btn) => {
                btn.addEventListener('click', () => {
                    // Update active state on buttons
                    filterButtons.forEach((b) => b.classList.remove('active'));
                    btn.classList.add('active');

                    // Apply the filter
                    const category = btn.getAttribute('data-filter');
                    filterItems(category);
                });
            });
        };

        return { init };
    })();


    // ═══════════════════════════════════════════════════════════════════════════
    // 6. SCROLL-DRIVEN REVEAL ANIMATIONS (Stagger Effect)
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * Uses IntersectionObserver to detect elements with [data-reveal] entering
     * the viewport and adds class 'active' with staggered delays based on
     * sibling index within their parent container.
     */
    const ScrollReveal = (() => {
        const revealElements = document.querySelectorAll('.reveal[data-reveal]');

        // Guard
        if (revealElements.length === 0) {
            return { init: () => {} };
        }

        /** Per-sibling stagger delay in milliseconds */
        const STAGGER_MS = 150;

        /** IntersectionObserver threshold (15% visible) */
        const THRESHOLD = 0.15;

        /**
         * Calculates the index of an element among its sibling .reveal elements
         * within the same parent container. This index determines its stagger delay.
         * @param {HTMLElement} el - The reveal element.
         * @returns {number} The zero-based index among siblings.
         */
        const getSiblingRevealIndex = (el) => {
            const parent = el.parentElement;
            if (!parent) return 0;

            const siblings = parent.querySelectorAll(':scope > .reveal[data-reveal]');
            let index = 0;
            for (let i = 0; i < siblings.length; i++) {
                if (siblings[i] === el) {
                    index = i;
                    break;
                }
            }
            return index;
        };

        /**
         * Initializes the scroll reveal system. Observes all [data-reveal]
         * elements and adds 'active' class with computed stagger delay when
         * they enter the viewport. Each element is only triggered once.
         */
        const init = () => {
            const observer = new IntersectionObserver(
                (entries, obs) => {
                    entries.forEach((entry) => {
                        if (entry.isIntersecting) {
                            const el = entry.target;
                            const index = getSiblingRevealIndex(el);
                            const delay = index * STAGGER_MS;

                            // Set the delay as a CSS custom property and inline style
                            el.style.transitionDelay = `${delay}ms`;
                            el.style.setProperty('--delay', `${delay}ms`);

                            el.classList.add('active');

                            // Unobserve: only reveal once
                            obs.unobserve(el);
                        }
                    });
                },
                {
                    threshold: THRESHOLD,
                    // Small negative margin so elements start revealing just before
                    // they fully enter the viewport, for a smoother feel
                    rootMargin: '0px 0px -50px 0px'
                }
            );

            revealElements.forEach((el) => observer.observe(el));
        };

        return { init };
    })();


    // ═══════════════════════════════════════════════════════════════════════════
    // 7. FAQ ACCORDION
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * Manages a single-open accordion where clicking a header opens its body
     * (animated via max-height) and closes any other open item.
     * Toggles aria-expanded and an 'active' class on the item.
     */
    const FAQAccordion = (() => {
        const accordion = document.getElementById('faq-accordion');

        // Guard
        if (!accordion) {
            return { init: () => {} };
        }

        const items = accordion.querySelectorAll('.accordion__item');

        /**
         * Opens an accordion item by expanding its body's max-height to
         * its natural scrollHeight, setting aria-expanded, and adding 'active'.
         * @param {HTMLElement} item - The .accordion__item to open.
         */
        const openItem = (item) => {
            const header = item.querySelector('.accordion__header');
            const body = item.querySelector('.accordion__body');
            if (!header || !body) return;

            item.classList.add('active');
            header.setAttribute('aria-expanded', 'true');
            body.style.maxHeight = body.scrollHeight + 'px';
        };

        /**
         * Closes an accordion item by collapsing its body's max-height to 0,
         * clearing aria-expanded, and removing 'active'.
         * @param {HTMLElement} item - The .accordion__item to close.
         */
        const closeItem = (item) => {
            const header = item.querySelector('.accordion__header');
            const body = item.querySelector('.accordion__body');
            if (!header || !body) return;

            item.classList.remove('active');
            header.setAttribute('aria-expanded', 'false');
            body.style.maxHeight = '0px';
        };

        /**
         * Closes all currently open accordion items.
         */
        const closeAllItems = () => {
            items.forEach((item) => {
                if (item.classList.contains('active')) {
                    closeItem(item);
                }
            });
        };

        /**
         * Handles a click on an accordion header.
         * If the clicked item is already open, it closes it.
         * Otherwise, it closes all open items first, then opens the clicked one.
         * @param {HTMLElement} clickedItem - The .accordion__item that was clicked.
         */
        const handleHeaderClick = (clickedItem) => {
            const isAlreadyOpen = clickedItem.classList.contains('active');

            if (isAlreadyOpen) {
                // Toggle off: close this item
                closeItem(clickedItem);
            } else {
                // Close any other open item first (single-open behavior)
                closeAllItems();
                // Open the clicked item
                openItem(clickedItem);
            }
        };

        /**
         * Initializes the accordion: binds click handlers to each header button,
         * and ensures all bodies start collapsed (max-height: 0).
         */
        const init = () => {
            items.forEach((item) => {
                const header = item.querySelector('.accordion__header');
                const body = item.querySelector('.accordion__body');

                if (!header || !body) return;

                // Ensure initial collapsed state
                body.style.maxHeight = '0px';
                body.style.overflow = 'hidden';
                body.style.transition = 'max-height 0.4s ease';

                header.addEventListener('click', () => {
                    handleHeaderClick(item);
                });
            });
        };

        return { init };
    })();


    // ═══════════════════════════════════════════════════════════════════════════
    // 8. SMOOTH SCROLL
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * Intercepts clicks on all anchor links whose href starts with '#'
     * and smooth-scrolls to the target section, accounting for the fixed
     * navbar height so content isn't hidden behind it.
     */
    const SmoothScroll = (() => {
        /**
         * Returns the current height of the fixed navbar, used as scroll offset.
         * Falls back to 80px if the navbar element is not found.
         * @returns {number} Navbar height in pixels.
         */
        const getNavbarHeight = () => {
            const navbar = document.getElementById('navbar');
            return navbar ? navbar.offsetHeight : 80;
        };

        /**
         * Scrolls smoothly to the element matching the given selector.
         * @param {string} targetSelector - A CSS selector (e.g., '#tarifs').
         */
        const scrollToTarget = (targetSelector) => {
            // Handle '#' (top of page)
            if (targetSelector === '#' || targetSelector === '') {
                window.scrollTo({ top: 0, behavior: 'smooth' });
                return;
            }

            const targetElement = document.querySelector(targetSelector);
            if (!targetElement) return;

            const navbarHeight = getNavbarHeight();
            const elementPosition = targetElement.getBoundingClientRect().top + window.scrollY;
            const offsetPosition = elementPosition - navbarHeight;

            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            });
        };

        /**
         * Initializes smooth scroll by binding click handlers to all anchor
         * links whose href attribute starts with '#'.
         */
        const init = () => {
            const anchorLinks = document.querySelectorAll('a[href^="#"]');

            anchorLinks.forEach((link) => {
                link.addEventListener('click', (e) => {
                    const href = link.getAttribute('href');

                    // Only handle internal anchors
                    if (href && href.startsWith('#')) {
                        e.preventDefault();
                        scrollToTarget(href);
                    }
                });
            });
        };

        return { init };
    })();


    // ═══════════════════════════════════════════════════════════════════════════
    // PAGE LOAD ANIMATION
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * Adds a subtle page-load animation by setting the body to opacity 0
     * initially, then fading it in after a brief delay. This creates a
     * polished "curtain reveal" effect on page load.
     */
    const PageLoadAnimation = (() => {
        /** Delay before the body starts fading in (ms) */
        const LOAD_DELAY = 100;

        /**
         * Initializes the page-load animation. Sets body opacity to 0, then
         * transitions to 1 after LOAD_DELAY.
         */
        const init = () => {
            // Only apply if body doesn't already have a visible state
            // (handles edge case of style being set elsewhere)
            document.body.style.opacity = '0';
            document.body.style.transition = 'opacity 0.6s ease';

            setTimeout(() => {
                document.body.style.opacity = '1';
            }, LOAD_DELAY);
        };

        return { init };
    })();


    // ═══════════════════════════════════════════════════════════════════════════
    // INITIALIZATION
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * Boot sequence: initializes all modules in the correct order.
     * Page load animation runs first so users see a smooth fade-in,
     * then all interactive modules are initialized.
     */
    const init = () => {
        // 0. Page load fade-in
        PageLoadAnimation.init();

        // 1. Particle engine (canvas background)
        ParticleEngine.init();

        // 2. Dynamic navbar (scroll state + mobile menu)
        DynamicNavbar.init();

        // 3. Animated counters (triggered by scroll)
        AnimatedCounters.init();

        // 4. Pricing tabs (cinematic transitions)
        PricingTabs.init();

        // 5. Gallery filter (category-based filtering)
        GalleryFilter.init();

        // 6. Scroll-driven reveal animations (staggered)
        ScrollReveal.init();

        // 7. FAQ accordion (single-open)
        FAQAccordion.init();

        // 8. Smooth scroll (anchor links)
        SmoothScroll.init();
    };

    // Execute initialization
    init();
});
