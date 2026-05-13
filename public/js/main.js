// LuxeMart - Main JavaScript

document.addEventListener('DOMContentLoaded', () => {
    // Header scroll effect
    const header = document.querySelector('.header');
    if (header) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 50) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
        });
    }

    // Add to cart animation
    document.querySelectorAll('.btn-add-cart').forEach(btn => {
        btn.addEventListener('click', function (e) {
            const cart = document.querySelector('.cart-count');
            if (cart) {
                cart.style.transform = 'scale(1.5)';
                setTimeout(() => {
                    cart.style.transform = 'scale(1)';
                }, 200);
            }
        });
    });

    // Product card hover effects
    document.querySelectorAll('.product-card').forEach(card => {
        card.addEventListener('mouseenter', () => {
            card.style.transform = 'translateY(-8px)';
        });
        card.addEventListener('mouseleave', () => {
            card.style.transform = 'translateY(0)';
        });
    });

    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });

    // Animate elements on scroll
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    document.querySelectorAll('.animate-fade-in').forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });
});

// Format currency
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(amount);
}

// Add to cart via API
async function addToCart(productId, quantity = 1) {
    try {
        const response = await fetch('/api/cart/add', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ productId, quantity })
        });
        const data = await response.json();

        if (data.success) {
            // Update cart count
            const cartCount = document.querySelector('.cart-count');
            if (cartCount) {
                cartCount.textContent = data.cartCount;
                cartCount.style.display = 'flex';
            }
            return true;
        }
        return false;
    } catch (error) {
        console.error('Error adding to cart:', error);
        return false;
    }
}

// Search autocomplete
const searchInput = document.querySelector('input[name="search"]');
if (searchInput) {
    let timeout;
    searchInput.addEventListener('input', function () {
        clearTimeout(timeout);
        timeout = setTimeout(async () => {
            if (this.value.length >= 2) {
                try {
                    const response = await fetch(`/api/autocomplete?term=${encodeURIComponent(this.value)}`);
                    const suggestions = await response.json();
                    // Could show suggestions dropdown here
                    console.log('Suggestions:', suggestions);
                } catch (error) {
                    console.error('Autocomplete error:', error);
                }
            }
        }, 300);
    });
}
