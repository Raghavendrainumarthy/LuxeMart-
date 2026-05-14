const express = require('express');
const router = express.Router();
const db = require('../database/db');

// Product listing with search and filters
router.get('/', (req, res) => {
    const { search, category, sort, minPrice, maxPrice } = req.query;

    let query = 'SELECT * FROM products WHERE 1=1';

    // VULNERABLE: SQL Injection in search
    if (search) {
        // VULNERABLE: Direct string interpolation
        query += ` AND (name LIKE '%${search}%' OR description LIKE '%${search}%')`;
    }

    if (category) {
        query += ` AND category = '${category}'`;
    }

    if (minPrice) {
        query += ` AND price >= ${minPrice}`;
    }

    if (maxPrice) {
        query += ` AND price <= ${maxPrice}`;
    }

    // Sort
    if (sort === 'price_asc') {
        query += ' ORDER BY price ASC';
    } else if (sort === 'price_desc') {
        query += ' ORDER BY price DESC';
    } else if (sort === 'newest') {
        query += ' ORDER BY created_at DESC';
    } else if (sort === 'rating') {
        query += ' ORDER BY rating DESC';
    } else {
        query += ' ORDER BY featured DESC, rating DESC';
    }

    // Execute the vulnerable query
    db.all(query, [], (err, results) => {
        if (err) {
            // VULNERABLE: Exposing SQL errors - helps attackers understand the database structure
            return res.render('products', {
                products: [],
                categories: [],
                search: search || '',
                currentCategory: category || '',
                currentSort: sort || '',
                title: 'Shop All - LuxeMart',
                error: `SQL Error: ${err.message}`,
                rawQuery: query,
                rawResults: null
            });
        }

        // Check if this looks like a UNION injection (results have unexpected columns)
        const isInjection = search && (
            search.toLowerCase().includes('union') ||
            search.toLowerCase().includes('select') ||
            search.includes("'") ||
            search.includes("--")
        );

        db.all('SELECT DISTINCT category FROM products', [], (err2, cats) => {
            const categories = cats ? cats.map(c => c.category) : [];
            res.render('products', {
                products: results || [],
                categories,
                search: search || '',
                currentCategory: category || '',
                currentSort: sort || '',
                title: 'Shop All - LuxeMart',
                rawQuery: isInjection ? query : null,
                rawResults: isInjection ? results : null,
                error: null
            });
        });
    });
});

// Product detail page
router.get('/:id', (req, res) => {
    const productId = req.params.id;

    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.setHeader('X-Product-Cache', 'HIT');

    db.get('SELECT * FROM products WHERE id = ?', [productId], (err, product) => {
        if (err || !product) {
            return res.status(404).render('error', {
                message: 'Product not found',
                error: {},
                title: '404 - LuxeMart'
            });
        }

        // VULNERABLE: Reviews are rendered without sanitization (XSS)
        db.all('SELECT * FROM reviews WHERE product_id = ? ORDER BY created_at DESC', [productId], (err2, reviews) => {
            db.all('SELECT * FROM products WHERE category = ? AND id != ? LIMIT 4', [product.category, productId], (err3, relatedProducts) => {
                res.render('product-detail', {
                    product,
                    reviews: reviews || [],
                    relatedProducts: relatedProducts || [],
                    user: req.session.user || null,
                    title: `${product.name} - LuxeMart`
                });
            });
        });
    });
});

// VULNERABLE: XSS in review submission - no sanitization
router.post('/:id/review', (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login');
    }

    const productId = req.params.id;
    const { rating, comment } = req.body;

    // VULNERABLE: Comment is stored without any sanitization
    db.run(
        'INSERT INTO reviews (product_id, user_id, username, rating, comment) VALUES (?, ?, ?, ?, ?)',
        [productId, req.session.user.id, req.session.user.username, rating, comment],
        function (err) {
            if (!err) {
                db.run('UPDATE products SET reviews_count = reviews_count + 1 WHERE id = ?', [productId]);
            }
            res.redirect(`/products/${productId}`);
        }
    );
});

// Review deletion - only review author or admin can delete
router.post('/:productId/review/delete/:reviewId', (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login');
    }

    const { productId, reviewId } = req.params;

    // Check if the logged-in user is the author of the review or an admin
    db.get('SELECT * FROM reviews WHERE id = ?', [reviewId], (err, review) => {
        if (err || !review) {
            return res.redirect(`/products/${productId}`);
        }

        const isOwner = review.user_id === req.session.user.id;
        const isAdmin = req.session.user.role === 'admin';

        if (!isOwner && !isAdmin) {
            return res.status(403).redirect(`/products/${productId}`);
        }

        db.run('DELETE FROM reviews WHERE id = ?', [reviewId], function (delErr) {
            if (!delErr) {
                db.run('UPDATE products SET reviews_count = MAX(0, reviews_count - 1) WHERE id = ?', [productId]);
            }
            res.redirect(`/products/${productId}`);
        });
    });
});

module.exports = router;
