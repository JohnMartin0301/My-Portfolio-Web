// ─────────────────────────────────────────
// NETWORK CANVAS — ambient background
// ─────────────────────────────────────────
(function initNetworkCanvas() {
    const canvas = document.getElementById('networkCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let W, H, nodes, animId;
    const NODE_COUNT = 38;
    const MAX_DIST   = 160;
    const SPEED      = 0.22;

    function resize() {
        W = canvas.width  = window.innerWidth;
        H = canvas.height = window.innerHeight;
    }

    function makeNode() {
        return {
            x: Math.random() * W,
            y: Math.random() * H,
            vx: (Math.random() - 0.5) * SPEED,
            vy: (Math.random() - 0.5) * SPEED,
            r: Math.random() * 1.4 + 0.6
        };
    }

    function buildNodes() {
        nodes = Array.from({ length: NODE_COUNT }, makeNode);
    }

    function getColors() {
        const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
        return {
            node: isDark ? 'rgba(59,130,246,0.28)' : 'rgba(37,99,235,0.18)',
            line: isDark
                ? (a) => `rgba(59,130,246,${(a * 0.07).toFixed(3)})`
                : (a) => `rgba(37,99,235,${(a * 0.06).toFixed(3)})`
        };
    }

    function draw() {
        ctx.clearRect(0, 0, W, H);
        const { node, line } = getColors();

        for (let i = 0; i < nodes.length; i++) {
            const n = nodes[i];
            n.x += n.vx;
            n.y += n.vy;
            if (n.x < 0 || n.x > W) n.vx *= -1;
            if (n.y < 0 || n.y > H) n.vy *= -1;

            ctx.beginPath();
            ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
            ctx.fillStyle = node;
            ctx.fill();

            for (let j = i + 1; j < nodes.length; j++) {
                const m = nodes[j];
                const dx = n.x - m.x;
                const dy = n.y - m.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < MAX_DIST) {
                    const alpha = 1 - dist / MAX_DIST;
                    ctx.beginPath();
                    ctx.moveTo(n.x, n.y);
                    ctx.lineTo(m.x, m.y);
                    ctx.strokeStyle = line(alpha);
                    ctx.lineWidth = 0.8;
                    ctx.stroke();
                }
            }
        }
        animId = requestAnimationFrame(draw);
    }

    resize();
    buildNodes();
    draw();

    window.addEventListener('resize', () => {
        cancelAnimationFrame(animId);
        resize();
        draw();
    });
})();


// ─────────────────────────────────────────
// DOM REFERENCES
// ─────────────────────────────────────────
const themeToggle     = document.getElementById('themeToggle');
const sunIcon         = document.getElementById('sunIcon');
const moonIcon        = document.getElementById('moonIcon');
const scrollIndicator = document.querySelector('.profile-scroll');
const headerSection   = document.querySelector('.header');
const projectsSection = document.querySelector('#projects');
const contactForm     = document.getElementById('contactForm');
const filterBtns      = document.querySelectorAll('.filter-btn');
const projectCards    = document.querySelectorAll('.project-card');


// ─────────────────────────────────────────
// THEME TOGGLE
// ─────────────────────────────────────────
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


// ─────────────────────────────────────────
// NAVBAR SCROLL SHADOW
// ─────────────────────────────────────────
window.addEventListener('scroll', function () {
    const navbar = document.querySelector('.navbar');
    navbar.classList.toggle('scrolled', window.scrollY > 0);
});


// ─────────────────────────────────────────
// SCROLL INDICATOR — show/hide
// ─────────────────────────────────────────
if (scrollIndicator) {
    scrollIndicator.addEventListener('click', () => {
        scrollIndicator.classList.add('hidden');
    });
}

const scrollObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.target === headerSection) {
            if (entry.isIntersecting) scrollIndicator.classList.remove('hidden');
        } else if (entry.target === projectsSection) {
            if (entry.isIntersecting) scrollIndicator.classList.add('hidden');
        }
    });
}, { threshold: 0.3 });

scrollObserver.observe(headerSection);
scrollObserver.observe(projectsSection);


// ─────────────────────────────────────────
// SMOOTH SCROLL + PARALLAX
// ─────────────────────────────────────────
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

window.addEventListener('scroll', () => {
    const scrolled = window.pageYOffset;
    const header   = document.querySelector('.header');
    if (header && !isNavigatingHome) {
        header.style.transform = scrolled === 0
            ? 'translateY(0px)'
            : `translateY(${scrolled * 0.15}px)`;
    }
});


// ─────────────────────────────────────────
// SECTION FADE-IN OBSERVER
// ─────────────────────────────────────────
const fadeObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) entry.target.classList.add('visible');
    });
}, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

document.querySelectorAll('section').forEach(s => fadeObserver.observe(s));


// ─────────────────────────────────────────
// PROJECT FILTERING
// ─────────────────────────────────────────
filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const filter = btn.getAttribute('data-filter');
        const grid = document.getElementById('projectsGrid');

        // Fade the whole grid out
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

            // Fade back in
            grid.classList.remove('filtering');
        }, 400);
    });
});


// ─────────────────────────────────────────
// PROJECT CARD ANIMATION DELAYS
// ─────────────────────────────────────────
document.querySelectorAll('.project-card').forEach((card, index) => {
    card.style.animationDelay = `${index * 0.1}s`;
});


// ─────────────────────────────────────────
// CONTACT FORM VALIDATION & SUBMISSION
// ─────────────────────────────────────────
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


// ─────────────────────────────────────────
// SUCCESS MODAL
// ─────────────────────────────────────────
function showSuccessModal() {
    const modalHTML = `
        <div class="success-modal" id="successModal">
            <div class="modal-content">
                <div class="success-icon">✅</div>
                <h2 class="modal-title">Message Sent!</h2>
                <p class="modal-message">Thank you for sending a message!<br>I'll get back to you as soon as possible.</p>
                <button class="modal-close-btn" onclick="closeSuccessModal()">Awesome!</button>
            </div>
        </div>`;

    const modalStyles = `
        <style id="modalStyles">
            .success-modal {
                position: fixed; inset: 0;
                background: rgba(0,0,0,0.8);
                backdrop-filter: blur(5px);
                display: flex; justify-content: center; align-items: center;
                z-index: 9999;
                opacity: 0; visibility: hidden;
                transition: all 0.3s ease;
            }
            .success-modal.show { opacity: 1; visibility: visible; }
            .modal-content {
                background: var(--card-bg); color: var(--text-color);
                border: 1px solid var(--border-color);
                padding: 40px; border-radius: 20px; text-align: center;
                max-width: 400px; width: 90%; margin: 20px;
                max-height: 90vh; overflow-y: auto;
                transform: scale(0.8) translateY(50px);
                transition: all 0.3s cubic-bezier(0.34,1.56,0.64,1);
                box-shadow: 0 20px 60px rgba(59,130,246,0.12), 0 8px 32px rgba(0,0,0,0.3);
            }
            .success-modal.show .modal-content { transform: scale(1) translateY(0); }
            .success-icon {
                width: 80px; height: 80px;
                background: var(--accent-color); border-radius: 50%;
                display: flex; align-items: center; justify-content: center;
                margin: 0 auto 20px; font-size: 40px; color: white;
                animation: bounceIn 0.6s ease 0.3s both;
            }
            @keyframes bounceIn {
                0%   { transform: scale(0); opacity: 0; }
                50%  { transform: scale(1.1); }
                100% { transform: scale(1); opacity: 1; }
            }
            .modal-title { font-size: 28px; font-weight: bold; margin-bottom: 15px; animation: slideInUp 0.5s ease 0.4s both; }
            .modal-message { font-size: 18px; line-height: 1.5; margin-bottom: 30px; color: var(--text-color); animation: slideInUp 0.5s ease 0.5s both; }
            @keyframes slideInUp {
                0%   { transform: translateY(30px); opacity: 0; }
                100% { transform: translateY(0); opacity: 1; }
            }
            .modal-close-btn {
                background: var(--accent-color); color: white;
                border: none; padding: 12px 30px; border-radius: 8px;
                cursor: pointer; font-size: 16px; font-weight: 600;
                transition: all 0.3s ease; animation: slideInUp 0.5s ease 0.6s both;
                min-height: 44px; min-width: 120px;
            }
            .modal-close-btn:hover {
                filter: brightness(1.1); transform: translateY(-2px);
                box-shadow: 0 4px 12px rgba(59,130,246,0.4);
            }
            .submit-btn.loading { position: relative; overflow: hidden; }
            .submit-btn.loading::after {
                content: ''; position: absolute; top: 0; left: -100%;
                width: 100%; height: 100%;
                background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
                animation: shimmer 1.5s infinite;
            }
            @keyframes shimmer { 0% { left: -100%; } 100% { left: 100%; } }
            @media (max-width: 480px) {
                .modal-content { padding: 30px 20px; border-radius: 16px; width: calc(100vw - 30px); }
                .success-icon { width: 60px; height: 60px; font-size: 30px; }
                .modal-title { font-size: 24px; }
                .modal-message { font-size: 15px; margin-bottom: 25px; }
                .modal-close-btn { min-height: 48px; }
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
    setTimeout(() => closeSuccessModal(), 6000);
}

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

window.closeSuccessModal = closeSuccessModal;