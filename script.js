// ----- NETWORK CANVAS — ambient background ----- //
(function initNetworkCanvas() {
    const canvas = document.getElementById('networkCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let W, H, nodes, animId;
    const NODE_COUNT = 38;
    const MAX_DIST   = 160;
    const SPEED      = 0.22;

    // ── enhancement config ──
    const PULSE_INTERVAL_MIN = 4000;
    const PULSE_INTERVAL_MAX = 9000;
    const PING_INTERVAL_MIN  = 6000;
    const PING_INTERVAL_MAX  = 14000;
    const MAX_ACTIVE_PULSES  = 2;
    const MAX_ACTIVE_PINGS   = 1;

    // ── activity config (replaces CLOUD) ──
    const ACTIVITY = { bias: 1.4 };

    function resize() {
        const dpr = window.devicePixelRatio || 1;
        W = canvas.width  = window.innerWidth  * dpr;
        H = canvas.height = window.innerHeight * dpr;
        canvas.style.width  = window.innerWidth  + 'px';
        canvas.style.height = window.innerHeight + 'px';
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.scale(dpr, dpr);
    }

    function makeNode() {
        return {
            x:  Math.random() * window.innerWidth,
            y:  Math.random() * window.innerHeight,
            vx: (Math.random() - 0.5) * SPEED,
            vy: (Math.random() - 0.5) * SPEED,
            r:  Math.random() * 1.4 + 0.6
        };
    }

    function buildNodes() {
        const count = window.innerWidth < 480 ? 22
                    : window.innerWidth < 768 ? 28
                    : NODE_COUNT;
        nodes = Array.from({ length: count }, makeNode);
    }

    // ── enhancement state ──
    let pulses = [];
    let pings  = [];
    let nextPulseAt = Date.now() + PULSE_INTERVAL_MIN + Math.random() * (PULSE_INTERVAL_MAX - PULSE_INTERVAL_MIN);
    let nextPingAt  = Date.now() + PING_INTERVAL_MIN  + Math.random() * (PING_INTERVAL_MAX  - PING_INTERVAL_MIN);

    // ── infrastructure activity state ──
    let healthChecks = [];
    let statusBlinks = [];
    let nextHealthAt = Date.now() + 8000  + Math.random() * 7000;
    let nextBlinkAt  = Date.now() + 3000  + Math.random() * 4000;

    function getColors() {
        const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
        return {
            node: isDark ? 'rgba(59,130,246,0.28)' : 'rgba(37,99,235,0.18)',
            line: isDark
                ? (a) => `rgba(59,130,246,${(a * 0.07).toFixed(3)})`
                : (a) => `rgba(37,99,235,${(a * 0.06).toFixed(3)})`
        };
    }

    // ── center-bias helper (replaces cloudWeight) ──
    function centerBias(x, y) {
        const dx = (x - window.innerWidth  * 0.5) / (window.innerWidth  * 0.5);
        const dy = (y - window.innerHeight * 0.5) / (window.innerHeight * 0.5);
        return Math.max(0, 1 - Math.sqrt(dx * dx + dy * dy));
    }

    function spawnPulse() {
        if (pulses.length >= MAX_ACTIVE_PULSES) return;
        let idx = 0;
        let bestScore = -1;
        const candidates = 6;
        for (let i = 0; i < candidates; i++) {
            const k     = Math.floor(Math.random() * nodes.length);
            const w     = centerBias(nodes[k].x, nodes[k].y);
            const score = Math.random() + w * (ACTIVITY.bias - 1);
            if (score > bestScore) {
                bestScore = score;
                idx = k;
            }
        }
        pulses.push({
            idx,
            r:     0,
            maxR:  18 + Math.random() * 10,
            life:  0,
            speed: 0.006 + Math.random() * 0.004,
        });
    }

    function spawnPing() {
        if (pings.length >= MAX_ACTIVE_PINGS) return;
        let ai = 0;
        let bestScore = -1;
        for (let i = 0; i < 6; i++) {
            const k     = Math.floor(Math.random() * nodes.length);
            const w     = centerBias(nodes[k].x, nodes[k].y);
            const score = Math.random() + w * (ACTIVITY.bias - 1);
            if (score > bestScore) {
                bestScore = score;
                ai = k;
            }
        }
        const maxDist = window.innerWidth < 480 ? 100
                      : window.innerWidth < 768 ? 130
                      : MAX_DIST;
        let bi = -1;
        let bestDist = Infinity;
        for (let k = 0; k < nodes.length; k++) {
            if (k === ai) continue;
            const dx = nodes[ai].x - nodes[k].x;
            const dy = nodes[ai].y - nodes[k].y;
            const d  = Math.sqrt(dx * dx + dy * dy);
            if (d < maxDist && d < bestDist) {
                bestDist = d;
                bi = k;
            }
        }
        if (bi === -1) return;
        pings.push({
            ai, bi,
            t:     0,
            speed: 0.008 + Math.random() * 0.005,
            life:  1,
        });
    }

    // ── health check sweep (faint line brightens between two nodes) ──
    function spawnHealthCheck() {
        if (healthChecks.length >= 2) return;
        const ai = Math.floor(Math.random() * nodes.length);
        let bi = -1, bestDist = Infinity;
        const maxD = window.innerWidth < 768 ? 120 : MAX_DIST;
        for (let k = 0; k < nodes.length; k++) {
            if (k === ai) continue;
            const dx = nodes[ai].x - nodes[k].x;
            const dy = nodes[ai].y - nodes[k].y;
            const d  = Math.sqrt(dx * dx + dy * dy);
            if (d < maxD && d < bestDist) { bestDist = d; bi = k; }
        }
        if (bi === -1) return;
        healthChecks.push({ ai, bi, life: 1.0 });
    }

    // ── status blink (node dims briefly, like a background process) ──
    function spawnStatusBlink() {
        if (statusBlinks.length >= 3) return;
        const idx = Math.floor(Math.random() * nodes.length);
        statusBlinks.push({ idx, life: 1.0, speed: 0.028 + Math.random() * 0.018 });
    }

    function draw(ts) {
        ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

        const { node, line } = getColors();

        const maxDist = window.innerWidth < 480 ? 100
                      : window.innerWidth < 768 ? 130
                      : MAX_DIST;

        // ── draw nodes and connections ──
        for (let i = 0; i < nodes.length; i++) {
            const n = nodes[i];
            n.x += n.vx;
            n.y += n.vy;
            if (n.x < 0 || n.x > window.innerWidth)  n.vx *= -1;
            if (n.y < 0 || n.y > window.innerHeight)  n.vy *= -1;

            ctx.beginPath();
            ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
            ctx.fillStyle = node;
            ctx.fill();

            for (let j = i + 1; j < nodes.length; j++) {
                const m = nodes[j];
                const dx = n.x - m.x;
                const dy = n.y - m.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < maxDist) {
                    const alpha = 1 - dist / maxDist;
                    ctx.beginPath();
                    ctx.moveTo(n.x, n.y);
                    ctx.lineTo(m.x, m.y);
                    ctx.strokeStyle = line(alpha);
                    ctx.lineWidth = 0.8;
                    ctx.stroke();
                }
            }
        }

        // ── spawn timers ──
        const now = Date.now();
        if (now >= nextPulseAt) {
            spawnPulse();
            nextPulseAt = now + PULSE_INTERVAL_MIN + Math.random() * (PULSE_INTERVAL_MAX - PULSE_INTERVAL_MIN);
        }
        if (now >= nextPingAt) {
            spawnPing();
            nextPingAt = now + PING_INTERVAL_MIN + Math.random() * (PING_INTERVAL_MAX - PING_INTERVAL_MIN);
        }
        if (now >= nextHealthAt) {
            spawnHealthCheck();
            nextHealthAt = now + 9000 + Math.random() * 8000;
        }
        if (now >= nextBlinkAt) {
            spawnStatusBlink();
            nextBlinkAt = now + 2500 + Math.random() * 3500;
        }

        const isDark  = document.documentElement.getAttribute('data-theme') !== 'light';
        const accentR = isDark ? '59,130,246' : '37,99,235';

        // ── draw node pulses (expanding ring glow) ──
        pulses = pulses.filter(p => p.life < 1);
        pulses.forEach(p => {
            p.life += p.speed;
            p.r = p.maxR * p.life;
            const n        = nodes[p.idx];
            const alpha    = (1 - p.life) * 0.18;
            const dotAlpha = (1 - p.life) * 0.35;

            ctx.beginPath();
            ctx.arc(n.x, n.y, p.r, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(${accentR},${alpha.toFixed(3)})`;
            ctx.lineWidth   = 1;
            ctx.stroke();

            ctx.beginPath();
            ctx.arc(n.x, n.y, 3 * (1 - p.life * 0.5), 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${accentR},${dotAlpha.toFixed(3)})`;
            ctx.fill();
        });

        // ── draw connection pings (dot travelling along edge) ──
        pings = pings.filter(p => p.life > 0);
        pings.forEach(p => {
            const a = nodes[p.ai];
            const b = nodes[p.bi];

            if (p.t < 1) {
                p.t += p.speed;
                if (p.t > 1) p.t = 1;
            } else {
                p.life -= 0.04;
            }

            const x      = a.x + (b.x - a.x) * p.t;
            const y      = a.y + (b.y - a.y) * p.t;
            const trailX = a.x + (b.x - a.x) * Math.max(0, p.t - 0.12);
            const trailY = a.y + (b.y - a.y) * Math.max(0, p.t - 0.12);

            const grad = ctx.createLinearGradient(trailX, trailY, x, y);
            grad.addColorStop(0, `rgba(${accentR},0)`);
            grad.addColorStop(1, `rgba(${accentR},${(p.life * 0.3).toFixed(3)})`);
            ctx.beginPath();
            ctx.moveTo(trailX, trailY);
            ctx.lineTo(x, y);
            ctx.strokeStyle = grad;
            ctx.lineWidth   = 1.2;
            ctx.stroke();

            ctx.beginPath();
            ctx.arc(x, y, 2, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${accentR},${(p.life * 0.5).toFixed(3)})`;
            ctx.fill();
        });

        // ── draw health check sweeps ──
        healthChecks = healthChecks.filter(h => h.life > 0);
        healthChecks.forEach(h => {
            h.life -= 0.008;
            const a     = nodes[h.ai];
            const b     = nodes[h.bi];
            const alpha = h.life * 0.13;

            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = `rgba(${accentR},${alpha.toFixed(3)})`;
            ctx.lineWidth   = 0.9;
            ctx.stroke();

            [a, b].forEach(n => {
                ctx.beginPath();
                ctx.arc(n.x, n.y, 2.2, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(${accentR},${(h.life * 0.22).toFixed(3)})`;
                ctx.fill();
            });
        });

        // ── draw status blinks ──
        statusBlinks = statusBlinks.filter(b => b.life > 0);
        statusBlinks.forEach(b => {
            b.life -= b.speed;
            const n     = nodes[b.idx];
            const curve = b.life < 0.5 ? b.life * 2 : (1 - b.life) * 2;
            const alpha = curve * 0.20;

            ctx.beginPath();
            ctx.arc(n.x, n.y, n.r * 2.8, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${accentR},${alpha.toFixed(3)})`;
            ctx.fill();
        });

        animId = requestAnimationFrame(draw);
    }

    resize();
    buildNodes();
    draw();

    window.addEventListener('resize', () => {
        cancelAnimationFrame(animId);
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        resize();
        buildNodes();
        draw();
    });
})();


// ----- DOM REFERENCES ----- //
const themeToggle     = document.getElementById('themeToggle');
const sunIcon         = document.getElementById('sunIcon');
const moonIcon        = document.getElementById('moonIcon');
const headerSection   = document.querySelector('.header');
const projectsSection = document.querySelector('#projects');
const contactForm     = document.getElementById('contactForm');
const filterBtns      = document.querySelectorAll('.filter-btn');
const projectCards    = document.querySelectorAll('.project-card');


// ----- THEME TOGGLE ----- //
document.documentElement.setAttribute('data-theme', 'dark');

function updateThemeIcons(theme) {
    if (theme === 'light') {
        sunIcon.style.display  = 'none';
        moonIcon.style.display = 'block';
    } else {
        sunIcon.style.display  = 'block';
        moonIcon.style.display = 'none';
    }
}

updateThemeIcons('dark');

themeToggle.addEventListener('click', () => {
    const current  = document.documentElement.getAttribute('data-theme');
    const newTheme = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    updateThemeIcons(newTheme);
});


// ----- STATUS TOOLTIP — dot hover + mobile tap ----- //
(function initStatusTooltip() {
    const roleBadge = document.getElementById('roleBadge');
    const dot       = document.querySelector('.role-badge__dot');
    if (!roleBadge || !dot) return;

    const startTime = Date.now();

    function formatUptime(ms) {
        const s  = Math.floor(ms / 1000);
        const h  = Math.floor(s / 3600);
        const m  = Math.floor((s % 3600) / 60);
        const sc = s % 60;
        return [h, m, sc].map(n => String(n).padStart(2, '0')).join(':');
    }

    let baseLatency = 18;

    function getLatency() {
        baseLatency += (Math.random() - 0.5) * 4;
        baseLatency = Math.max(8, Math.min(42, baseLatency));
        return Math.round(baseLatency) + ' ms';
    }

    function tick() {
        const elapsed    = Date.now() - startTime;
        const uptimeStr  = formatUptime(elapsed);
        const latencyStr = getLatency();

        document.querySelectorAll('.uptime-counter').forEach(el => {
            el.textContent = uptimeStr;
        });
        document.querySelectorAll('.latency-counter').forEach(el => {
            el.textContent = latencyStr;
        });
    }

    setInterval(tick, 1000);
    tick();

    dot.addEventListener('click', (e) => {
        e.stopPropagation();
        roleBadge.classList.toggle('tooltip-active');
    });

    document.addEventListener('click', (e) => {
        if (!roleBadge.contains(e.target)) {
            roleBadge.classList.remove('tooltip-active');
        }
    });
})();


// ----- NAVBAR SCROLL SHADOW----- //
window.addEventListener('scroll', function () {
    const navbar = document.querySelector('.navbar');
    navbar.classList.toggle('scrolled', window.scrollY > 0);
});


// ----- SMOOTH SCROLL + PARALLAX ----- //
let isNavigatingHome = false;

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const targetId = this.getAttribute('href');

        if (targetId === '#header') {
            isNavigatingHome = true;
            const header = document.querySelector('.header');
            if (header) header.style.transform = 'translateY(0px)';
            window.scrollTo({ top: 0, behavior: 'smooth' });
            setTimeout(() => { isNavigatingHome = false; }, 1000);
        } else {
            const target = document.querySelector(targetId);
            if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    });
});


// ----- SECTION FADE-IN OBSERVER ----- //
const fadeObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) entry.target.classList.add('visible');
    });
}, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

document.querySelectorAll('section').forEach(s => fadeObserver.observe(s));


// ----- EXPERIENCE TIMELINE — indicator + signal + scrollspy ----- //
(function initExperienceTimeline() {
    const timeline     = document.getElementById('expTimeline');
    const indicator    = document.getElementById('expIndicator');
    const signal       = document.getElementById('expSignal');
    const arrivalPulse = document.getElementById('expArrivalPulse');
    if (!timeline || !indicator) return;

    const entries = Array.from(timeline.querySelectorAll('.exp-entry'));
    if (!entries.length) return;

    let activeIndex = 0;
    let isClickLocked = false;
    let clickLockTimer = null;

    let signalBusy = false;
    let pendingSignal = null;
    let scrollSpyTimer = null;
    const SCROLL_SPY_DEBOUNCE = 100;

    function getDotCenter(entry) {
        const dot = entry.querySelector('.exp-node__dot');
        const timelineRect = timeline.getBoundingClientRect();
        const dotRect = dot.getBoundingClientRect();
        return {
            top:  dotRect.top  - timelineRect.top  + dotRect.height / 2,
            left: dotRect.left - timelineRect.left + dotRect.width  / 2
        };
    }

    function alignNodeToBadge(entry) {
        const node  = entry.querySelector('.exp-node');
        const badge = entry.querySelector('.exp-status');
        if (!node || !badge) return;

        const entryRect = entry.getBoundingClientRect();
        const badgeRect = badge.getBoundingClientRect();

        // Vertical center of the badge, relative to the entry's top
        const badgeCenter = (badgeRect.top - entryRect.top) + (badgeRect.height / 2);

        // Offset the node so ITS center lands on that same point
        const nodeTop = badgeCenter - (node.offsetHeight / 2);

        node.style.top = `${nodeTop}px`;
    }

    function alignAllNodes() {
        entries.forEach(alignNodeToBadge);
    }

    function positionIndicator(entry, animate = true) {
        const center = getDotCenter(entry);
        const top  = center.top  - indicator.offsetHeight / 2;
        const left = center.left - indicator.offsetWidth  / 2;

        if (!animate) indicator.style.transition = 'none';
        indicator.style.top  = `${top}px`;
        indicator.style.left = `${left}px`;
        indicator.classList.add('is-ready');
        if (!animate) {
            void indicator.offsetHeight;
            indicator.style.transition = '';
        }
    }

    // Restarts a CSS animation on an element by toggling its class off/on
    // via a forced reflow — needed because just re-adding the same class
    // name doesn't retrigger the animation.
    function replay(el, className) {
        el.classList.remove(className);
        void el.offsetWidth;
        el.classList.add(className);
    }

    function playSignal(fromEntry, toEntry) {
        if (!signal) return;
        const fromCenter = getDotCenter(fromEntry);
        const toCenter   = getDotCenter(toEntry);
        const top    = Math.min(fromCenter.top, toCenter.top);
        const height = Math.abs(toCenter.top - fromCenter.top);

        signal.style.top    = `${top}px`;
        signal.style.height = `${height}px`;

        const goingDown = toCenter.top > fromCenter.top;
        signalBusy = true;
        signal.classList.remove('is-traveling-down', 'is-traveling-up');
        void signal.offsetWidth;
        signal.classList.add(goingDown ? 'is-traveling-down' : 'is-traveling-up');
    }

    if (signal) {
        signal.addEventListener('animationend', () => {
            signal.classList.remove('is-traveling-down', 'is-traveling-up');
            signalBusy = false;
            if (pendingSignal) {
                const { from, to } = pendingSignal;
                pendingSignal = null;
                playSignal(from, to);
            } else {
                playArrivalPulse(entries[activeIndex]);
            }
        });
    }

    function playArrivalPulse(entry) {
        if (!arrivalPulse) return;
        const center = getDotCenter(entry);
        arrivalPulse.style.top  = `${center.top}px`;
        arrivalPulse.style.left = `${center.left}px`;
        replay(arrivalPulse, 'is-bursting');
    }

    function setActive(index, { animate = true, scrollLock = false } = {}) {
        const changed = index !== activeIndex;
        const previousEntry = entries[activeIndex];

        if (!changed && entries[index].classList.contains('is-active')) {
            positionIndicator(entries[index], animate);
            return;
        }

        activeIndex = index;
        entries.forEach((entry, i) => {
            entry.classList.toggle('is-active', i === index);
            entry.setAttribute('aria-current', i === index ? 'true' : 'false');
        });

        positionIndicator(entries[index], animate);

        // signal + arrival pulse only make sense when actually traveling
        // between two nodes (not on the very first paint)
        if (animate && changed && previousEntry) {
            if (signalBusy) {
                pendingSignal = { from: previousEntry, to: entries[index] };
            } else {
                playSignal(previousEntry, entries[index]);
            }
        }

        if (scrollLock) {
            isClickLocked = true;
            clearTimeout(clickLockTimer);
            clickLockTimer = setTimeout(() => { isClickLocked = false; }, 700);
        }
    }

    entries.forEach((entry, i) => {
        entry.addEventListener('click', () => {
            clearTimeout(scrollSpyTimer);
            setActive(i, { scrollLock: true });
        });
        entry.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                clearTimeout(scrollSpyTimer);
                setActive(i, { scrollLock: true });
            }
        });
    });

    const observer = new IntersectionObserver((visibleEntries) => {
        if (isClickLocked) return;
        let best = null;
        visibleEntries.forEach((e) => {
            if (e.isIntersecting && (!best || e.intersectionRatio > best.intersectionRatio)) {
                best = e;
            }
        });
        if (best) {
            const index = entries.indexOf(best.target);
            if (index === -1) return;

            clearTimeout(scrollSpyTimer);
            scrollSpyTimer = setTimeout(() => {
                setActive(index);
            }, SCROLL_SPY_DEBOUNCE);
        }
    }, {
        threshold: [0.25, 0.5, 0.75],
        rootMargin: '-40% 0px -40% 0px'
    });

    entries.forEach((entry) => observer.observe(entry));

    setActive(0, { animate: false });
    alignAllNodes();

    let resizeRaf = null;
    window.addEventListener('resize', () => {
        cancelAnimationFrame(resizeRaf);
        resizeRaf = requestAnimationFrame(() => {
            positionIndicator(entries[activeIndex], false);
        });
    });

    window.addEventListener('load', () => {
        positionIndicator(entries[activeIndex], false);
        alignAllNodes();
    });
})();


// ----- PROJECT FILTERING ----- //
filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const filter = btn.getAttribute('data-filter');
        const grid = document.getElementById('projectsGrid');

        grid.classList.add('filtering');

        setTimeout(() => {
            projectCards.forEach(card => {
                const category = card.getAttribute('data-category');
                const isVisible = filter === 'all' || category === filter;
                if (isVisible) {
                    card.classList.remove('hidden');
                } else {
                    card.classList.add('hidden');
                }
            });

            grid.classList.remove('filtering');
        }, 400);
    });
});

// ── Default filter on page load ──
projectCards.forEach(card => {
    if (card.getAttribute('data-category') !== 'personal') {
        card.classList.add('hidden');
    }
});


// ----- PROJECT CARD ANIMATION DELAYS ----- //
document.querySelectorAll('.project-card').forEach((card, index) => {
    card.style.animationDelay = `${index * 0.1}s`;
});


// ----- CONTACT FORM VALIDATION & SUBMISSION ----- //
contactForm.addEventListener('submit', (e) => {
    e.preventDefault();
    clearErrors();

    const formData = new FormData(contactForm);
    const name    = formData.get('name').trim();
    const email   = formData.get('email').trim();
    const message = formData.get('message').trim();

    let isValid = true;

    if (name === '') {
        showError('name-error', 'Name is required'); isValid = false;
    } else if (name.length < 2) {
        showError('name-error', 'Name must be at least 2 characters'); isValid = false;
    }

    if (email === '') {
        showError('email-error', 'Email is required'); isValid = false;
    } else if (!isValidEmail(email)) {
        showError('email-error', 'Please enter a valid email address'); isValid = false;
    }

    if (message === '') {
        showError('message-error', 'Message is required'); isValid = false;
    } else if (message.length < 5) {
        showError('message-error', 'Message must be at least 5 characters'); isValid = false;
    }

    if (isValid) submitForm(name, email, message);
});

function showError(elementId, message) {
    const el = document.getElementById(elementId);
    el.textContent = message;
    el.style.display = 'block';
    el.previousElementSibling.style.borderColor = '#e74c3c';
}

function clearErrors() {
    document.querySelectorAll('.form-error').forEach(e => {
        e.textContent = '';
        e.style.display = 'none';
    });
    document.querySelectorAll('.form-group input, .form-group textarea').forEach(i => {
        i.style.borderColor = '#e0e0e0';
    });
}

function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function submitForm(name, email, message) {
    const btn = contactForm.querySelector('button[type="submit"]');
    const orig = btn.textContent;
    btn.textContent = 'Sending...';
    btn.disabled = true;
    btn.classList.add('loading');

    fetch('https://formspree.io/f/meolkoel', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'application/json'
        },
        body: new URLSearchParams({ name, email, message })
    }).then(response => {
        if (response.ok) {
            showSuccessModal();
            contactForm.reset();
        } else {
            return response.json().then(data => {
                const msg = data.errors
                    ? data.errors.map(e => e.message).join(', ')
                    : 'Oops! Something went wrong.';
                alert(msg);
            });
        }
    }).catch(err => {
        console.error('Form submission error:', err);
        alert('Network error. Please try again.');
    }).finally(() => {
        btn.textContent = orig;
        btn.disabled = false;
        btn.classList.remove('loading');
    });
}


// ----- SUCCESS MODAL ----- //
function closeSuccessModal() {
    const modal = document.getElementById('successModal');
    if (!modal) return;
    modal.classList.remove('show');
    setTimeout(() => {
        modal.remove();
        const styles = document.getElementById('modalStyles');
        if (styles) styles.remove();
    }, 300);
}

// expose globally before showSuccessModal so onclick can find it
window.closeSuccessModal = closeSuccessModal;

function showSuccessModal() {
    const modalHTML = `
        <div class="success-modal" id="successModal">
            <div class="modal-content">
                <div class="success-icon">✅</div>
                <h2 class="modal-title">Request Received.</h2>
                <p class="modal-message">
                    Status: <span style="color:#22c55e; font-weight:600;">202 Accepted</span><br>
                    Message queued — I'll follow up with you shortly.
                </p>
                <button class="modal-close-btn" onclick="window.closeSuccessModal()">Got it.</button>
            </div>
        </div>`;

    const modalStyles = `
        <style id="modalStyles">
            .success-modal {
                position: fixed; inset: 0;
                background: rgba(0,0,0,0.75);
                backdrop-filter: blur(8px);
                display: flex; justify-content: center; align-items: center;
                z-index: 9999;
                opacity: 0; visibility: hidden;
                transition: all 0.3s ease;
            }
            .success-modal.show { opacity: 1; visibility: visible; }

            .modal-content {
                background: var(--card-bg);
                color: var(--text-color);
                border: 1px solid var(--accent-color);
                box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
                padding: 40px;
                border-radius: 8px;
                text-align: center;
                max-width: 400px;
                width: 90%;
                margin: 20px;
                max-height: 90vh;
                overflow-y: auto;
                transform: scale(0.95) translateY(20px);
                transition: all 0.3s cubic-bezier(0.34,1.56,0.64,1);
                box-shadow: 0 8px 32px rgba(59,130,246,0.10),
                            0 4px 16px rgba(0,0,0,0.2);
            }
            .success-modal.show .modal-content {
                transform: scale(1) translateY(0);
            }

            .success-icon {
                width: 56px; height: 56px;
                background: var(--chip-bg);
                border: 1px solid var(--chip-border);
                border-radius: 8px;
                display: flex; align-items: center; justify-content: center;
                margin: 0 auto 20px;
                font-size: 28px;
                animation: bounceIn 0.5s ease 0.2s both;
            }

            @keyframes bounceIn {
                0%   { transform: scale(0.8); opacity: 0; }
                60%  { transform: scale(1.05); }
                100% { transform: scale(1); opacity: 1; }
            }

            .modal-title {
                font-size: 1.3rem;
                font-weight: 700;
                margin-bottom: 10px;
                color: var(--text-color);
                animation: slideInUp 0.4s ease 0.3s both;
            }

            .modal-message {
                font-size: 0.92rem;
                line-height: 1.6;
                margin-bottom: 28px;
                color: var(--text-muted);
                animation: slideInUp 0.4s ease 0.4s both;
            }

            @keyframes slideInUp {
                0%   { transform: translateY(16px); opacity: 0; }
                100% { transform: translateY(0); opacity: 1; }
            }

            .modal-close-btn {
                background: var(--accent-color);
                color: white;
                border: none;
                padding: 10px 28px;
                border-radius: 8px;
                cursor: pointer;
                font-size: 0.9rem;
                font-weight: 600;
                letter-spacing: 0.02em;
                transition: background 0.25s ease, box-shadow 0.25s ease;
                animation: slideInUp 0.4s ease 0.5s both;
                min-height: 40px;
                min-width: 110px;
            }

            .modal-close-btn:hover {
                background: #2563eb;
                box-shadow: 0 4px 16px rgba(59,130,246,0.3);
            }

            .submit-btn.loading {
                position: relative;
                overflow: hidden;
            }

            .submit-btn.loading::after {
                content: '';
                position: absolute; top: 0; left: -100%;
                width: 100%; height: 100%;
                background: linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent);
                animation: shimmer 1.5s infinite;
            }

            @keyframes shimmer {
                0%   { left: -100%; }
                100% { left: 100%; }
            }

            @media (max-width: 768px) {
                .modal-content {
                    padding: 32px 24px;
                    max-width: 360px;
                }
            }

            @media (max-width: 480px) {
                .modal-content {
                    padding: 28px 20px;
                    border-radius: 8px;
                    width: calc(100vw - 32px);
                    margin: 16px;
                }
                .success-icon {
                    width: 48px; height: 48px;
                    font-size: 24px;
                    margin-bottom: 16px;
                }
                .modal-title { font-size: 1.1rem; }
                .modal-message {
                    font-size: 0.88rem;
                    margin-bottom: 22px;
                }
                .modal-close-btn {
                    min-height: 44px;
                    width: 100%;
                    padding: 12px 20px;
                }
            }

            @media (max-width: 360px) {
                .modal-content {
                    padding: 34px 26px;
                    width: calc(100vw - 38px);
                    margin: 12px;
                }
                .modal-title { font-size: 1rem; }
                .modal-message { font-size: 0.85rem; }
            }
        </style>`;

    if (!document.getElementById('modalStyles')) {
        document.head.insertAdjacentHTML('beforeend', modalStyles);
    }
    if (!document.getElementById('successModal')) {
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }

    const modal = document.getElementById('successModal');
    modal.classList.add('show');

    // auto close after 6 seconds
    setTimeout(() => closeSuccessModal(), 6000);
}
