/**
 * Generate realistic invoice .txt files for all existing orders.
 * Run with: node generate-invoices.js
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, 'database', 'luxemart.db');
const invoiceDir = path.join(__dirname, 'public', 'invoices');
const db = new sqlite3.Database(dbPath);

if (!fs.existsSync(invoiceDir)) fs.mkdirSync(invoiceDir, { recursive: true });

function pad(str, len) {
    return String(str).padEnd(len, ' ').slice(0, len);
}

function formatDate(dateStr) {
    return new Date(dateStr).toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric'
    });
}

function generateInvoice(order, user, items) {
    const invoiceNo = `LUX-INV-${String(order.id).padStart(6, '0')}`;
    const orderDate = formatDate(order.created_at);
    const dueDate = 'Paid';
    const lineWidth = 60;
    const divider = '─'.repeat(lineWidth);
    const doubleDivider = '═'.repeat(lineWidth);

    const subtotal = items.reduce((s, i) => s + (i.price * i.quantity), 0);
    const shipping = 9.99;
    const tax = +(subtotal * 0.08).toFixed(2);
    const total = +(subtotal + shipping + tax).toFixed(2);

    let lines = [];

    lines.push(doubleDivider);
    lines.push('         LUXEMART — OFFICIAL INVOICE');
    lines.push('         Premium E-Commerce · luxemart.com');
    lines.push(doubleDivider);
    lines.push('');
    lines.push(`  Invoice No    : ${invoiceNo}`);
    lines.push(`  Order ID      : #${order.id}`);
    lines.push(`  Date          : ${orderDate}`);
    lines.push(`  Status        : ${dueDate}`);
    lines.push(`  Tracking No   : ${order.tracking_number || 'N/A'}`);
    lines.push('');
    lines.push(divider);
    lines.push('  BILL TO');
    lines.push(divider);
    lines.push(`  Name          : ${user.full_name || user.username}`);
    lines.push(`  Email         : ${user.email}`);
    lines.push(`  Phone         : ${user.phone || 'Not provided'}`);
    lines.push(`  Address       : ${order.shipping_address || user.address || 'Not provided'}`);
    lines.push('');
    lines.push(divider);
    lines.push('  ITEMS ORDERED');
    lines.push(divider);
    lines.push(`  ${pad('Description', 30)} ${pad('Qty', 5)} ${pad('Unit Price', 10)} ${pad('Total', 8)}`);
    lines.push(`  ${pad('─'.repeat(29), 30)} ${pad('─'.repeat(4), 5)} ${pad('─'.repeat(9), 10)} ${pad('─'.repeat(7), 8)}`);

    items.forEach(item => {
        const itemTotal = (item.price * item.quantity).toFixed(2);
        lines.push(`  ${pad(item.name, 30)} ${pad(item.quantity, 5)} $${pad(item.price.toFixed(2), 9)} $${pad(itemTotal, 7)}`);
    });

    lines.push('');
    lines.push(divider);
    lines.push(`  ${'Subtotal'.padStart(46)} : $${subtotal.toFixed(2)}`);
    lines.push(`  ${'Shipping & Handling'.padStart(46)} : $${shipping.toFixed(2)}`);
    lines.push(`  ${'Tax (8%)'.padStart(46)} : $${tax.toFixed(2)}`);
    lines.push(divider);
    lines.push(`  ${'TOTAL PAID'.padStart(46)} : $${total.toFixed(2)}`);
    lines.push(divider);
    lines.push('');
    lines.push('  PAYMENT DETAILS');
    lines.push(`  Method        : ${order.payment_method ? order.payment_method.toUpperCase() : 'CARD'}`);
    if (order.card_last_four && order.card_last_four !== 'COD' && order.card_last_four !== 'UPI') {
        lines.push(`  Card          : **** **** **** ${order.card_last_four}`);
    }
    lines.push('');
    lines.push(doubleDivider);
    lines.push('  Thank you for shopping at LuxeMart!');
    lines.push('  For support: support@luxemart.com  |  +1 (800) LUX-MART');
    lines.push('  This is a computer-generated invoice. No signature required.');
    lines.push(doubleDivider);

    return lines.join('\n');
}

db.all(`
    SELECT o.*, u.username, u.email, u.full_name, u.address, u.phone
    FROM orders o
    JOIN users u ON o.user_id = u.id
`, [], (err, orders) => {
    if (err) { console.error('DB error:', err.message); process.exit(1); }

    let done = 0;
    if (orders.length === 0) {
        console.log('No orders found.');
        db.close();
        return;
    }

    orders.forEach(order => {
        let items = [];
        try { items = JSON.parse(order.items); } catch (e) { items = []; }
        if (!items.length) items = [{ name: 'LuxeMart Product', quantity: 1, price: order.total }];

        const content = generateInvoice(order, order, items);
        const filename = path.join(invoiceDir, `invoice_${order.id}.txt`);
        fs.writeFileSync(filename, content, 'utf8');
        console.log(`✅ Generated: invoice_${order.id}.txt`);

        done++;
        if (done === orders.length) {
            console.log(`\n📄 Done — ${done} invoice(s) created in public/invoices/`);
            db.close();
        }
    });
});
