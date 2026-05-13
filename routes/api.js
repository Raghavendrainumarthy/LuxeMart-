const express = require('express');
const router = express.Router();
const db = require('../database/db');
const path = require('path');
const fs = require('fs');

function generateInvoiceText(orderId, user, items, order) {
    const invoiceNo = `LUX-INV-${String(orderId).padStart(6, '0')}`;
    const orderDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const lineWidth = 60;
    const divider = '─'.repeat(lineWidth);
    const doubleDivider = '═'.repeat(lineWidth);
    function pad(str, len) { return String(str).padEnd(len, ' ').slice(0, len); }

    const subtotal = items.reduce((s, i) => s + (i.price * i.quantity), 0);
    const shipping = 9.99;
    const tax = +(subtotal * 0.08).toFixed(2);
    const total = +(subtotal + shipping + tax).toFixed(2);

    let lines = [
        doubleDivider,
        '         LUXEMART — OFFICIAL INVOICE',
        '         Premium E-Commerce · luxemart.com',
        doubleDivider, '',
        `  Invoice No    : ${invoiceNo}`,
        `  Order ID      : #${orderId}`,
        `  Date          : ${orderDate}`,
        `  Status        : Paid`,
        `  Tracking No   : ${order.trackingNumber || 'N/A'}`, '',
        divider, '  BILL TO', divider,
        `  Name          : ${user.full_name || user.username}`,
        `  Email         : ${user.email}`,
        `  Address       : ${order.shipping_address || 'Not provided'}`, '',
        divider, '  ITEMS ORDERED', divider,
        `  ${pad('Description', 30)} ${pad('Qty', 5)} ${pad('Unit Price', 10)} ${pad('Total', 8)}`,
        `  ${pad('─'.repeat(29), 30)} ${pad('─'.repeat(4), 5)} ${pad('─'.repeat(9), 10)} ${pad('─'.repeat(7), 8)}`
    ];
    items.forEach(item => {
        const t = (item.price * item.quantity).toFixed(2);
        lines.push(`  ${pad(item.name, 30)} ${pad(item.quantity, 5)} $${pad(item.price.toFixed(2), 9)} $${pad(t, 7)}`);
    });
    lines.push('', divider,
        `  ${'Subtotal'.padStart(46)} : $${subtotal.toFixed(2)}`,
        `  ${'Shipping & Handling'.padStart(46)} : $${shipping.toFixed(2)}`,
        `  ${'Tax (8%)'.padStart(46)} : $${tax.toFixed(2)}`,
        divider,
        `  ${'TOTAL PAID'.padStart(46)} : $${total.toFixed(2)}`,
        divider, '',
        '  PAYMENT DETAILS',
        `  Method        : ${(order.paymentMethod || 'CARD').toUpperCase()}`, '',
        doubleDivider,
        '  Thank you for shopping at LuxeMart!',
        '  For support: support@luxemart.com  |  +1 (800) LUX-MART',
        '  This is a computer-generated invoice. No signature required.',
        doubleDivider
    );
    return lines.join('\n');
}


// API Login endpoint for AJAX authentication
router.post('/login', (req, res) => {
    const { username, password } = req.body;

    // SQL query to verify credentials
    const query = `SELECT * FROM users WHERE username = '${username}' AND password = '${password}'`;

    db.get(query, [], (err, user) => {
        if (err) {
            return res.json({ success: false, error: 'Database error occurred' });
        }

        if (user) {
            // Store user in session
            req.session.user = {
                id: user.id,
                username: user.username,
                email: user.email,
                full_name: user.full_name,
                role: user.role,
                credit_card: user.credit_card
            };

            const redirect = user.role === 'admin' ? '/admin' : '/';
            req.session.save(() => {
                return res.json({ success: true, redirect: redirect });
            });
        } else {
            return res.json({ success: false, error: 'Invalid username or password' });
        }
    });
});

// API Checkout endpoint for AJAX order processing
router.post('/checkout', (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    const { shipping_address, card_number, card_expiry, card_cvv, selected_payment, upi_transaction_id } = req.body;
    const cart = req.session.cart || [];

    if (cart.length === 0) {
        return res.json({ success: false, error: 'Cart is empty' });
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

                // Determine payment details based on method
                let paymentMethod = selected_payment || 'card';
                let cardLastFour = '';

                if (paymentMethod === 'card' && card_number) {
                    cardLastFour = card_number.slice(-4);
                } else if (paymentMethod === 'upi') {
                    cardLastFour = upi_transaction_id || 'UPI';
                } else if (paymentMethod === 'cod') {
                    cardLastFour = 'COD';
                }

                db.run(
                    `INSERT INTO orders (user_id, total, status, shipping_address, payment_method, card_last_four, items, tracking_number)
                     VALUES (?, ?, 'pending', ?, ?, ?, ?, ?)`,
                    [req.session.user.id, total, shipping_address, paymentMethod, cardLastFour, JSON.stringify(items), trackingNumber],
                    function (err) {
                        const newOrderId = this.lastID;

                        // Auto-generate invoice file for this order
                        try {
                            const invoiceDir = path.join(__dirname, '../public/invoices/');
                            if (!fs.existsSync(invoiceDir)) fs.mkdirSync(invoiceDir, { recursive: true });
                            const invoiceContent = generateInvoiceText(newOrderId, req.session.user, items, {
                                trackingNumber, paymentMethod, shipping_address
                            });
                            fs.writeFileSync(path.join(invoiceDir, `invoice_${newOrderId}.txt`), invoiceContent, 'utf8');
                        } catch (e) {
                            console.error('Invoice generation failed:', e.message);
                        }

                        req.session.cart = [];
                        req.session.save(() => {
                            res.json({
                                success: true,
                                trackingNumber: trackingNumber,
                                total: total,
                                paymentMethod: paymentMethod
                            });
                        });
                    }
                );

            }
        });
    });
});

// API endpoints

// Get user profile via query parameter - IDOR target visible in Network tab / Burp
// VULNERABLE: The userId parameter can be changed to access any user's data
// Example: /api/user/profile?userId=1  →  change to ?userId=2, ?userId=3, etc.
router.get('/user/profile', (req, res) => {
    const userId = req.query.userId;

    if (!userId) {
        return res.status(400).json({ error: 'Missing userId parameter' });
    }

    // VULNERABLE: No authorization check - any user can access any profile by changing userId
    db.get(
        'SELECT id, username, email, full_name, address, phone, credit_card FROM users WHERE id = ?',
        [userId],
        (err, user) => {
            if (err || !user) {
                return res.status(404).json({ error: 'User not found' });
            }

            // VULNERABLE: Setting aggressive cache headers on sensitive data
            res.set('Cache-Control', 'public, max-age=86400, s-maxage=86400');
            res.set('Vary', 'Accept-Encoding');
            res.set('X-Cache-Status', 'HIT'); // Fake cache hit for demo
            res.json(user);
        }
    );
});

// Get user profile by path param - Web Cache Deception target
// VULNERABLE: Sensitive API data with cache headers
// Attack payloads:
//   /api/user/1.css     /api/user/1.js      /api/user/1.png
//   /api/user/1/x.css   /api/user/1/anything.js
router.get('/user/:id', (req, res) => {
    const userId = req.params.id;

    // VULNERABLE: No proper authorization check - any user can access any profile
    db.get(
        'SELECT id, username, email, full_name, address, phone, credit_card FROM users WHERE id = ?',
        [userId],
        (err, user) => {
            if (err || !user) {
                return res.status(404).json({ error: 'User not found' });
            }

            // VULNERABLE: Setting aggressive cache headers on sensitive data
            res.set('Cache-Control', 'public, max-age=86400, s-maxage=86400');
            res.set('Vary', 'Accept-Encoding');
            res.set('X-Cache-Status', 'HIT'); // Fake cache hit for demo
            res.json(user);
        }
    );
});

// Search API
router.get('/search', (req, res) => {
    const query = req.query.q || '';
    const sql = `SELECT * FROM products WHERE name LIKE '%${query}%' OR description LIKE '%${query}%' LIMIT 20`;

    db.all(sql, [], (err, results) => {
        if (err) {
            return res.status(500).json({
                error: err.message
            });
        }

        res.json({
            query: query,
            count: results ? results.length : 0,
            results: results || []
        });
    });
});

// SQL Query API
router.get('/query', (req, res) => {
    const sql = req.query.sql || '';

    if (!sql) {
        return res.status(400).json({
            error: 'Missing SQL query parameter'
        });
    }

    db.all(sql, [], (err, results) => {
        if (err) {
            return res.status(500).json({
                error: err.message
            });
        }

        res.json({
            count: results ? results.length : 0,
            data: results || []
        });
    });
});

// Get product reviews
router.get('/products/:id/reviews', (req, res) => {
    const productId = req.params.id;

    // VULNERABLE: Reviews containing XSS are returned without sanitization
    db.all('SELECT * FROM reviews WHERE product_id = ?', [productId], (err, reviews) => {
        res.json(reviews || []);
    });
});

// Autocomplete - for search suggestions
router.get('/autocomplete', (req, res) => {
    const term = req.query.term || '';

    // VULNERABLE: SQL injection and reflected XSS
    const sql = `SELECT DISTINCT name FROM products WHERE name LIKE '%${term}%' LIMIT 5`;

    db.all(sql, [], (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json((results || []).map(r => r.name));
    });
});

// Get current cart
router.get('/cart', (req, res) => {
    const cart = req.session.cart || [];
    let items = [];
    let total = 0;
    let pending = cart.length;

    if (pending === 0) {
        return res.json({ items: [], total: 0 });
    }

    cart.forEach(item => {
        db.get('SELECT * FROM products WHERE id = ?', [item.productId], (err, product) => {
            if (product) {
                items.push({
                    product,
                    quantity: item.quantity,
                    subtotal: product.price * item.quantity
                });
                total += product.price * item.quantity;
            }
            pending--;
            if (pending === 0) {
                res.json({ items, total });
            }
        });
    });
});

// Add to cart via API
router.post('/cart/add', (req, res) => {
    const { productId, quantity = 1 } = req.body;

    if (!req.session.cart) {
        req.session.cart = [];
    }

    const existing = req.session.cart.find(item => item.productId == productId);

    if (existing) {
        existing.quantity += parseInt(quantity);
    } else {
        req.session.cart.push({
            productId: parseInt(productId),
            quantity: parseInt(quantity)
        });
    }

    res.json({ success: true, cartCount: req.session.cart.reduce((sum, item) => sum + item.quantity, 0) });
});

module.exports = router;
