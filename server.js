const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const path = require('path');
const db = require('./database/db');

const app = express();
const PORT = process.env.PORT || 3000;

// ============================================================
// DEMO: In-memory cache simulation for Web Cache Deception
// This simulates a CDN/proxy cache to demonstrate the vulnerability
// In real attacks, this would be done by a shared caching proxy
// ============================================================
const cacheStore = new Map();
const CACHE_TTL = 60000; // Cache for 60 seconds for demo

function getCachedResponse(key) {
    const cached = cacheStore.get(key);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return cached.data;
    }
    // Cache expired, delete it
    if (cached) cacheStore.delete(key);
    return null;
}

function setCachedResponse(key, data) {
    cacheStore.set(key, { data, timestamp: Date.now() });
}
// ============================================================

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));
app.use(bodyParser.json({ limit: '10mb' }));
app.use(cookieParser());

// VULNERABLE: Session configuration with weak settings
app.use(session({
    secret: 'luxemart-secret-key-123', // Weak secret
    resave: false,
    saveUninitialized: true,
    cookie: {
        secure: false, // Should be true in production
        httpOnly: false // VULNERABLE: Allows JS access to cookies
    }
}));

// Static files with caching headers - VULNERABLE to cache attacks
app.use('/static', (req, res, next) => {
    // VULNERABLE: Cache-Control set for all paths including dynamic content
    res.set('Cache-Control', 'public, max-age=86400');
    next();
}, express.static(path.join(__dirname, 'public')));

// VULNERABLE: Web Cache Poisoning - Trusts X-Forwarded-Host header
app.use((req, res, next) => {
    // Store the potentially poisoned host for use in templates
    res.locals.hostHeader = req.headers['x-forwarded-host'] || req.headers['host'];
    res.locals.user = req.session.user || null;
    res.locals.cart = req.session.cart || [];
    res.locals.cartCount = res.locals.cart.reduce((sum, item) => sum + item.quantity, 0);
    next();
});

// Routes
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const cartRoutes = require('./routes/cart');
const orderRoutes = require('./routes/orders');
const adminRoutes = require('./routes/admin');
const apiRoutes = require('./routes/api');
const wishlistRoutes = require('./routes/wishlist');
const cacheRoutes = require('./routes/cache');

// Middleware to fetch user's wishlist
app.use((req, res, next) => {
    res.locals.wishlist = new Set();
    if (req.session.user) {
        db.all('SELECT product_id FROM wishlist WHERE user_id = ?', [req.session.user.id], (err, rows) => {
            if (!err && rows) {
                rows.forEach(row => res.locals.wishlist.add(row.product_id));
            }
            next();
        });
    } else {
        next();
    }
});

// Cache control middleware (path-specific headers)
app.use((req, res, next) => {
    if (req.path.startsWith('/products')) {
        res.set('Cache-Control', 'public, max-age=3600, s-maxage=3600');
        res.set('X-Cache-Vulnerable', 'true');
    }
    next();
});

app.use((req, res, next) => {
    if (req.path.startsWith('/search')) {
        res.set('Cache-Control', 'public, max-age=600');
        if (req.query.q !== undefined) {
            res.set('X-Search-Query', String(req.query.q));
        }
    }
    next();
});

app.use((req, res, next) => {
    if (req.path.startsWith('/profile')) {
        res.set('Cache-Control', 'public, max-age=300');
    }
    next();
});

app.use((req, res, next) => {
    if (req.path.startsWith('/admin')) {
        res.setHeader('Cache-Control', 'public, max-age=600');
        res.setHeader('X-Cache-Vulnerable', 'true');
    }
    next();
});

app.use((req, res, next) => {
    const p = req.path;
    if (p.startsWith('/products') || p.startsWith('/search') || p.startsWith('/profile') || p.startsWith('/static') || p.startsWith('/api') || p.startsWith('/admin')) {
        res.set('X-Cache-Status', 'CACHEABLE');
    } else {
        res.set('X-Cache-Status', 'BYPASS');
    }
    res.set('X-Served-By', 'LuxeMart-Cache/1.0');
    next();
});

app.use('/', authRoutes);
app.use('/products', productRoutes);
app.use('/cart', cartRoutes);
app.use('/orders', orderRoutes);
app.use('/admin', adminRoutes);
app.use('/api', apiRoutes);
app.use('/wishlist', wishlistRoutes);
app.use('/', cacheRoutes);

// Home page
app.get('/', (req, res) => {
    db.all('SELECT * FROM products WHERE featured = 1 LIMIT 8', [], (err, featuredProducts) => {
        if (err) featuredProducts = [];
        db.all('SELECT * FROM products ORDER BY created_at DESC LIMIT 4', [], (err2, newArrivals) => {
            if (err2) newArrivals = [];
            res.render('index', {
                featuredProducts: featuredProducts || [],
                newArrivals: newArrivals || [],
                title: 'LuxeMart - Premium Shopping Experience'
            });
        });
    });
});

// Profile page - only exact /profile route, NOT /profile/addresses etc.
app.get('/profile', (req, res, next) => {
    const staticExtensions = /\.(css|js|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot|json|xml|txt|pdf|map)$/i;
    const isStaticLooking = req.path.match(staticExtensions);
    const cacheKey = req.path;

    if (isStaticLooking) {
        const cachedHtml = getCachedResponse(cacheKey);
        if (cachedHtml) {
            res.set('X-Cache-Status', 'HIT');
            res.set('X-Cached-At', new Date(cacheStore.get(cacheKey).timestamp).toISOString());
            res.set('Content-Type', 'text/html');
            return res.send(cachedHtml);
        }
    }

    if (!req.session.user) {
        return res.redirect('/login');
    }

    db.get('SELECT * FROM users WHERE id = ?', [req.session.user.id], (err, user) => {
        if (err || !user) return res.redirect('/login');
        db.all('SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC LIMIT 5', [req.session.user.id], (err2, orders) => {
            if (err2) orders = [];
            db.all('SELECT * FROM credit_cards WHERE user_id = ? ORDER BY is_default DESC', [req.session.user.id], (err3, creditCards) => {
                if (err3) creditCards = [];
                res.render('profile', {
                    user,
                    orders: orders || [],
                    creditCards: creditCards || [],
                    title: 'My Profile - LuxeMart'
                }, (err, html) => {
                    if (err) return res.status(500).send('Error rendering page');
                    if (isStaticLooking) {
                        setCachedResponse(cacheKey, html);
                        res.set('Cache-Control', 'public, max-age=86400, s-maxage=86400');
                        res.set('Vary', 'Accept-Encoding');
                        res.set('X-Cache-Status', 'MISS');
                    }
                    res.send(html);
                });
            });
        });
    });
});

// Web Cache Deception handler for /user/profile (static-looking extensions trick)
// IDOR is demonstrated via the /api/user/:id fetch call visible in Network tab / Burp
app.get('/user/profile*', (req, res, next) => {
    const staticExtensions = /\.(css|js|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot|json|xml|txt|pdf|map)$/i;
    const isStaticLooking = req.path.match(staticExtensions);
    const cacheKey = req.path;

    if (isStaticLooking) {
        const cachedHtml = getCachedResponse(cacheKey);
        if (cachedHtml) {
            res.set('X-Cache-Status', 'HIT');
            res.set('X-Cached-At', new Date(cacheStore.get(cacheKey).timestamp).toISOString());
            res.set('Content-Type', 'text/html');
            return res.send(cachedHtml);
        }
    }

    if (!req.session.user) {
        return res.redirect('/login');
    }

    // For cache deception demo: render the profile with cache headers for static-looking URLs
    if (isStaticLooking) {
        const userId = req.session.user.id;
        db.get('SELECT * FROM users WHERE id = ?', [userId], (err, targetUser) => {
            if (err || !targetUser) {
                return res.status(404).render('error', { message: 'User not found', error: {}, title: '404 - LuxeMart' });
            }
            db.all('SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC LIMIT 5', [userId], (err2, orders) => {
                if (err2) orders = [];
                db.all('SELECT * FROM credit_cards WHERE user_id = ? ORDER BY is_default DESC', [userId], (err3, creditCards) => {
                    if (err3) creditCards = [];
                    (orders || []).forEach(order => {
                        try { order.items = JSON.parse(order.items); } catch (e) { order.items = []; }
                    });
                    res.render('user-profile-idor', {
                        targetUser,
                        isOwnProfile: true,
                        orders: orders || [],
                        creditCards: creditCards || [],
                        title: `${targetUser.full_name || targetUser.username} - LuxeMart`
                    }, (renderErr, html) => {
                        if (renderErr) return res.status(500).send('Error rendering page');
                        setCachedResponse(cacheKey, html);
                        res.set('Cache-Control', 'public, max-age=86400, s-maxage=86400');
                        res.set('Vary', 'Accept-Encoding');
                        res.set('X-Cache-Status', 'MISS');
                        res.send(html);
                    });
                });
            });
        });
    } else {
        // Normal GET /user/profile — pass to auth router (clean URL, no user ID exposed)
        next();
    }
});

// Internal cache reset (not publicly advertised)
app.get('/_reset-cache', (req, res) => {
    cacheStore.clear();
    res.json({ success: true });
});


// Error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).render('error', {
        message: 'Something went wrong!',
        error: process.env.NODE_ENV === 'development' ? err : {},
        title: 'Error - LuxeMart'
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).render('error', {
        message: 'Page not found',
        error: {},
        title: '404 - LuxeMart'
    });
});

app.listen(PORT, () => {
    console.log(`
    ╔═══════════════════════════════════════════════════════════╗
    ║                                                           ║
    ║   🛍️  LuxeMart - Premium E-Commerce Security Lab          ║
    ║                                                           ║
    ║   Server running at: http://localhost:${PORT}               ║
    ║                                                           ║
    ║   ⚠️  WARNING: This app contains intentional              ║
    ║   vulnerabilities for educational purposes only!          ║
    ║                                                           ║
    ╚═══════════════════════════════════════════════════════════╝
    `);
});

module.exports = app;
