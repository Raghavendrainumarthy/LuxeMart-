const express = require('express');
const router = express.Router();
const db = require('../database/db');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

// Admin middleware
const isAdmin = (req, res, next) => {
    if (!req.session.user || req.session.user.role !== 'admin') {
        return res.status(403).render('error', {
            message: 'Access denied. Admin only.',
            error: {},
            title: '403 - LuxeMart'
        });
    }
    next();
};

// Admin dashboard
router.get('/', isAdmin, (req, res) => {
    db.get('SELECT COUNT(*) as count FROM users', [], (err, userResult) => {
        const userCount = userResult ? userResult.count : 0;

        db.get('SELECT COUNT(*) as count FROM products', [], (err2, productResult) => {
            const productCount = productResult ? productResult.count : 0;

            db.get('SELECT COUNT(*) as count FROM orders', [], (err3, orderResult) => {
                const orderCount = orderResult ? orderResult.count : 0;

                db.get('SELECT SUM(total) as total FROM orders', [], (err4, revenueResult) => {
                    const revenue = revenueResult ? revenueResult.total || 0 : 0;

                    db.all(
                        `SELECT o.*, u.username FROM orders o 
                         JOIN users u ON o.user_id = u.id 
                         ORDER BY o.created_at DESC LIMIT 10`,
                        [],
                        (err5, recentOrders) => {
                            // Get list of exported files
                            const exportDir = path.join(__dirname, '../public/exports/');
                            let exportFiles = [];
                            if (fs.existsSync(exportDir)) {
                                exportFiles = fs.readdirSync(exportDir).filter(f => !f.startsWith('.'));
                            }

                            res.render('admin/dashboard', {
                                userCount,
                                productCount,
                                orderCount,
                                revenue,
                                recentOrders: recentOrders || [],
                                exportFiles: exportFiles,
                                title: 'Admin Dashboard - LuxeMart'
                            });
                        }
                    );
                });
            });
        });
    });
});

// User management
router.get('/users', isAdmin, (req, res) => {
    // VULNERABLE: Exposing all user data including passwords
    db.all('SELECT * FROM users', [], (err, users) => {
        res.render('admin/users', {
            users: users || [],
            title: 'User Management - LuxeMart'
        });
    });
});

// VULNERABLE: Path Traversal in file download
router.get('/download', isAdmin, (req, res) => {
    const filename = req.query.file;

    if (!filename) {
        return res.status(400).send('File parameter required');
    }

    // VULNERABLE: No sanitization of file path
    // Attack: /admin/download?file=../../../etc/passwd
    // Or: /admin/download?file=../database/luxemart.db
    const filepath = path.join(__dirname, '../public/exports/', filename);

    if (fs.existsSync(filepath)) {
        res.download(filepath);
    } else {
        // Even exposing the attempted path is a vulnerability
        res.status(404).send(`File not found: ${filepath}`);
    }
});

// VULNERABLE: Command Injection in export
router.post('/export', isAdmin, (req, res) => {
    const { table, format } = req.body;
    const filename = req.body.filename || 'export';

    // VULNERABLE: Command injection through filename
    // Attack: filename = "test; whoami"
    // Attack: filename = "test && dir"
    const exportDir = path.join(__dirname, '../public/exports/');

    // Ensure export directory exists
    if (!fs.existsSync(exportDir)) {
        fs.mkdirSync(exportDir, { recursive: true });
    }

    // VULNERABLE: Direct command execution with user input
    const command = `echo "Exporting ${table} as ${format}" > "${exportDir}${filename}.txt"`;

    exec(command, (error, stdout, stderr) => {
        if (error) {
            return res.json({
                success: false,
                error: error.message,
                command: command // VULNERABLE: Exposing the command
            });
        }

        res.json({
            success: true,
            message: `Export completed: ${filename}.txt`,
            downloadUrl: `/admin/download?file=${filename}.txt`
        });
    });
});

// Order management
router.get('/orders', isAdmin, (req, res) => {
    db.all(
        `SELECT o.*, u.username, u.email FROM orders o 
         JOIN users u ON o.user_id = u.id 
         ORDER BY o.created_at DESC`,
        [],
        (err, orders) => {
            (orders || []).forEach(order => {
                try {
                    order.items = JSON.parse(order.items);
                } catch (e) {
                    order.items = [];
                }
            });

            res.render('admin/orders', {
                orders: orders || [],
                title: 'Order Management - LuxeMart'
            });
        }
    );
});

// Update order status
router.post('/orders/:id/status', isAdmin, (req, res) => {
    const { status } = req.body;
    const orderId = req.params.id;

    db.run('UPDATE orders SET status = ? WHERE id = ?', [status, orderId], (err) => {
        res.redirect('/admin/orders');
    });
});

module.exports = router;
