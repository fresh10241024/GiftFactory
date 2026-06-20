import Lenis from "lenis"
import { gsap } from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { preloadImages } from "./utils.js"

gsap.registerPlugin(ScrollTrigger)

class StickyGridScroll {
    constructor() {
        this.getElements()

        this.initContent()
        this.groupItemsByColumn()

        this.addParallaxOnScroll()
        this.animateTitleOnScroll()
        this.animateGridOnScroll()
    }

    /**
     * Select and store the DOM elements needed for the animation
     * @returns {void}
     */
    getElements() {
        this.block = document.querySelector(".block--main")

        if (this.block) {
            this.wrapper = this.block.querySelector(".block__wrapper")
            this.content = this.block.querySelector(".content")
            this.title = this.block.querySelector(".content__title")
            this.description = this.block.querySelector(".content__description")
            this.button = this.block.querySelector(".content__button")
            this.grid = this.block.querySelector(".gallery__grid")
            this.items = this.block.querySelectorAll(".gallery__item")
        }
    }

    /**
     * Initializes the visual state of the content before animations
     * @returns {void}
     */
    initContent() {
        if (this.description && this.button) {
            // Hide description and button
            gsap.set([this.description, this.button], { opacity: 0, pointerEvents: "none" })
        }

        if (this.content && this.title) {
            // Calculate how many pixels are needed to vertically center the title inside its container
            const dy = (this.content.offsetHeight - this.title.offsetHeight) / 2

            // Convert this pixel offset into a percentage of the container height
            this.titleOffsetY = (dy / this.content.offsetHeight) * 100

            // Apply the vertical positioning using percent-based transform
            gsap.set(this.title, { yPercent: this.titleOffsetY })
        }
    }

    /**
     * Group grid items into a fixed number of columns (default: 3)
     * @returns {void}
     */
    groupItemsByColumn() {
        this.numColumns = 3

        // Initialize an array for each column
        this.columns = Array.from({ length: this.numColumns }, () => [])

        // Distribute grid items into column buckets
        this.items.forEach((item, index) => {
            this.columns[index % this.numColumns].push(item)
        })
    }

    /**
     * Apply a parallax effect to the wrapper when scrolling
     * @returns {void}
     */
    addParallaxOnScroll() {
        if (!this.block || !this.wrapper) {
            return
        }

        // Create a scroll-driven timeline
        // Animate the wrapper vertically based on scroll position
        gsap.from(this.wrapper, {
            yPercent: -100,
            ease: "none",
            scrollTrigger: {
                trigger: this.block,
                start: "top bottom", // Start when top of block hits bottom of viewport
                end: "top top", // End when top of block hits top of viewport
                scrub: true, // Smooth animation based on scroll position
            },
        })
    }

    /**
     * Animate the title element when the block scrolls into view
     * @returns {void}
     */
    animateTitleOnScroll() {
        if (!this.block || !this.title) {
            return
        }

        // Create a scroll-driven timeline
        // Animate the title's opacity when the block reaches 57% of the viewport height
        gsap.from(this.title, {
            opacity: 0,
            duration: 0.7,
            ease: "power1.out",
            scrollTrigger: {
                trigger: this.block,
                start: "top 57%", // Start when top of block hits 57% of viewport
                toggleActions: "play none none reset", // Play on enter, reset on leave back
            },
        })
    }

    /**
     * Create a GSAP timeline to reveal the grid items with vertical animation
     * Each column moves from top or bottom, with staggered timing
     *
     * @param {Array} columns - Array of columns, each containing DOM elements of the grid
     * @returns {gsap.core.Timeline} - The timeline for the grid reveal animation
     */
    gridRevealTimeline(columns = this.columns) {
        // Create a timeline
        const timeline = gsap.timeline()

        const wh = window.innerHeight
        // Calculate the distance to start grid fully outside the viewport (above or below)
        const dy = wh - (wh - this.grid.offsetHeight) / 2

        columns.forEach((column, colIndex) => {
            // Determine the direction: columns with even index move from top, odd from bottom
            const fromTop = colIndex % 2 === 0

            // Animate all items in the column
            timeline.from(
                column,
                {
                    y: dy * (fromTop ? -1 : 1), // Start above or below the viewport based on column index
                    stagger: {
                        each: 0.06, // Stagger the animation within the column: 60ms between each item's animation
                        from: fromTop ? "end" : "start", // Animate from bottom if moving down, top if moving up
                    },
                    ease: "power1.inOut",
                },
                "grid-reveal", // Label to synchronize animations across columns
            )
        })

        return timeline
    }

    /**
     * Create a GSAP timeline to zoom the grid
     * Lateral columns move horizontally, central column items move vertically
     *
     * @param {Array} columns - Array of columns, each containing DOM elements of the grid
     * @returns {gsap.core.Timeline} - The timeline for the grid zoom animation
     */
    gridZoomTimeline(columns = this.columns) {
        // Create a timeline with default duration and easing for all tweens
        const timeline = gsap.timeline({ defaults: { duration: 1, ease: "power3.inOut" } })

        // Zoom the entire grid
        timeline.to(this.grid, { scale: 2.05 })

        // Move lateral columns horizontally
        timeline.to(columns[0], { xPercent: -40 }, "<") // Left column moves left
        timeline.to(columns[2], { xPercent: 40 }, "<") // Right column moves right

        // Animate central column vertically
        timeline.to(
            columns[1],
            {
                // Items above the midpoint move up, below move down
                yPercent: (index) => (index < Math.floor(columns[1].length / 2) ? -1 : 1) * 40,
                duration: 0.5,
                ease: "power1.inOut",
            },
            "-=0.5", // Start slightly before previous animation ends for overlap
        )

        return timeline
    }

    /**
     * Toggle the visibility of content elements (title, description, button) with animations
     *
     * @param {boolean} isVisible - Whether the content should be visible
     * @returns {void}
     */
    toggleContent(isVisible = true) {
        if (!this.title || !this.description || !this.button) {
            return
        }

        // Create a timeline
        gsap.timeline({ defaults: { overwrite: true } })
            // Animate the title's vertical position
            .to(this.title, {
                yPercent: isVisible ? 0 : this.titleOffsetY, // Slide up or return to initial offset
                duration: 0.7,
                ease: "power2.inOut",
            })
            // Animate description and button opacity and pointer events
            .to(
                [this.description, this.button],
                {
                    opacity: isVisible ? 1 : 0,
                    duration: 0.4,
                    ease: `power1.${isVisible ? "inOut" : "out"}`,
                    pointerEvents: isVisible ? "all" : "none",
                },
                isVisible ? "-=90%" : "<", // Overlap with previous tween when showing
            )
    }

    /**
     * Animate the grid based on scroll position
     * Combines grid reveal, grid zoom, and content toggle in a scroll-driven timeline
     *
     * @returns {void}
     */
    animateGridOnScroll() {
        // Create a scroll-driven timeline
        const timeline = gsap.timeline({
            scrollTrigger: {
                trigger: this.block,
                start: "top 25%", // Start when top of block hits 25% of viewport
                end: "bottom bottom", // End when bottom of block hits bottom of viewport
                scrub: true, // Smooth animation based on scroll position
            },
        })

        timeline
            // Add grid reveal animation
            .add(this.gridRevealTimeline())

            // Add grid zoom animation, overlapping previous animation by 0.6 seconds
            .add(this.gridZoomTimeline(), "-=0.6")

            // Toggle content visibility based on scroll direction
            // Overlap with previous animation by 0.32 seconds
            .add(() => this.toggleContent(timeline.scrollTrigger.direction === 1), "-=0.32")
    }
}

// Initialize smooth scrolling using Lenis and synchronize it with GSAP ScrollTrigger
function initSmoothScrolling() {
    // Create a new Lenis instance for smooth scrolling
    const lenis = new Lenis({
        lerp: 0.08,
        wheelMultiplier: 1.4,
    })

    // Synchronize Lenis scrolling with GSAP's ScrollTrigger plugin
    lenis.on("scroll", ScrollTrigger.update)

    // Add Lenis's requestAnimationFrame (raf) method to GSAP's ticker
    // This ensures Lenis's smooth scroll animation updates on each GSAP tick
    gsap.ticker.add((time) => {
        lenis.raf(time * 1000) // Convert time from seconds to milliseconds
    })

    // Disable lag smoothing in GSAP to prevent any delay in scroll animations
    gsap.ticker.lagSmoothing(0)
}

// Modal
const authModal = document.getElementById('auth-modal');

function openModal(modal) {
    modal.classList.add('is-active');
    modal.setAttribute('aria-hidden', 'false');
    modal.querySelector('input')?.focus();
}
function closeModal(modal) {
    modal.classList.remove('is-active');
    modal.setAttribute('aria-hidden', 'true');
}
function showStep(step) {
    ['auth-step-email', 'auth-step-code', 'auth-step-setpw'].forEach(id => {
        document.getElementById(id).style.display = id === step ? '' : 'none';
    });
}
function formError(form, msg) {
    form.querySelector('.form-error').textContent = msg;
}
function setBtnLoading(btn, loading, label) {
    btn.disabled = loading;
    btn.textContent = loading ? '请稍候...' : label;
}

document.getElementById('open-auth-modal')?.addEventListener('click', () => {
    showStep('auth-step-email');
    openModal(authModal);
});
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) closeModal(e.target);
    if (e.target.classList.contains('close-button')) closeModal(e.target.closest('.modal'));
});
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') document.querySelectorAll('.modal.is-active').forEach(closeModal);
});

let _otpEmail = '';

// Step 1a: send OTP
document.getElementById('auth-email-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.target;
    const email = document.getElementById('auth-email').value.trim();
    const btn = form.querySelector('button[type="submit"]');
    formError(form, '');
    setBtnLoading(btn, true, '发送验证码');
    try {
        const res = await fetch('/api/auth/send-otp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || '发送失败');
        _otpEmail = email;
        document.getElementById('auth-email-display').textContent = email;
        showStep('auth-step-code');
    } catch (err) {
        formError(form, err.message);
    } finally {
        setBtnLoading(btn, false, '发送验证码');
    }
});

// Step 1b: password login
document.getElementById('auth-password-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.target;
    const email = document.getElementById('auth-pw-email').value.trim();
    const password = document.getElementById('auth-pw-password').value;
    const btn = form.querySelector('button[type="submit"]');
    formError(form, '');
    setBtnLoading(btn, true, '密码登录');
    try {
        const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || '登录失败');
        const payload = parseJwt(data.token);
        localStorage.setItem('token', data.token);
        localStorage.setItem('refresh_token', data.refresh_token || '');
        localStorage.setItem('userId', data.userId);
        localStorage.setItem('token_exp', payload.exp || '');
        closeModal(authModal);
    } catch (err) {
        formError(form, err.message);
    } finally {
        setBtnLoading(btn, false, '密码登录');
    }
});

document.getElementById('auth-back-btn')?.addEventListener('click', () => showStep('auth-step-email'));

// Handle magic link redirect: Supabase appends #access_token=... to the URL
function parseJwt(token) {
    try {
        const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
        return JSON.parse(atob(base64));
    } catch { return {}; }
}

const hashParams = new URLSearchParams(window.location.hash.substring(1));
const magicToken = hashParams.get('access_token');
if (magicToken) {
    const payload = parseJwt(magicToken);
    localStorage.setItem('token', magicToken);
    localStorage.setItem('refresh_token', hashParams.get('refresh_token') || '');
    localStorage.setItem('userId', payload.sub || '');
    localStorage.setItem('token_exp', payload.exp || '');
    window.history.replaceState({}, document.title, window.location.pathname);
    showStep('auth-step-setpw');
    openModal(authModal);
}

// Auto-refresh token if expired
async function ensureValidToken() {
    const exp = parseInt(localStorage.getItem('token_exp') || '0');
    if (!exp || Date.now() / 1000 < exp - 60) return; // still valid
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) return;
    try {
        const res = await fetch('/api/auth/refresh', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refresh_token: refreshToken }),
        });
        if (res.ok) {
            const data = await res.json();
            const payload = parseJwt(data.token);
            localStorage.setItem('token', data.token);
            localStorage.setItem('refresh_token', data.refresh_token);
            localStorage.setItem('userId', data.userId);
            localStorage.setItem('token_exp', payload.exp || '');
        } else {
            // Refresh failed, clear session
            ['token', 'refresh_token', 'userId', 'token_exp'].forEach(k => localStorage.removeItem(k));
        }
    } catch {}
}

ensureValidToken();

// Step 3: set password (optional)
document.getElementById('auth-setpw-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.target;
    const password = document.getElementById('auth-new-password').value;
    const btn = form.querySelector('button[type="submit"]');
    formError(form, '');
    setBtnLoading(btn, true, '保存密码');
    try {
        const token = localStorage.getItem('token');
        const res = await fetch('/api/auth/set-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ password }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || '设置失败');
        closeModal(authModal);
    } catch (err) {
        formError(form, err.message);
    } finally {
        setBtnLoading(btn, false, '保存密码');
    }
});

document.getElementById('auth-skip-btn')?.addEventListener('click', () => closeModal(authModal));

// Preload images then initialize everything
preloadImages().then(() => {
    document.body.classList.remove("loading") // Remove loading state from body
    initSmoothScrolling() // Initialize smooth scrolling
    new StickyGridScroll() // Initialize grid animation
})
