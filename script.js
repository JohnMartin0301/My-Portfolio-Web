// Global variables
const themeToggle = document.getElementById('themeToggle');
const sunIcon = document.getElementById('sunIcon');
const moonIcon = document.getElementById('moonIcon');
const toggleBtn = document.getElementById('toggleBtn');
const scrollIndicator = document.querySelector('.profile-scroll');
const headerSection = document.querySelector('.header');
const projectsSection = document.querySelector('#projects');
const hiddenRow = document.getElementById('hiddenRow');
const btnText = document.getElementById('btnText');
const arrow = document.getElementById('arrow');
const contactForm = document.getElementById('contactForm');

// Set initial theme to dark
document.documentElement.setAttribute('data-theme', 'dark');

function updateThemeIcons(theme) {
    if (theme === 'light') {
        sunIcon.style.display = 'none';
        moonIcon.style.display = 'block';
    } else {
        sunIcon.style.display = 'block';
        moonIcon.style.display = 'none';
    }
}

// Initialize icons for dark theme
updateThemeIcons('dark');

themeToggle.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    updateThemeIcons(newTheme);
});

// Hide scroll indicator when clicked
scrollIndicator.addEventListener('click', () => {
    scrollIndicator.classList.add('hidden');
});

window.addEventListener("scroll", function () {
  const navbar = document.querySelector(".navbar");
  if (window.scrollY > 0) {
    navbar.classList.add("scrolled");
  } else {
    navbar.classList.remove("scrolled");
  }
});

// Initialize page with scroll animations
window.addEventListener('load', () => {
    const header = document.querySelector('.profile-section');
    if (header) {
        header.style.opacity = '1';
    }
});

// Show/hide scroll indicator based on scroll position
const scrollObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.target === headerSection) {
            if (entry.isIntersecting) {
                // User is in header section - show scroll indicator
                scrollIndicator.classList.remove('hidden');
            }
        } else if (entry.target === projectsSection) {
            if (entry.isIntersecting) {
                // User reached projects section - hide scroll indicator
                scrollIndicator.classList.add('hidden');
            }
        }
    });
}, {
    threshold: 0.3 // Trigger when 30% of the section is visible
});

// Observe both sections
scrollObserver.observe(headerSection);
scrollObserver.observe(projectsSection);

document.querySelectorAll('.scroll-indicator').forEach(link => {
    link.addEventListener('click', function(e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
        target.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
        }
    });
});

let isNavigatingHome = false;

// Smooth scrolling for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();

        const targetId = this.getAttribute('href');

        if (targetId === "#header") {
            // Set flag to disable parallax temporarily
            isNavigatingHome = true;
            
            // Reset header transform immediately
            const header = document.querySelector('.header');
            if (header) {
                header.style.transform = 'translateY(0px)';
            }

            // Scroll to top
            window.scrollTo({
                top: 0,
                behavior: "smooth"
            });

            // Re-enable parallax after scroll animation completes
            setTimeout(() => {
                isNavigatingHome = false;
                // Ensure header stays at 0 when at top
                if (window.pageYOffset === 0 && header) {
                    header.style.transform = 'translateY(0px)';
                }
            }, 1000); // Adjust timing based on your scroll animation duration

        } else {
            const target = document.querySelector(targetId);
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        }
    });
});

window.addEventListener('scroll', () => {
    const scrolled = window.pageYOffset;
    const header = document.querySelector('.header');
    
    if (header && !isNavigatingHome) {
        if (scrolled === 0) {
            header.style.transform = 'translateY(0px)';
        } else {
            header.style.transform = `translateY(${scrolled * 0.15}px)`;
        }
    }
});

// Intersection Observer for fade-in animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
        }
    });
}, observerOptions);

// Observe all sections
document.querySelectorAll('section').forEach(section => {
    observer.observe(section);
});


let isExpanded = false;

toggleBtn.addEventListener('click', () => {
    isExpanded = !isExpanded;
    
    if (isExpanded) {
        hiddenRow.classList.add('show');
        btnText.textContent = 'Show Less';
        arrow.classList.add('rotated');
    } else {
        hiddenRow.classList.remove('show');
        btnText.textContent = 'More projects';
        arrow.classList.remove('rotated');
        
        // Smooth scroll back to the first row after collapse
        setTimeout(() => {
            const firstRow = document.querySelector('.projects-row');
            firstRow.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'start' 
            });
        }, 400);
    }
});

// Add loading animation to project cards
document.querySelectorAll('.project-card').forEach((card, index) => {
    card.style.animationDelay = `${index * 0.1}s`;
});

// Add hover effects to skill items
document.querySelectorAll('.skill-item').forEach(item => {
    item.addEventListener('mouseenter', function() {
        this.style.transform = 'translateY(-5px) scale(1.05)';
    });
    
    item.addEventListener('mouseleave', function() {
        this.style.transform = 'translateY(0) scale(1)';
    });
});

// Contact form validation and submission (keep this exactly as you have it)
contactForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    // Clear previous errors
    clearErrors();
    
    // Get form data
    const formData = new FormData(contactForm);
    const name = formData.get('name').trim();
    const email = formData.get('email').trim();
    const message = formData.get('message').trim();
    
    let isValid = true;
    
    // Validate name
    if (name === '') {
        showError('name-error', 'Name is required');
        isValid = false;
    } else if (name.length < 2) {
        showError('name-error', 'Name must be at least 2 characters');
        isValid = false;
    }
    
    // Validate email
    if (email === '') {
        showError('email-error', 'Email is required');
        isValid = false;
    } else if (!isValidEmail(email)) {
        showError('email-error', 'Please enter a valid email address');
        isValid = false;
    }
    
    // Validate message
    if (message === '') {
        showError('message-error', 'Message is required');
        isValid = false;
    } else if (message.length < 5) {
        showError('message-error', 'Message must be at least 5 characters');
        isValid = false;
    }
    
    if (isValid) {
        // Simulate form submission
        submitForm(name, email, message);
    }
});

// Keep your existing helper functions
function showError(elementId, message) {
    const errorElement = document.getElementById(elementId);
    errorElement.textContent = message;
    errorElement.style.display = 'block';
    
    // Add error styling to input
    const inputElement = errorElement.previousElementSibling;
    inputElement.style.borderColor = '#e74c3c';
}

function clearErrors() {
    const errorElements = document.querySelectorAll('.form-error');
    errorElements.forEach(error => {
        error.textContent = '';
        error.style.display = 'none';
    });
    
    // Remove error styling from inputs
    const inputs = document.querySelectorAll('.form-group input, .form-group textarea');
    inputs.forEach(input => {
        input.style.borderColor = '#e0e0e0';
    });
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Keep your existing submitForm function, just change the success handler
function submitForm(name, email, message) {
    const submitButton = contactForm.querySelector('button[type="submit"]');
    const originalText = submitButton.textContent;
    submitButton.textContent = 'Sending...';
    submitButton.disabled = true;
    
    // Add loading class for the shimmer effect
    submitButton.classList.add('loading');

    const encodedData = new URLSearchParams({
        name,
        email,
        message
    });

    fetch('https://formspree.io/f/meolkoel', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'application/json'
        },
        body: encodedData
    }).then(response => {
        if (response.ok) {
            // Replace the old showSuccessMessage with the new modal
            showSuccessModal();
            contactForm.reset();
        } else {
            return response.json().then(data => {
                const errorMsg = data.errors
                    ? data.errors.map(e => e.message).join(', ')
                    : 'Oops! Something went wrong.';
                alert(errorMsg);
            });
        }
    }).catch(error => {
        console.error('Form submission error:', error);
        alert('Network error. Please try again.');
    }).finally(() => {
        submitButton.textContent = originalText;
        submitButton.disabled = false;
        submitButton.classList.remove('loading'); // Remove loading class
    });
}

// Add this function to replace showSuccessModal()
function showSuccessModal() {
    // Create modal HTML
    const modalHTML = `
        <div class="success-modal" id="successModal">
            <div class="modal-content">
                <div class="success-icon">✅</div>
                <h2 class="modal-title">Message Sent!</h2>
                <p class="modal-message">Thank you for sending a message!<br> I'll get back to you as soon as possible.</p>
                <button class="modal-close-btn" onclick="closeSuccessModal()">Awesome!</button>
            </div>
        </div>
    `;
    
    // Create modal styles
    const modalStyles = `
        <style id="modalStyles">
            .success-modal {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.8);
                backdrop-filter: blur(5px);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 1000;
                opacity: 0;
                visibility: hidden;
                transition: all 0.3s ease;
            }

            .success-modal.show {
                opacity: 1;
                visibility: visible;
            }

            .modal-content {
                background: var(--card-bg);
                color: var(--text-color);
                border: 1px solid var(--border-color);
                padding: 40px;
                border-radius: 20px;
                text-align: center;
                max-width: 400px;
                width: 90%;
                margin: 20px;
                max-height: 90vh;
                overflow-y: auto;
                transform: scale(0.8) translateY(50px);
                transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
                box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
            }

            /* Mobile responsiveness */
            @media (max-width: 480px) {
                .modal-content {
                    padding: 30px 20px;
                    margin: 15px;
                    border-radius: 16px;
                    max-width: none;
                    width: calc(100vw - 30px);
                }
            }

            .success-modal.show .modal-content {
                transform: scale(1) translateY(0);
            }

            .success-icon {
                width: 80px;
                height: 80px;
                background: var(--accent-color);
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                margin: 0 auto 20px;
                font-size: 40px;
                color: white;
                animation: bounceIn 0.6s ease 0.3s both;
            }

            /* Mobile icon adjustment */
            @media (max-width: 480px) {
                .success-icon {
                    width: 60px;
                    height: 60px;
                    font-size: 30px;
                    margin: 0 auto 15px;
                }
            }

            @keyframes bounceIn {
                0% {
                    transform: scale(0);
                    opacity: 0;
                }
                50% {
                    transform: scale(1.1);
                }
                100% {
                    transform: scale(1);
                    opacity: 1;
                }
            }

            .modal-title {
                font-size: 28px;
                font-weight: bold;
                margin-bottom: 15px;
                animation: slideInUp 0.5s ease 0.4s both;
            }

            .modal-message {
                font-size: 18px;
                line-height: 1.5;
                margin-bottom: 30px;
                color: var(--text-color);
                animation: slideInUp 0.5s ease 0.5s both;
            }

            /* Mobile text adjustments */
            @media (max-width: 480px) {
                .modal-title {
                    font-size: 24px;
                    margin-bottom: 12px;
                }

                .modal-message {
                    font-size: 15px;
                    margin-bottom: 25px;
                    line-height: 1.4;
                }
            }

            @keyframes slideInUp {
                0% {
                    transform: translateY(30px);
                    opacity: 0;
                }
                100% {
                    transform: translateY(0);
                    opacity: 1;
                }
            }

            .modal-close-btn {
                background: var(--accent-color);
                color: white;
                border: none;
                padding: 12px 30px;
                border-radius: 8px;
                cursor: pointer;
                font-size: 16px;
                font-weight: 600;
                transition: all 0.3s ease;
                animation: slideInUp 0.5s ease 0.6s both;
                min-height: 44px; /* Touch target size */
                min-width: 120px;
            }

            .modal-close-btn:hover {
                background: var(--accent-color);
                filter: brightness(1.1);
                transform: translateY(-2px);
                box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
            }

            /* Mobile button adjustments */
            @media (max-width: 480px) {
                .modal-close-btn {
                    padding: 14px 24px;
                    font-size: 15px;
                    min-height: 48px; /* Larger touch target */
                    min-width: 100px;
                }

                .modal-close-btn:hover {
                    transform: none; /* Remove hover lift on mobile */
                }
            }

            /* Touch devices - remove hover effects */
            @media (hover: none) and (pointer: coarse) {
                .modal-close-btn:hover {
                    transform: none;
                    filter: none;
                    box-shadow: none;
                }
            }

            .submit-btn.loading {
                position: relative;
                overflow: hidden;
            }

            .submit-btn.loading::after {
                content: '';
                position: absolute;
                top: 0;
                left: -100%;
                width: 100%;
                height: 100%;
                background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
                animation: loading 1.5s infinite;
            }

            @keyframes loading {
                0% {
                    left: -100%;
                }
                100% {
                    left: 100%;
                }
            }
        </style>
    `;
    
    // Add styles to head (only if not already added)
    if (!document.getElementById('modalStyles')) {
        document.head.insertAdjacentHTML('beforeend', modalStyles);
    }
    
    // Add modal to body (only if not already added)
    if (!document.getElementById('successModal')) {
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }
    
    // Show modal
    const modal = document.getElementById('successModal');
    modal.classList.add('show');
    
    // Optional: Auto-close after 5 seconds
    setTimeout(() => {
        closeSuccessModal();
    }, 6000);
}

function closeSuccessModal() {
    const modal = document.getElementById('successModal');
    if (modal) {
        modal.classList.remove('show');
        
        // Optional: Remove modal from DOM after animation completes
        setTimeout(() => {
            modal.remove();
            // Also remove styles if you want
            const styles = document.getElementById('modalStyles');
            if (styles) {
                styles.remove();
            }
        }, 300);
    }
}

// Make closeSuccessModal globally accessible for the onclick handler
window.closeSuccessModal = closeSuccessModal;