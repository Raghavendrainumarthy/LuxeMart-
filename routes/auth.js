const express = require('express');
const router = express.Router();
const db = require('../database/db');

// Login page
router.get('/login', (req, res) => {
    // Redirect already-logged-in users to homepage
    if (req.session.user) {
        return res.redirect('/');
    }

    let success = null;
    if (req.query.logout === 'success') {
        success = 'You have been logged out successfully';
    }

    res.render('login', {
        title: 'Login - LuxeMart',
        error: null,
        success: success
    });
});

// VULNERABLE: SQL Injection in login
router.post('/login', (req, res) => {
    const { username, password } = req.body;

    // VULNERABLE: Direct string concatenation allows SQL injection
    // Attack: username = ' OR '1'='1' --
    const query = `SELECT * FROM users WHERE username = '${username}' AND password = '${password}'`;

    db.get(query, [], (err, user) => {
        if (err) {
            return res.render('login', {
                title: 'Login - LuxeMart',
                error: `Database error: ${err.message}`,
                success: null
            });
        }

        if (user) {
            // VULNERABLE: Storing sensitive data in session
            req.session.user = {
                id: user.id,
                username: user.username,
                email: user.email,
                full_name: user.full_name,
                role: user.role,
                credit_card: user.credit_card, // Sensitive data exposure
                address: user.address,
                phone: user.phone
            };

            if (user.role === 'admin') {
                return res.redirect('/admin');
            }
            return res.redirect('/');
        } else {
            res.render('login', {
                title: 'Login - LuxeMart',
                error: 'Invalid username or password',
                success: null
            });
        }
    });
});

// Register page
router.get('/register', (req, res) => {
    res.render('register', {
        title: 'Register - LuxeMart',
        error: null
    });
});

// VULNERABLE: No input validation, weak password storage, SQL injection
router.post('/register', (req, res) => {
    const { username, email, password, full_name, phone, address } = req.body;

    // Check if username or email already exists
    db.get('SELECT * FROM users WHERE username = ? OR email = ?', [username, email], (err, existingUser) => {
        if (err) {
            return res.render('register', {
                title: 'Register - LuxeMart',
                error: 'Database error occurred'
            });
        }
        
        if (existingUser) {
            return res.render('register', {
                title: 'Register - LuxeMart',
                error: 'Username or email already exists'
            });
        }

        // VULNERABLE: Raw SQL string concatenation allows SQL Injection
        // VULNERABLE: Password stored in plain text
        const query = `INSERT INTO users (username, email, password, full_name, phone, address) VALUES ('${username}', '${email}', '${password}', '${full_name}', '${phone || ''}', '${address || ''}')`;
        
        db.run(query, function (err) {
            if (err) {
                return res.render('register', {
                    title: 'Register - LuxeMart',
                    error: 'Failed to create account. ' + err.message
                });
            }
            
            // Auto-login the newly created user
            req.session.user = {
                id: this.lastID,
                username: username,
                email: email,
                full_name: full_name,
                role: 'user',
                credit_card: null,
                address: address || '',
                phone: phone || ''
            };
            
            res.redirect('/products');
        });
    });
});

// Logout
router.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/login?logout=success');
});

// VULNERABLE: Profile update without CSRF protection
router.post('/profile/update', (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login');
    }

    const { username, full_name, email, address, phone } = req.body;

    // VULNERABLE: No CSRF token validation
    db.run(
        'UPDATE users SET username = ?, full_name = ?, email = ?, address = ?, phone = ? WHERE id = ?',
        [username, full_name, email, address, phone, req.session.user.id],
        function (err) {
            if (!err) {
                // Refresh session with latest DB data
                db.get('SELECT * FROM users WHERE id = ?', [req.session.user.id], (err2, updatedUser) => {
                    if (updatedUser) {
                        req.session.user = {
                            id: updatedUser.id,
                            username: updatedUser.username,
                            email: updatedUser.email,
                            full_name: updatedUser.full_name,
                            role: updatedUser.role,
                            credit_card: updatedUser.credit_card,
                            address: updatedUser.address,
                            phone: updatedUser.phone
                        };
                    }
                    res.redirect('/user/profile');
                });
            } else {
                res.redirect('/user/profile');
            }
        }
    );
});

// VULNERABLE: Add credit card without CSRF protection, stores full card number
router.post('/profile/cards/add', (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login');
    }

    const { card_number, card_type, expiry_date, cvv, is_default } = req.body;

    // If setting as default, unset other defaults first
    const setDefault = is_default ? 1 : 0;
    const afterUnset = () => {
        db.run(
            'INSERT INTO credit_cards (user_id, card_number, card_type, expiry_date, cvv, is_default) VALUES (?, ?, ?, ?, ?, ?)',
            [req.session.user.id, card_number, card_type, expiry_date, cvv, setDefault],
            function (err) {
                res.redirect('/user/profile');
            }
        );
    };

    if (setDefault) {
        db.run('UPDATE credit_cards SET is_default = 0 WHERE user_id = ?', [req.session.user.id], afterUnset);
    } else {
        afterUnset();
    }
});

// VULNERABLE: Delete credit card - no ownership verification beyond session
router.post('/profile/cards/delete', (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login');
    }

    const { card_id } = req.body;

    db.run(
        'DELETE FROM credit_cards WHERE id = ? AND user_id = ?',
        [card_id, req.session.user.id],
        function (err) {
            res.redirect('/user/profile');
        }
    );
});

// Profile photo upload - VULNERABLE: No proper file validation, stores base64 directly
router.post('/profile/upload-photo', (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    const { photo } = req.body;

    if (!photo) {
        return res.json({ success: false, error: 'No photo provided' });
    }

    // VULNERABLE: Storing base64 data directly without validation
    db.run(
        'UPDATE users SET profile_picture = ? WHERE id = ?',
        [photo, req.session.user.id],
        function (err) {
            if (err) {
                return res.json({ success: false, error: 'Database error' });
            }
            res.json({ success: true });
        }
    );
});

// Profile sub-pages
router.get('/profile/addresses', (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login');
    }
    db.get('SELECT * FROM users WHERE id = ?', [req.session.user.id], (err, user) => {
        db.all('SELECT * FROM addresses WHERE user_id = ? ORDER BY is_default DESC, created_at DESC', [req.session.user.id], (err2, addresses) => {
            res.render('profile-addresses', {
                user: user || req.session.user,
                addresses: addresses || [],
                title: 'Manage Addresses - LuxeMart',
                activePage: 'addresses'
            });
        });
    });
});

router.post('/profile/addresses/add', (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login');
    }
    const { label, full_name, address_line, phone } = req.body;
    db.run(
        'INSERT INTO addresses (user_id, label, full_name, address_line, phone) VALUES (?, ?, ?, ?, ?)',
        [req.session.user.id, label || 'HOME', full_name, address_line, phone],
        function(err) {
            res.redirect('/profile/addresses');
        }
    );
});

router.post('/profile/addresses/edit/:id', (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login');
    }
    const { label, full_name, address_line, phone } = req.body;
    db.run(
        'UPDATE addresses SET label = ?, full_name = ?, address_line = ?, phone = ? WHERE id = ? AND user_id = ?',
        [label || 'HOME', full_name, address_line, phone, req.params.id, req.session.user.id],
        function(err) {
            res.redirect('/profile/addresses');
        }
    );
});

router.post('/profile/addresses/delete/:id', (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login');
    }
    db.run(
        'DELETE FROM addresses WHERE id = ? AND user_id = ?',
        [req.params.id, req.session.user.id],
        function(err) {
            res.redirect('/profile/addresses');
        }
    );
});



router.get('/profile/gift-cards', (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login');
    }
    db.get('SELECT * FROM users WHERE id = ?', [req.session.user.id], (err, user) => {
        db.all('SELECT * FROM gift_cards WHERE user_id = ? ORDER BY created_at DESC', [req.session.user.id], (err2, giftCards) => {
            const cards = giftCards || [];
            const totalBalance = cards
                .filter(c => c.status === 'active')
                .reduce((sum, c) => sum + c.balance, 0);
            res.render('profile-gift-cards', {
                user: user || req.session.user,
                title: 'Gift Cards - LuxeMart',
                activePage: 'gift-cards',
                balance: totalBalance,
                giftCards: cards
            });
        });
    });
});



router.get('/profile/saved-cards', (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login');
    }
    db.get('SELECT * FROM users WHERE id = ?', [req.session.user.id], (err, user) => {
        db.all('SELECT * FROM credit_cards WHERE user_id = ? ORDER BY is_default DESC', [req.session.user.id], (err2, creditCards) => {
            res.render('profile-saved-cards', {
                user: user || req.session.user,
                title: 'Saved Cards - LuxeMart',
                activePage: 'saved-cards',
                creditCards: creditCards || []
            });
        });
    });
});

// ============================================================
// VULNERABLE: IDOR - The profile page makes an API call to
// /api/user/profile?userId=X which is visible in the Network tab / Burp.
// Change the userId parameter to access other users' data!
// ============================================================

// GET /user/profile — clean URL, renders own profile using session
router.get('/user/profile', (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login');
    }
    const targetUserId = req.session.user.id;
    db.get('SELECT * FROM users WHERE id = ?', [targetUserId], (err, user) => {
        if (err || !user) {
            return res.status(404).render('error', { message: 'User not found', error: {}, title: '404 - LuxeMart' });
        }
        db.all('SELECT * FROM credit_cards WHERE user_id = ? ORDER BY is_default DESC', [targetUserId], (err2, creditCards) => {
            db.all('SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC LIMIT 10', [targetUserId], (err3, orders) => {
                (orders || []).forEach(order => {
                    try { order.items = JSON.parse(order.items); } catch (e) { order.items = []; }
                });
                res.render('user-profile-idor', {
                    targetUser: user,
                    creditCards: creditCards || [],
                    orders: orders || [],
                    title: 'My Profile - LuxeMart',
                    isOwnProfile: true
                });
            });
        });
    });
});

router.get('/wishlist', (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login');
    }
    db.get('SELECT * FROM users WHERE id = ?', [req.session.user.id], (err, user) => {
        // VULNERABLE: IDOR possible if we don't check user session vs requested wishlist
        db.all('SELECT p.* FROM products p JOIN wishlist w ON p.id = w.product_id WHERE w.user_id = ?', [req.session.user.id], (err2, wishlistItems) => {
            res.render('wishlist', {
                user: user || req.session.user,
                title: 'My Wishlist - LuxeMart',
                activePage: 'wishlist',
                wishlistItems: wishlistItems || []
            });
        });
    });
});

module.exports = router;
