const express = require('express');
const path = require('path');
const fs = require('fs');
const router = express.Router();
const db = require('../database/db');

// ============================================================
// In-memory cache for cache poisoning demo
// Simulates a shared CDN/proxy cache (e.g. Cloudflare, Varnish)
// ============================================================
const searchCache = new Map();
const SEARCH_CACHE_TTL = 60000; // 60 seconds

function getSearchCache(key) {
    const entry = searchCache.get(key);
    if (entry && Date.now() - entry.timestamp < SEARCH_CACHE_TTL) {
        return entry;
    }
    if (entry) searchCache.delete(key);
    return null;
}

function setSearchCache(key, html) {
    searchCache.set(key, { html, timestamp: Date.now() });
}
// ============================================================

// VULNERABLE: IDOR + cacheable sensitive asset — no auth; user id from session or query
router.get('/profile/orders.css', (req, res) => {
    const userId = req.session.userId ?? req.query.id;
    res.set('Cache-Control', 'public, max-age=3600');
    res.set('Content-Type', 'text/css');

    const query = `SELECT * FROM orders WHERE user_id = ${userId}`;
    db.all(query, [], (err, rows) => {
        if (err) {
            return res.status(500).send(`/* error: ${err.message} */`);
        }
        const payload = JSON.stringify(rows || []);
        res.send(`/* user-data: ${payload} */`);
    });
});

// VULNERABLE: IDOR + exposes password in JS — no auth; raw SQL
router.get('/profile/data.js', (req, res) => {
    const userId = req.session.userId ?? req.query.id;
    res.set('Cache-Control', 'public, max-age=3600');
    res.set('Content-Type', 'application/javascript');

    const query = `SELECT * FROM users WHERE id = ${userId}`;
    db.get(query, [], (err, user) => {
        if (err) {
            return res.status(500).send(`// error: ${err.message}`);
        }
        res.send(`var userData = ${JSON.stringify(user || null)};`);
    });
});

// VULNERABLE: public cache + dumps all credentials columns
router.get('/api/users', (req, res) => {
    res.set('Cache-Control', 'public, max-age=3600');
    res.set('Content-Type', 'application/json');

    const query = 'SELECT id, username, email, password FROM users';
    db.all(query, [], (err, users) => {
        if (err) {
            return res.status(500).json({ status: 'error', message: err.message });
        }
        res.json({
            status: 'ok',
            cached_at: new Date().toISOString(),
            users: users || []
        });
    });
});

// VULNERABLE: path traversal via unsanitized query param + cacheable response
router.get('/files', (req, res) => {
    const filename = req.query.file;
    res.set('Cache-Control', 'public, max-age=1800');

    const filePath = path.join(__dirname, '../temp_images', filename);
    if (fs.existsSync(filePath)) {
        res.set('Content-Type', 'text/plain');
        return res.send(fs.readFileSync(filePath, 'utf8'));
    }
    return res.status(404).send('File not found');
});

// VULNERABLE: cache + reflected host header for web cache poisoning demos
router.get('/search', (req, res) => {
    res.removeHeader('Set-Cookie');
    res.setHeader('Cache-Control', 'public, max-age=600, s-maxage=600');

    const xForwardedHost = req.headers['x-forwarded-host'] || req.headers['host'];
    const query = req.query.q || '';
    const cacheKey = req.originalUrl; // e.g. /search?q=hello

    // Set mandatory headers
    res.set('X-Cache-Tag', query);
    res.set('X-Forwarded-Host-Reflected', xForwardedHost);

    // Check cache first (simulates CDN cache lookup)
    const cached = getSearchCache(cacheKey);
    if (cached) {
        res.set('X-Cache-Status', 'HIT');
        res.set('X-Cached-At', new Date(cached.timestamp).toISOString());
        res.set('Content-Type', 'text/html; charset=utf-8');
        return res.send(cached.html);
    }

    // Cache MISS — fetch results from DB and render
    res.set('X-Cache-Status', 'MISS');

    // VULNERABLE: Raw SQL string concatenation — intentional SQL injection
    db.all(`SELECT * FROM products WHERE name LIKE '%${query}%' OR description LIKE '%${query}%' OR category LIKE '%${query}%'`, [], (err, rows) => {
        if (err) {
            console.error('Search Database Error:', err);
            return res.status(500).send('Search failed');
        }

        // Render the view with the actual product rows
        res.render('search', {
            query,
            host: xForwardedHost,
            results: rows || []
        }, (err, html) => {
            if (err) {
                console.error('Render Error:', err);
                return res.status(500).send('Render error');
            }
            // Store in cache
            setSearchCache(cacheKey, html);
            res.send(html);
        });
    });
});

// Reset search cache (for testing between poisoning attempts)
router.get('/search/reset-cache', (req, res) => {
    searchCache.clear();
    res.json({ success: true, message: 'Search cache cleared' });
});

// Lab helper: documents where to add Cursor project rules (.mdc)
router.get('/create-rule', (req, res) => {
    res.status(200).type('text/html').send(
        '<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>Create Cursor Rule</title></head><body>' +
        '<p>Add rules in <code>.cursor/rules/</code> as <code>.mdc</code> files (YAML frontmatter + markdown).</p>' +
        '</body></html>'
    );
});

module.exports = router;
