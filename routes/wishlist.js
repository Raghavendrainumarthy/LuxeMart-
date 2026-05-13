const express = require('express');
const router = express.Router();
const db = require('../database/db');

// Middleware to check if user is logged in
const requireAuth = (req, res, next) => {
    if (!req.session.user) {
        return res.status(401).json({ error: 'You must be logged in to manage your wishlist' });
    }
    next();
};

// Get user's wishlist (IDs only) - useful for client-side checks
router.get('/ids', requireAuth, (req, res) => {
    db.all('SELECT product_id FROM wishlist WHERE user_id = ?', [req.session.user.id], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        const productIds = rows.map(row => row.product_id);
        res.json({ productIds });
    });
});

// Add item to wishlist
router.post('/add', requireAuth, (req, res) => {
    const { productId } = req.body;

    if (!productId) {
        return res.status(400).json({ error: 'Product ID is required' });
    }

    db.run(
        'INSERT OR IGNORE INTO wishlist (user_id, product_id) VALUES (?, ?)',
        [req.session.user.id, productId],
        function (err) {
            if (err) {
                console.error('Error adding to wishlist:', err);
                return res.status(500).json({ error: 'Failed to add item to wishlist' });
            }
            res.json({ success: true, message: 'Item added to wishlist' });
        }
    );
});

// Remove item from wishlist
router.post('/remove', requireAuth, (req, res) => {
    const { productId } = req.body;

    if (!productId) {
        return res.status(400).json({ error: 'Product ID is required' });
    }

    db.run(
        'DELETE FROM wishlist WHERE user_id = ? AND product_id = ?',
        [req.session.user.id, productId],
        function (err) {
            if (err) {
                console.error('Error removing from wishlist:', err);
                return res.status(500).json({ error: 'Failed to remove item from wishlist' });
            }
            res.json({ success: true, message: 'Item removed from wishlist' });
        }
    );
});

module.exports = router;
