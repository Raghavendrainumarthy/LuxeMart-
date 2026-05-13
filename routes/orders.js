const express = require('express');
const router = express.Router();
const db = require('../database/db');
const path = require('path');
const fs = require('fs');

// Order history
router.get('/', (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login');
    }

    db.all(
        'SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC',
        [req.session.user.id],
        (err, orders) => {
            if (err) orders = [];

            // Parse items JSON
            (orders || []).forEach(order => {
                try {
                    order.items = JSON.parse(order.items);
                } catch (e) {
                    order.items = [];
                }
            });

            res.render('orders', {
                orders: orders || [],
                title: 'My Orders - LuxeMart'
            });
        }
    );
});

// VULNERABLE: Path Traversal — accessible by any logged-in user
// The `file` param is NOT sanitized — ../  sequences resolve freely
// Normal: /orders/invoice?file=invoice_1.txt  → renders legit invoice
// Attack: /orders/invoice?file=../../database/luxemart.db
// Attack: /orders/invoice?file=../../server.js
// Attack: /orders/invoice?file=../../routes/auth.js
router.get('/invoice', (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login');
    }

    const file = req.query.file;

    if (!file) {
        return res.status(400).send(`
            <div style="font-family:monospace;padding:40px;background:#1a1a1a;color:#f44;min-height:100vh;">
                <h2>⚠️ Missing parameter</h2>
                <p>Usage: <code>/orders/invoice?file=invoice_1.txt</code></p>
            </div>
        `);
    }

    // VULNERABLE: No sanitization — path traversal possible
    const filepath = path.join(__dirname, '../public/invoices/', file);

    if (!fs.existsSync(filepath)) {
        // VULNERABLE: Full resolved path leaked in error
        return res.status(404).send(`
            <div style="font-family:monospace;padding:40px;background:#1a1a1a;color:#f44;min-height:100vh;">
                <h2>404 — File not found</h2>
                <p>Resolved path: <code>${filepath}</code></p>
            </div>
        `);
    }

    const content = fs.readFileSync(filepath, 'utf8');
    const isInvoice = file.startsWith('invoice_');

    if (isInvoice) {
        // Render a beautiful styled invoice HTML page
        res.send(`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Invoice — LuxeMart</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <style>
        * { margin:0; padding:0; box-sizing:border-box; }
        body { font-family:'Inter',sans-serif; background:#0f0f0f; color:#e0e0e0; min-height:100vh; display:flex; justify-content:center; padding:40px 20px; }
        .page { background:#1a1a1a; border:1px solid #2a2a2a; border-radius:12px; max-width:720px; width:100%; padding:50px; box-shadow:0 20px 60px rgba(0,0,0,0.6); }
        .header { display:flex; justify-content:space-between; align-items:flex-start; border-bottom:2px solid #c9a84c; padding-bottom:28px; margin-bottom:30px; }
        .brand h1 { font-size:1.8rem; font-weight:700; color:#c9a84c; letter-spacing:2px; }
        .brand p { font-size:0.8rem; color:#888; margin-top:4px; }
        .invoice-meta { text-align:right; }
        .invoice-meta h2 { font-size:1.1rem; font-weight:600; color:#fff; text-transform:uppercase; letter-spacing:1px; }
        .invoice-meta p { font-size:0.82rem; color:#999; margin-top:4px; }
        .badge { display:inline-block; background:#1a3a1a; color:#4caf50; border:1px solid #4caf50; border-radius:20px; padding:3px 12px; font-size:0.75rem; margin-top:6px; }
        .section { margin-bottom:28px; }
        .section-title { font-size:0.7rem; font-weight:600; color:#c9a84c; text-transform:uppercase; letter-spacing:2px; margin-bottom:12px; }
        .bill-grid { display:grid; grid-template-columns:1fr 1fr; gap:20px; background:#111; border-radius:8px; padding:20px; }
        .bill-item label { font-size:0.72rem; color:#888; display:block; margin-bottom:3px; text-transform:uppercase; letter-spacing:1px; }
        .bill-item span { font-size:0.9rem; color:#ddd; font-weight:500; }
        table { width:100%; border-collapse:collapse; }
        thead th { font-size:0.72rem; color:#888; text-transform:uppercase; letter-spacing:1px; padding:10px 12px; text-align:left; border-bottom:1px solid #2a2a2a; }
        tbody td { padding:12px; font-size:0.88rem; color:#ccc; border-bottom:1px solid #1e1e1e; }
        tbody tr:hover { background:#1f1f1f; }
        .td-right { text-align:right; }
        .totals { background:#111; border-radius:8px; padding:20px; }
        .total-row { display:flex; justify-content:space-between; padding:6px 0; font-size:0.88rem; color:#aaa; }
        .total-row.grand { margin-top:12px; padding-top:12px; border-top:1px solid #2a2a2a; font-size:1.05rem; font-weight:700; color:#c9a84c; }
        .footer { text-align:center; margin-top:36px; padding-top:24px; border-top:1px solid #2a2a2a; color:#555; font-size:0.78rem; line-height:1.8; }
        .btn { display:inline-block; margin-top:24px; padding:10px 24px; background:#c9a84c; color:#000; border-radius:6px; text-decoration:none; font-weight:600; font-size:0.85rem; }
        .btn:hover { background:#e0bc5e; }
        @media print { body { background:#fff; } .page { border:none; box-shadow:none; } .btn { display:none; } }
    </style>
</head>
<body>
<div class="page">
    <div class="header">
        <div class="brand">
            <h1>🛍 LuxeMart</h1>
            <p>Premium E-Commerce · luxemart.com</p>
        </div>
        <div class="invoice-meta">
            <h2>Official Invoice</h2>
            <pre style="font-family:inherit;font-size:0.82rem;color:#999;white-space:pre-wrap;">${content.split('\n').slice(5, 11).map(l => l.trim()).join('\n')}</pre>
            <span class="badge">✓ PAID</span>
        </div>
    </div>

    <div class="section">
        <div class="section-title">Invoice Details</div>
        <div class="bill-grid">
            ${content.split('\n').filter(l => l.match(/^\s+(Invoice|Order|Date|Status|Track)/)).map(l => {
            const parts = l.split(':');
            if (parts.length >= 2) {
                const label = parts[0].trim();
                const val = parts.slice(1).join(':').trim();
                return `<div class="bill-item"><label>${label}</label><span>${val}</span></div>`;
            }
            return '';
        }).join('')}
        </div>
    </div>

    <div class="section">
        <div class="section-title">Bill To</div>
        <div class="bill-grid">
            ${content.split('\n').filter(l => l.match(/^\s+(Name|Email|Phone|Address)/)).map(l => {
            const parts = l.split(':');
            if (parts.length >= 2) {
                const label = parts[0].trim();
                const val = parts.slice(1).join(':').trim();
                return `<div class="bill-item"><label>${label}</label><span>${val}</span></div>`;
            }
            return '';
        }).join('')}
        </div>
    </div>

    <div class="section">
        <div class="section-title">Items Ordered</div>
        <table>
            <thead><tr><th>Description</th><th class="td-right">Qty</th><th class="td-right">Unit Price</th><th class="td-right">Total</th></tr></thead>
            <tbody>
            ${(() => {
                const lines = content.split('\n');
                const start = lines.findIndex(l => l.includes('─'.repeat(20)));
                const itemLines = lines.slice(start + 2).filter(l => l.trim() && !l.includes('Subtotal') && !l.includes('─') && !l.includes('═') && !l.includes('Shipping') && !l.includes('Tax') && !l.includes('TOTAL') && !l.includes('PAYMENT') && !l.includes('Method') && !l.includes('Thank') && !l.includes('support') && !l.includes('computer'));
                return itemLines.slice(0, 10).map(l => {
                    const m = l.match(/^\s+(.+?)\s{2,}(\d+)\s+\$([\d.]+)\s+\$([\d.]+)/);
                    if (m) return `<tr><td>${m[1].trim()}</td><td class="td-right">${m[2]}</td><td class="td-right">$${m[3]}</td><td class="td-right">$${m[4]}</td></tr>`;
                    return '';
                }).join('');
            })()}
            </tbody>
        </table>
    </div>

    <div class="section">
        <div class="section-title">Payment Summary</div>
        <div class="totals">
            ${content.split('\n').filter(l => l.match(/(Subtotal|Shipping|Tax \(|TOTAL PAID)/)).map(l => {
                const parts = l.split(':');
                if (parts.length >= 2) {
                    const label = parts[0].trim();
                    const val = parts.slice(1).join(':').trim();
                    const grand = label.includes('TOTAL') ? ' grand' : '';
                    return `<div class="total-row${grand}"><span>${label}</span><span>${val}</span></div>`;
                }
                return '';
            }).join('')}
        </div>
    </div>

    <div class="footer">
        <p>Thank you for shopping at LuxeMart!</p>
        <p>support@luxemart.com &nbsp;|&nbsp; +1 (800) LUX-MART</p>
        <p>This is a computer-generated invoice. No signature required.</p>
        <a href="/orders" class="btn">← Back to Orders</a>
        &nbsp;
        <a href="javascript:window.print()" class="btn" style="background:#333;color:#fff;">🖨 Print</a>
    </div>
</div>
</body>
</html>`);
    } else {
        // Path traversal — render raw file content in browser (attacker sees the stolen file)
        res.send(`<!DOCTYPE html>
<html><head><title>File Content — LuxeMart</title>
<style>body{background:#0d0d0d;color:#00ff88;font-family:monospace;padding:40px;} pre{white-space:pre-wrap;word-break:break-all;font-size:0.88rem;line-height:1.6;}</style>
</head><body>
<h3 style="color:#f44;margin-bottom:20px;">⚠️ Path Traversal — File: ${filepath}</h3>
<pre>${content.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>
</body></html>`);
    }
});



// VULNERABLE: IDOR - Order details accessible by any user
router.get('/:id', (req, res) => {

    if (!req.session.user) {
        return res.redirect('/login');
    }

    const orderId = req.params.id;

    // VULNERABLE: No check if order belongs to current user
    // Any authenticated user can view any order by changing the ID
    db.get('SELECT * FROM orders WHERE id = ?', [orderId], (err, order) => {
        if (err || !order) {
            return res.status(404).render('error', {
                message: 'Order not found',
                error: {},
                title: '404 - LuxeMart'
            });
        }

        try {
            order.items = JSON.parse(order.items);
        } catch (e) {
            order.items = [];
        }

        // VULNERABLE: Also exposing the order owner's info
        db.get('SELECT full_name, email, address, phone FROM users WHERE id = ?', [order.user_id], (err2, orderOwner) => {
            res.render('order-detail', {
                order,
                orderOwner: orderOwner || {},
                title: `Order #${order.id} - LuxeMart`
            });
        });
    });
});

// Track order - also vulnerable to IDOR
router.get('/track/:tracking', (req, res) => {
    const tracking = req.params.tracking;

    // VULNERABLE: No authentication required to track orders
    db.get('SELECT * FROM orders WHERE tracking_number = ?', [tracking], (err, order) => {
        if (err || !order) {
            return res.status(404).render('error', {
                message: 'Order not found',
                error: {},
                title: '404 - LuxeMart'
            });
        }

        try {
            order.items = JSON.parse(order.items);
        } catch (e) {
            order.items = [];
        }

        db.get('SELECT full_name, address FROM users WHERE id = ?', [order.user_id], (err2, orderOwner) => {
            res.render('order-tracking', {
                order,
                orderOwner: orderOwner || {},
                title: `Track Order - LuxeMart`
            });
        });
    });
});

module.exports = router;
