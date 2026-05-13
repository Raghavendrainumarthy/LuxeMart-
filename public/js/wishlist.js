document.addEventListener('DOMContentLoaded', () => {
    // Create toast element
    const toast = document.createElement('div');
    toast.className = 'wishlist-toast';
    document.body.appendChild(toast);

    function showToast(message) {
        toast.innerHTML = `<i class="fas fa-heart"></i> <span>${message}</span>`;
        toast.classList.add('show');
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }

    function updateNavBadge(delta) {
        const badge = document.querySelector('.wishlist-link .cart-count');
        const link = document.querySelector('.wishlist-link');
        if (badge) {
            let count = parseInt(badge.textContent) + delta;
            if (count <= 0) {
                badge.remove();
            } else {
                badge.textContent = count;
            }
        } else if (delta > 0 && link) {
            const newBadge = document.createElement('span');
            newBadge.className = 'cart-count';
            newBadge.textContent = '1';
            link.appendChild(newBadge);
        }
    }

    document.querySelectorAll('.product-wishlist').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.preventDefault();
            e.stopPropagation();

            const productCard = btn.closest('.product-card');
            // Support both direct attributes on button or on parent card (fallback)
            const productId = btn.dataset.productId || productCard?.querySelector('input[name="productId"]')?.value;
            const productName = btn.dataset.productName || productCard?.querySelector('.product-name')?.innerText.trim();

            if (!productId) return;

            const isActive = btn.classList.contains('active');
            const endpoint = isActive ? '/wishlist/remove' : '/wishlist/add';

            try {
                const response = await fetch(endpoint, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ productId })
                });

                if (response.status === 401) {
                    window.location.href = '/login';
                    return;
                }

                const data = await response.json();

                if (data.success) {
                    const icon = btn.querySelector('i');
                    if (isActive) {
                        btn.classList.remove('active');
                        icon.classList.remove('fas');
                        icon.classList.add('far');
                        updateNavBadge(-1);
                        showToast(`${productName} removed from wishlist`);
                        // If on wishlist page, reload to remove the card
                        if (window.location.pathname === '/wishlist') {
                            setTimeout(() => window.location.reload(), 800);
                        }
                    } else {
                        btn.classList.add('active');
                        icon.classList.remove('far');
                        icon.classList.add('fas');
                        updateNavBadge(1);
                        showToast(`${productName} has been added to wishlist`);
                    }
                }
            } catch (error) {
                console.error('Error updating wishlist:', error);
            }
        });
    });
});
