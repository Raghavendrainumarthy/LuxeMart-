const express = require('express');
const router = express.Router();
const db = require('../database/db');

// View cart
router.get('/', (req, res) => {
    const cart = req.session.cart || [];
    let total = 0;
    let cartItems = [];
    let pending = cart.length;

    if (pending === 0) {
        return res.render('cart', {
            cartItems: [],
            total: 0,
            title: 'Shopping Cart - LuxeMart'
        });
    }

    cart.forEach(item => {
        db.get('SELECT * FROM products WHERE id = ?', [item.productId], (err, product) => {
            if (product) {
                cartItems.push({
                    ...product,
                    quantity: item.quantity,
                    subtotal: product.price * item.quantity
                });
                total += product.price * item.quantity;
            }
            pending--;
            if (pending === 0) {
                res.render('cart', {
                    cartItems,
                    total,
                    title: 'Shopping Cart - LuxeMart'
                });
            }
        });
    });
});

// Add to cart
router.post('/add', (req, res) => {
    const { productId, quantity = 1 } = req.body;

    if (!req.session.cart) {
        req.session.cart = [];
    }

    const existingItem = req.session.cart.find(item => item.productId == productId);

    if (existingItem) {
        existingItem.quantity += parseInt(quantity);
    } else {
        req.session.cart.push({
            productId: parseInt(productId),
            quantity: parseInt(quantity)
        });
    }

    res.redirect('/cart');
});

// Update cart quantity
router.post('/update', (req, res) => {
    const { productId, quantity } = req.body;

    if (req.session.cart) {
        const item = req.session.cart.find(item => item.productId == productId);
        if (item) {
            if (quantity <= 0) {
                req.session.cart = req.session.cart.filter(item => item.productId != productId);
            } else {
                item.quantity = parseInt(quantity);
            }
        }
    }

    res.redirect('/cart');
});

// Remove from cart
router.post('/remove', (req, res) => {
    const { productId } = req.body;

    if (req.session.cart) {
        req.session.cart = req.session.cart.filter(item => item.productId != productId);
    }

    res.redirect('/cart');
});

// Checkout page
router.get('/checkout', (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login');
    }

    const cart = req.session.cart || [];
    if (cart.length === 0) {
        return res.redirect('/cart');
    }

    let total = 0;
    let cartItems = [];
    let pending = cart.length;

    db.get('SELECT * FROM users WHERE id = ?', [req.session.user.id], (err, user) => {
        cart.forEach(item => {
            db.get('SELECT * FROM products WHERE id = ?', [item.productId], (err, product) => {
                if (product) {
                    cartItems.push({
                        ...product,
                        quantity: item.quantity,
                        subtotal: product.price * item.quantity
                    });
                    total += product.price * item.quantity;
                }
                pending--;
                if (pending === 0) {
                    res.render('checkout', {
                        cartItems,
                        total,
                        user: user || {},
                        title: 'Checkout - LuxeMart'
                    });
                }
            });
        });
    });
});

// Process checkout - VULNERABLE: Sensitive data exposure
router.post('/checkout', (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login');
    }

    const { shipping_address, card_number, card_expiry, card_cvv } = req.body;
    const cart = req.session.cart || [];

    if (cart.length === 0) {
        return res.redirect('/cart');
    }

    let total = 0;
    let items = [];
    let pending = cart.length;

    cart.forEach(item => {
        db.get('SELECT * FROM products WHERE id = ?', [item.productId], (err, product) => {
            if (product) {
                items.push({
                    product_id: product.id,
                    name: product.name,
                    quantity: item.quantity,
                    price: product.price
                });
                total += product.price * item.quantity;
            }
            pending--;
            if (pending === 0) {
                const trackingNumber = 'LUX-' + Date.now();

                db.run(
                    `INSERT INTO orders (user_id, total, status, shipping_address, payment_method, card_last_four, items, tracking_number)
                     VALUES (?, ?, 'pending', ?, 'credit_card', ?, ?, ?)`,
                    [req.session.user.id, total, shipping_address, card_number.slice(-4), JSON.stringify(items), trackingNumber],
                    function (err) {
                        req.session.cart = [];
                        res.render('order-confirmation', {
                            trackingNumber,
                            total,
                            title: 'Order Confirmed - LuxeMart'
                        });
                    }
                );
            }
        });
    });
});

module.exports = router;
