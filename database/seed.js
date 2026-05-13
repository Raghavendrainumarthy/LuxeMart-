const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'luxemart.db');
const db = new sqlite3.Database(dbPath);

console.log('🌱 Seeding database...\n');

// Use serialize to ensure all queries run in order
db.serialize(() => {
    // Create tables
    db.run(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            full_name TEXT,
            address TEXT,
            phone TEXT,
            role TEXT DEFAULT 'user',
            credit_card TEXT,
            profile_picture TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    db.run(`
        CREATE TABLE IF NOT EXISTS products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            description TEXT,
            price REAL NOT NULL,
            original_price REAL,
            category TEXT,
            image TEXT,
            stock INTEGER DEFAULT 100,
            featured INTEGER DEFAULT 0,
            rating REAL DEFAULT 4.5,
            reviews_count INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    db.run(`
        CREATE TABLE IF NOT EXISTS reviews (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            product_id INTEGER,
            user_id INTEGER,
            username TEXT,
            rating INTEGER,
            comment TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (product_id) REFERENCES products(id),
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    `);

    db.run(`
        CREATE TABLE IF NOT EXISTS orders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            total REAL,
            status TEXT DEFAULT 'pending',
            shipping_address TEXT,
            payment_method TEXT,
            card_last_four TEXT,
            items TEXT,
            tracking_number TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    `);

    db.run(`
        CREATE TABLE IF NOT EXISTS cart (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            product_id INTEGER,
            quantity INTEGER DEFAULT 1,
            FOREIGN KEY (user_id) REFERENCES users(id),
            FOREIGN KEY (product_id) REFERENCES products(id)
        )
    `);

    db.run(`
        CREATE TABLE IF NOT EXISTS credit_cards (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            card_number TEXT NOT NULL,
            card_type TEXT NOT NULL,
            expiry_date TEXT NOT NULL,
            cvv TEXT NOT NULL,
            is_default INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    `);

    db.run(`
        CREATE TABLE IF NOT EXISTS gift_cards (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            code TEXT UNIQUE NOT NULL,
            balance REAL NOT NULL,
            original_amount REAL NOT NULL,
            status TEXT DEFAULT 'active',
            expiry_date TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    `);

    // Clear existing data and reset auto-increment
    db.run('DELETE FROM reviews');
    db.run('DELETE FROM orders');
    db.run('DELETE FROM cart');
    db.run('DELETE FROM products');
    db.run('DELETE FROM credit_cards');
    db.run('DELETE FROM gift_cards');
    db.run('DELETE FROM users');
    db.run('DELETE FROM sqlite_sequence'); // Reset auto-increment counters

    // Seed Users - VULNERABLE: Passwords stored in plain text
    const users = [
        { username: 'admin', email: 'admin@luxemart.com', password: 'admin123', full_name: 'Admin User', role: 'admin', credit_card: '4532-1234-5678-9012', address: '123 Admin Street, New York, NY 10001', phone: '+1-555-0100' },
        { username: 'peter', email: 'peter@dailybugle.com', password: 'camera', full_name: 'Peter Parker', role: 'user', credit_card: '4532-9876-5432-1098', address: '20 Ingram Street, Queens, NY 11375', phone: '+1-555-0101' },
        { username: 'mj', email: 'mj@example.com', password: 'MJ123', full_name: 'Marry Jane', role: 'user', credit_card: '4532-5555-6666-7777', address: '410 Chelsea Street, Manhattan, NY 10011', phone: '+1-555-0102' },
        { username: 'jjj', email: 'jonah@dailybugle.com', password: 'spiderman', full_name: 'J Jonnah Jonhnsson', role: 'user', credit_card: '4532-1111-2222-3333', address: 'Daily Bugle, 39th Floor, NY 10036', phone: '+1-555-0103' },
        { username: 'madhu', email: 'madhu@luxemart.com', password: 'X#9kL!vQ2$mZ&pW7', full_name: 'Madhu Kumar', role: 'user', credit_card: '4532-7742-8891-4456', address: '88 Brigade Road, Bangalore, KA 560001', phone: '+91-98450-12345' },
        { username: 'deepak', email: 'deepak@luxemart.com', password: 'deepak2024', full_name: 'Deepak Sharma', role: 'user', credit_card: '4532-3301-5567-2289', address: '45 MG Road, Pune, MH 411001', phone: '+91-99201-67890' },
        { username: 'sumanth', email: 'sumanth@luxemart.com', password: '48291637502', full_name: 'Sumanth Reddy', role: 'user', credit_card: '4532-6618-9903-7741', address: '12 Jubilee Hills, Hyderabad, TS 500033', phone: '+91-91234-56789' }
    ];

    users.forEach(user => {
        db.run(`
            INSERT INTO users (username, email, password, full_name, role, credit_card, address, phone)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [user.username, user.email, user.password, user.full_name, user.role, user.credit_card, user.address, user.phone], function (err) {
            if (!err) console.log(`✓ Created user: ${user.username}`);
        });
    });

    // Seed Credit Cards - Multiple cards per user with CVV
    const creditCards = [
        // Admin cards
        { user_id: 1, card_number: '4532-1234-5678-9012', card_type: 'Visa', expiry_date: '12/26', cvv: '847', is_default: 1 },
        { user_id: 1, card_number: '5425-2334-3010-9903', card_type: 'Mastercard', expiry_date: '08/27', cvv: '192', is_default: 0 },
        // Peter's cards
        { user_id: 2, card_number: '4532-9876-5432-1098', card_type: 'Visa', expiry_date: '03/27', cvv: '523', is_default: 1 },
        { user_id: 2, card_number: '5425-7890-1234-5678', card_type: 'Mastercard', expiry_date: '11/26', cvv: '641', is_default: 0 },
        { user_id: 2, card_number: '3782-822463-10005', card_type: 'Amex', expiry_date: '06/28', cvv: '729', is_default: 0 },
        // MJ's cards
        { user_id: 3, card_number: '4532-5555-6666-7777', card_type: 'Visa', expiry_date: '09/27', cvv: '318', is_default: 1 },
        { user_id: 3, card_number: '5425-1111-2222-8888', card_type: 'Mastercard', expiry_date: '04/26', cvv: '956', is_default: 0 },
        // JJJ's cards
        { user_id: 4, card_number: '4532-1111-2222-3333', card_type: 'Visa', expiry_date: '01/28', cvv: '472', is_default: 1 },
        { user_id: 4, card_number: '5425-4444-5555-6666', card_type: 'Mastercard', expiry_date: '07/27', cvv: '835', is_default: 0 },
        { user_id: 4, card_number: '3782-946729-30001', card_type: 'Amex', expiry_date: '10/26', cvv: '618', is_default: 0 },
        // Madhu's cards
        { user_id: 5, card_number: '4532-7742-8891-4456', card_type: 'Visa', expiry_date: '05/28', cvv: '391', is_default: 1 },
        { user_id: 5, card_number: '5425-8823-4419-6632', card_type: 'Mastercard', expiry_date: '11/27', cvv: '274', is_default: 0 },
        // Deepak's cards
        { user_id: 6, card_number: '4532-3301-5567-2289', card_type: 'Visa', expiry_date: '09/27', cvv: '563', is_default: 1 },
        { user_id: 6, card_number: '5425-2209-7781-3345', card_type: 'Mastercard', expiry_date: '03/28', cvv: '718', is_default: 0 },
        // Sumanth's cards
        { user_id: 7, card_number: '4532-6618-9903-7741', card_type: 'Visa', expiry_date: '02/28', cvv: '845', is_default: 1 },
        { user_id: 7, card_number: '3782-551847-20009', card_type: 'Amex', expiry_date: '08/27', cvv: '926', is_default: 0 }
    ];

    creditCards.forEach(card => {
        db.run(`
            INSERT INTO credit_cards (user_id, card_number, card_type, expiry_date, cvv, is_default)
            VALUES (?, ?, ?, ?, ?, ?)
        `, [card.user_id, card.card_number, card.card_type, card.expiry_date, card.cvv, card.is_default], function (err) {
            if (!err) console.log(`✓ Created credit card for user ${card.user_id}: ${card.card_type}`);
        });
    });

    // Seed Products - Luxury items
    const products = [
        // WATCHES
        { name: 'Royal Oak Chronograph', description: 'Elegant stainless steel automatic chronograph with blue dial. Swiss-made precision movement.', price: 24999.99, original_price: 28999.99, category: 'Watches', image: 'https://images.unsplash.com/photo-1600003014755-ba31aa59c4b6?w=1200&q=80&auto=format', featured: 1, rating: 4.9 },
        { name: 'Nautilus Platinum', description: 'Iconic luxury sports watch with platinum case and stunning blue gradient dial.', price: 89999.99, original_price: 95000.00, category: 'Watches', image: 'https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=1200&q=80&auto=format', featured: 1, rating: 5.0 },
        { name: 'Submariner Gold', description: 'Classic diving watch with 18k gold case and Cerachrom bezel insert.', price: 38999.99, original_price: 42000.00, category: 'Watches', image: 'https://images.unsplash.com/photo-1547996160-81dfa63595aa?w=1200&q=80&auto=format', featured: 0, rating: 4.8 },
        { name: 'Daytona Cosmograph', description: 'Legendary chronograph with tachymetric scale. Oystersteel and Cerachrom bezel.', price: 34999.99, original_price: 38000.00, category: 'Watches', image: 'https://images.unsplash.com/photo-1526045431048-f857369baa09?w=1200&q=80&auto=format', featured: 1, rating: 4.9 },
        { name: 'Santos de Cartier', description: 'Iconic square-shaped watch with interchangeable straps. 18K rose gold.', price: 12500.00, original_price: 14000.00, category: 'Watches', image: 'https://images.unsplash.com/photo-1522312346375-d1a52e2b99b3?w=1200&q=80&auto=format', featured: 0, rating: 4.7 },

        // BAGS
        { name: 'Birkin 35 Togo', description: 'Iconic handbag in supple Togo leather with palladium hardware. Handcrafted in France.', price: 15999.99, original_price: 18000.00, category: 'Bags', image: 'https://images.unsplash.com/photo-1598099947145-e85739e7ca28?w=1200&q=80&auto=format', featured: 1, rating: 4.9 },
        { name: 'Classic Flap Medium', description: 'Timeless quilted lambskin bag with signature gold chain strap.', price: 8999.99, original_price: 9500.00, category: 'Bags', image: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=1200&q=80&auto=format', featured: 1, rating: 4.7 },
        { name: 'Neverfull MM', description: 'Spacious tote in signature monogram canvas with natural cowhide trim.', price: 1999.99, original_price: 2200.00, category: 'Bags', image: 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=1200&q=80&auto=format', featured: 0, rating: 4.6 },
        { name: 'Kelly Sellier 28', description: 'Structured handbag in Epsom leather with turn-lock closure. Handstitched.', price: 21999.99, original_price: 24000.00, category: 'Bags', image: 'https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?w=1200&q=80&auto=format', featured: 0, rating: 4.9 },
        { name: 'Speedy Bandoulière 30', description: 'Iconic barrel bag with removable shoulder strap. Monogram canvas.', price: 1650.00, original_price: 1850.00, category: 'Bags', image: 'https://images.unsplash.com/photo-1594223274512-ad4803739b7c?w=1200&q=80&auto=format', featured: 0, rating: 4.5 },

        // JEWELRY
        { name: 'Love Bracelet Rose Gold', description: '18K rose gold iconic bracelet with new screw system. Timeless symbol of love.', price: 7450.00, original_price: 7800.00, category: 'Jewelry', image: 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=1200&q=80&auto=format', featured: 1, rating: 4.8 },
        { name: 'Diamond Tennis Bracelet', description: '7 carat round brilliant diamonds set in 18K white gold. VS clarity, F color.', price: 12999.99, original_price: 15000.00, category: 'Jewelry', image: 'https://images.unsplash.com/photo-1763029513623-37d488cb97b1?w=1200&q=80&auto=format', featured: 1, rating: 4.9 },
        { name: 'Pearl Strand Necklace', description: 'Akoya cultured pearl strand with 18K white gold clasp. 18-inch length.', price: 4999.99, original_price: 5500.00, category: 'Jewelry', image: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=1200&q=80&auto=format', featured: 0, rating: 4.5 },
        { name: 'Panthère de Cartier Ring', description: '18K white gold ring set with emeralds and onyx. Iconic panther design.', price: 18500.00, original_price: 20000.00, category: 'Jewelry', image: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=1200&q=80&auto=format', featured: 0, rating: 4.8 },
        { name: 'Tiffany Victoria Earrings', description: 'Marquise diamond drop earrings in platinum. 1.5 total carat weight.', price: 8900.00, original_price: 9500.00, category: 'Jewelry', image: 'https://images.unsplash.com/photo-1693212793204-bcea856c75fe?w=1200&q=80&auto=format', featured: 1, rating: 4.9 },

        // SHOES - Premium
        { name: 'Red Bottom Pumps', description: 'Iconic patent leather stiletto pumps with signature red lacquered soles.', price: 795.00, original_price: 895.00, category: 'Shoes', image: 'https://images.unsplash.com/photo-1760473004054-eb0fd50ea9ae?w=1200&q=80&auto=format', featured: 1, rating: 4.7 },
        { name: 'Triple S Sneakers', description: 'Oversized multi-material runners with stacked sole. Statement streetwear.', price: 1050.00, original_price: 1150.00, category: 'Shoes', image: 'https://images.unsplash.com/photo-1579338559194-a162d19bf842?w=1200&q=80&auto=format', featured: 0, rating: 4.4 },
        { name: 'Chelsea Suede Boots', description: 'Italian suede Chelsea boots with Goodyear welt construction.', price: 599.99, original_price: 699.99, category: 'Shoes', image: 'https://images.unsplash.com/photo-1608629601270-a0007becead3?w=1200&q=80&auto=format', featured: 0, rating: 4.6 },
        { name: 'Oxford Brogues Premium', description: 'Hand-polished calfskin Oxford shoes with intricate brogue detailing.', price: 890.00, original_price: 990.00, category: 'Shoes', image: 'https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?w=1200&q=80&auto=format', featured: 1, rating: 4.8 },
        { name: 'Velvet Loafers', description: 'Handcrafted velvet loafers with gold embroidered crest. Italian made.', price: 695.00, original_price: 795.00, category: 'Shoes', image: 'https://images.unsplash.com/photo-1533867617858-e7b97e060509?w=1200&q=80&auto=format', featured: 0, rating: 4.6 },
        { name: 'Stiletto Sandals Crystal', description: 'Crystal-embellished strappy heels with ankle wrap. 100mm heel height.', price: 1295.00, original_price: 1450.00, category: 'Shoes', image: 'https://images.unsplash.com/photo-1515347619252-60a4bf4fff4f?w=1200&q=80&auto=format', featured: 1, rating: 4.7 },
        { name: 'Leather Derby Shoes', description: 'Full-grain leather Derby shoes with Blake-stitched sole. Classic elegance.', price: 750.00, original_price: 850.00, category: 'Shoes', image: 'https://images.unsplash.com/photo-1449505278894-297fdb3edbc1?w=1200&q=80&auto=format', featured: 0, rating: 4.5 },

        // SUITS - Premium
        { name: 'Bespoke Wool Suit', description: 'Hand-tailored suit in Super 150s Italian wool. Peak lapel, full canvas construction.', price: 4500.00, original_price: 5200.00, category: 'Suits', image: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=1200&q=80&auto=format', featured: 1, rating: 4.9 },
        { name: 'Tuxedo Midnight Blue', description: 'Slim-fit tuxedo in midnight blue wool with satin peak lapels. Black-tie perfection.', price: 3200.00, original_price: 3800.00, category: 'Suits', image: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=1200&q=80&auto=format', featured: 1, rating: 4.8 },
        { name: 'Linen Summer Suit', description: 'Breathable Italian linen suit in ivory. Unlined for warm weather elegance.', price: 1899.99, original_price: 2200.00, category: 'Suits', image: 'https://images.unsplash.com/photo-1593030761757-71fae45fa0e7?w=1200&q=80&auto=format', featured: 0, rating: 4.6 },
        { name: 'Double-Breasted Pinstripe', description: 'Classic pinstripe suit with double-breasted jacket. Power dressing redefined.', price: 2800.00, original_price: 3200.00, category: 'Suits', image: 'https://images.unsplash.com/photo-1617127365659-c47fa864d8bc?w=1200&q=80&auto=format', featured: 0, rating: 4.7 },
        { name: 'Velvet Dinner Jacket', description: 'Luxurious velvet evening jacket with silk shawl lapel. Perfect for galas.', price: 2100.00, original_price: 2500.00, category: 'Suits', image: 'https://images.unsplash.com/photo-1592878904946-b3cd8ae243d0?w=1200&q=80&auto=format', featured: 1, rating: 4.8 },

        // DRESSES - Premium
        { name: 'Silk Evening Gown', description: 'Floor-length silk gown with hand-beaded bodice. Made in Italy.', price: 2899.99, original_price: 3200.00, category: 'Dresses', image: 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=1200&q=80&auto=format', featured: 1, rating: 4.9 },
        { name: 'Sequin Cocktail Dress', description: 'Fitted sequin mini dress with cap sleeves. Showstopping glamour.', price: 1450.00, original_price: 1700.00, category: 'Dresses', image: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=1200&q=80&auto=format', featured: 1, rating: 4.7 },
        { name: 'Cashmere Wrap Dress', description: 'Elegant cashmere blend wrap dress in burgundy. Timeless sophistication.', price: 890.00, original_price: 1050.00, category: 'Dresses', image: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=1200&q=80&auto=format', featured: 0, rating: 4.6 },
        { name: 'Embroidered Ball Gown', description: 'Hand-embroidered tulle ball gown with sweetheart neckline. Fairytale elegance.', price: 5500.00, original_price: 6200.00, category: 'Dresses', image: 'https://images.unsplash.com/photo-1760893107461-baee57948240?w=1200&q=80&auto=format', featured: 1, rating: 4.9 },
        { name: 'Lace Midi Dress', description: 'French lace midi dress with scalloped hem. Romantic and refined.', price: 1200.00, original_price: 1400.00, category: 'Dresses', image: 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=1200&q=80&auto=format', featured: 0, rating: 4.5 },
        { name: 'Velvet Maxi Dress', description: 'Plush velvet maxi dress with dramatic sleeves. Winter elegance.', price: 1650.00, original_price: 1900.00, category: 'Dresses', image: 'https://images.unsplash.com/photo-1542471967832-ccce202d736f?w=1200&q=80&auto=format', featured: 0, rating: 4.7 },

        // PERFUMES - Premium
        { name: 'Oud Royal Parfum', description: 'Luxurious oud-based fragrance with rose and saffron. 75ml eau de parfum.', price: 450.00, original_price: 520.00, category: 'Perfumes', image: 'https://images.unsplash.com/photo-1541643600914-78b084683601?w=1200&q=80&auto=format', featured: 1, rating: 4.8 },
        { name: 'Noir Absolu', description: 'Mysterious blend of black amber, vetiver and leather. Intense and seductive.', price: 395.00, original_price: 450.00, category: 'Perfumes', image: 'https://images.unsplash.com/photo-1523293182086-7651a899d37f?w=1200&q=80&auto=format', featured: 1, rating: 4.7 },
        { name: 'Fleur de Luxe', description: 'Delicate floral bouquet with jasmine, tuberose and white musk. 100ml EDP.', price: 320.00, original_price: 380.00, category: 'Perfumes', image: 'https://images.unsplash.com/photo-1588405748880-12d1d2a59f75?w=1200&q=80&auto=format', featured: 0, rating: 4.6 },
        { name: 'Bois Précieux', description: 'Rare sandalwood and cedarwood blend with vanilla undertones. Unisex.', price: 550.00, original_price: 620.00, category: 'Perfumes', image: 'https://images.unsplash.com/photo-1642698215110-87817f1fbe0e?w=1200&q=80&auto=format', featured: 1, rating: 4.9 },
        { name: 'Aqua di Mare', description: 'Fresh maritime notes with bergamot and sea salt. Perfect for summer.', price: 280.00, original_price: 330.00, category: 'Perfumes', image: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=1200&q=80&auto=format', featured: 0, rating: 4.5 },
        { name: 'Rose Imperiale', description: 'Bulgarian rose absolute with raspberry and patchouli. Opulent femininity.', price: 485.00, original_price: 550.00, category: 'Perfumes', image: 'https://images.unsplash.com/photo-1587017539504-67cfbddac569?w=1200&q=80&auto=format', featured: 0, rating: 4.8 },

        // SUNGLASSES - Premium
        { name: 'Aviator Sunglasses', description: 'Iconic aviator frames with polarized mineral glass lenses. Gold-plated.', price: 450.00, original_price: 520.00, category: 'Sunglasses', image: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=1200&q=80&auto=format', featured: 0, rating: 4.5 },
        { name: 'Cat-Eye Acetate', description: 'Vintage-inspired cat-eye frames in tortoiseshell acetate. UV400 protection.', price: 380.00, original_price: 440.00, category: 'Sunglasses', image: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=1200&q=80&auto=format', featured: 1, rating: 4.7 },
        { name: 'Oversized Square', description: 'Bold oversized square frames in black acetate. Celebrity favorite.', price: 520.00, original_price: 600.00, category: 'Sunglasses', image: 'https://images.unsplash.com/photo-1577803645773-f96470509666?w=1200&q=80&auto=format', featured: 1, rating: 4.6 },
        { name: 'Titanium Wayfarers', description: 'Lightweight titanium frames with gradient lenses. Japanese craftsmanship.', price: 650.00, original_price: 750.00, category: 'Sunglasses', image: 'https://images.unsplash.com/photo-1574258495973-f010dfbb5371?w=1200&q=80&auto=format', featured: 0, rating: 4.8 },
        { name: 'Round Wire Frames', description: 'Retro round frames with rose-gold wire. Vintage sophistication.', price: 420.00, original_price: 480.00, category: 'Sunglasses', image: 'https://images.unsplash.com/photo-1473496169904-658ba7c44d8a?w=1200&q=80&auto=format', featured: 0, rating: 4.5 },

        // CLOTHING - Premium
        { name: 'Cashmere Overcoat', description: 'Double-breasted overcoat in pure Italian cashmere. Fully lined.', price: 3499.99, original_price: 4000.00, category: 'Clothing', image: 'https://images.unsplash.com/photo-1544022613-e87ca75a784a?w=1200&q=80&auto=format', featured: 0, rating: 4.8 },
        { name: 'Leather Biker Jacket', description: 'Signature quilted leather jacket with asymmetric zip and belt.', price: 5200.00, original_price: 5800.00, category: 'Clothing', image: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=1200&q=80&auto=format', featured: 0, rating: 4.7 },
        { name: 'Silk Blouse Ivory', description: 'Pure silk crepe de chine blouse with mother-of-pearl buttons.', price: 595.00, original_price: 695.00, category: 'Clothing', image: 'https://images.unsplash.com/photo-1485462537746-965f33f7f6a7?w=1200&q=80&auto=format', featured: 0, rating: 4.6 },
        { name: 'Merino Wool Sweater', description: 'Extra-fine merino wool crew neck. Italian knit, multiple colors.', price: 395.00, original_price: 450.00, category: 'Clothing', image: 'https://images.unsplash.com/photo-1614975058789-41316d0e2e9c?w=1200&q=80&auto=format', featured: 0, rating: 4.5 },

        // ACCESSORIES
        { name: 'Silk Scarf Carré', description: 'Hand-rolled silk twill scarf with exclusive artistic print. 90cm square.', price: 435.00, original_price: 495.00, category: 'Accessories', image: 'https://images.unsplash.com/photo-1584589167171-541ce45f1eea?w=1200&q=80&auto=format', featured: 0, rating: 4.6 },
        { name: 'Leather Card Holder', description: 'Grained calfskin card holder with gold-tone logo. 4 card slots.', price: 295.00, original_price: 350.00, category: 'Accessories', image: 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=1200&q=80&auto=format', featured: 0, rating: 4.4 },
        { name: 'Leather Belt Reversible', description: 'Reversible leather belt with palladium H buckle. Black and brown.', price: 890.00, original_price: 980.00, category: 'Accessories', image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=1200&q=80&auto=format', featured: 1, rating: 4.7 },
        { name: 'Cashmere Scarf', description: 'Oversized cashmere scarf in classic check pattern. Made in Scotland.', price: 650.00, original_price: 750.00, category: 'Accessories', image: 'https://images.unsplash.com/photo-1598532163257-ae3c6b2524b6?w=1200&q=80&auto=format', featured: 0, rating: 4.8 },
        { name: 'Leather Gloves Silk-Lined', description: 'Supple lambskin gloves with silk lining. Elegant winter essential.', price: 285.00, original_price: 340.00, category: 'Accessories', image: 'https://images.unsplash.com/photo-1643650374762-196c86358df3?w=1200&q=80&auto=format', featured: 0, rating: 4.5 },

        // MEN'S FASHION
        { name: 'Italian Dress Shirt', description: 'Premium cotton poplin dress shirt with French cuffs. Made in Milano.', price: 295.00, original_price: 350.00, category: 'Men', image: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=1200&q=80&auto=format', featured: 1, rating: 4.7 },
        { name: 'Polo Ralph Lauren Classic', description: 'Iconic mesh polo shirt with embroidered pony. 100% cotton piqué.', price: 125.00, original_price: 150.00, category: 'Men', image: 'https://images.unsplash.com/photo-1604006853105-d44ea6e146ef?w=1200&q=80&auto=format', featured: 0, rating: 4.6 },
        { name: 'Designer Slim Jeans', description: 'Japanese selvedge denim jeans with slim fit. Raw indigo wash.', price: 450.00, original_price: 520.00, category: 'Men', image: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=1200&q=80&auto=format', featured: 0, rating: 4.5 },
        { name: 'Leather Bomber Jacket', description: 'Butter-soft lambskin bomber with ribbed cuffs. Fully lined.', price: 1899.00, original_price: 2200.00, category: 'Men', image: 'https://images.unsplash.com/photo-1520975954732-35dd22299614?w=1200&q=80&auto=format', featured: 1, rating: 4.8 },
        { name: 'Cashmere V-Neck Sweater', description: 'Pure cashmere V-neck in charcoal grey. Scottish heritage craft.', price: 495.00, original_price: 595.00, category: 'Men', image: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=1200&q=80&auto=format', featured: 0, rating: 4.7 },
        { name: 'Formal Trousers Wool', description: 'Tailored wool trousers with pressed crease. Italian craftsmanship.', price: 350.00, original_price: 420.00, category: 'Men', image: 'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=1200&q=80&auto=format', featured: 0, rating: 4.6 },

        // MEN'S SHOES
        { name: 'Luxury Sneakers White', description: 'Minimalist white leather sneakers with gold accent. Italian made.', price: 595.00, original_price: 695.00, category: 'Men', image: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=1200&q=80&auto=format', featured: 1, rating: 4.8 },
        { name: 'Monk Strap Shoes', description: 'Hand-burnished leather double monk straps. Goodyear welted.', price: 850.00, original_price: 950.00, category: 'Men', image: 'https://images.unsplash.com/photo-1560343090-f0409e92791a?w=1200&q=80&auto=format', featured: 0, rating: 4.7 },
        { name: 'High-Top Designer Sneakers', description: 'Premium leather high-tops with signature logo. Street luxury.', price: 890.00, original_price: 1050.00, category: 'Men', image: 'https://images.unsplash.com/photo-1600269452121-4f2416e55c28?w=1200&q=80&auto=format', featured: 0, rating: 4.6 },

        // MEN'S COLOGNE
        { name: 'Bleu de Cologne', description: 'Aromatic woody fragrance with cedar, sandalwood and mint. 100ml EDT.', price: 155.00, original_price: 185.00, category: 'Men', image: 'https://images.unsplash.com/photo-1563170351-be82bc888aa4?w=1200&q=80&auto=format', featured: 1, rating: 4.8 },
        { name: 'Sauvage Intense', description: 'Raw masculine scent with bergamot, pepper and ambroxan. 100ml EDP.', price: 175.00, original_price: 210.00, category: 'Men', image: 'https://images.unsplash.com/photo-1747916147834-afe35b0d95ac?w=1200&q=80&auto=format', featured: 0, rating: 4.9 },
        { name: 'Aventus Creed', description: 'Legendary fragrance with pineapple, birch and musk. 100ml parfum.', price: 445.00, original_price: 520.00, category: 'Men', image: 'https://images.unsplash.com/photo-1557170334-a9632e77c6e4?w=1200&q=80&auto=format', featured: 1, rating: 5.0 },
        { name: 'Tobacco Vanille', description: 'Rich blend of tobacco leaf, vanilla and spices. Unisex luxury.', price: 395.00, original_price: 450.00, category: 'Men', image: 'https://images.unsplash.com/photo-1638295916768-459f6cf440bc?w=1200&q=80&auto=format', featured: 0, rating: 4.8 },

        // MEN'S SUNGLASSES
        { name: 'Clubmaster Classic', description: 'Iconic browline sunglasses with metal rim. Timeless style.', price: 195.00, original_price: 230.00, category: 'Men', image: 'https://images.unsplash.com/photo-1508296695146-257a814070b4?w=1200&q=80&auto=format', featured: 0, rating: 4.6 },
        { name: 'Sport Wraparound', description: 'Aerodynamic sport frames with polarized lenses. UV400 protection.', price: 320.00, original_price: 380.00, category: 'Men', image: 'https://images.unsplash.com/photo-1556306535-0f09a537f0a3?w=1200&q=80&auto=format', featured: 0, rating: 4.5 },
        { name: 'Pilot Navigator', description: 'Classic pilot frames in matte black with grey gradient lenses.', price: 285.00, original_price: 340.00, category: 'Men', image: 'https://images.unsplash.com/photo-1509695507497-903c140c43b0?w=1200&q=80&auto=format', featured: 1, rating: 4.7 },

        // ELECTRONICS - Premium Tech
        { name: 'Wireless ANC Headphones', description: 'Premium noise-cancelling headphones with 30-hour battery. Hi-Res Audio certified.', price: 449.00, original_price: 520.00, category: 'Electronics', image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=1200&q=80&auto=format', featured: 1, rating: 4.8 },
        { name: 'Smart Watch Ultra', description: 'Titanium smartwatch with GPS, cellular, and advanced health tracking.', price: 799.00, original_price: 899.00, category: 'Electronics', image: 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=1200&q=80&auto=format', featured: 1, rating: 4.9 },
        { name: 'Wireless Earbuds Pro', description: 'True wireless earbuds with spatial audio and active noise cancellation.', price: 249.00, original_price: 299.00, category: 'Electronics', image: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=1200&q=80&auto=format', featured: 0, rating: 4.7 },
        { name: 'Portable Speaker Premium', description: 'Waterproof Bluetooth speaker with 24-hour playtime. 360° sound.', price: 199.00, original_price: 249.00, category: 'Electronics', image: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=1200&q=80&auto=format', featured: 0, rating: 4.6 },
        { name: 'Mechanical Keyboard RGB', description: 'Premium mechanical keyboard with hot-swappable switches. Aluminum frame.', price: 179.00, original_price: 219.00, category: 'Electronics', image: 'https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?w=1200&q=80&auto=format', featured: 0, rating: 4.5 },
        { name: 'Wireless Charging Pad', description: 'Fast wireless charger with 15W output. Compatible with all Qi devices.', price: 79.00, original_price: 99.00, category: 'Electronics', image: 'https://images.unsplash.com/photo-1591290619618-904f6dd935e3?w=1200&q=80&auto=format', featured: 0, rating: 4.4 },
        { name: 'Action Camera 4K', description: 'Waterproof action camera with 4K60 video and HyperSmooth stabilization.', price: 399.00, original_price: 449.00, category: 'Electronics', image: 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=1200&q=80&auto=format', featured: 1, rating: 4.8 },
        { name: 'E-Reader Premium', description: 'High-resolution e-ink display with warm light. Waterproof design.', price: 289.00, original_price: 349.00, category: 'Electronics', image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=1200&q=80&auto=format', featured: 0, rating: 4.7 },

        // HOME DECOR - Luxury
        { name: 'Crystal Chandelier', description: 'Hand-cut crystal chandelier with 12 lights. French design.', price: 2899.00, original_price: 3400.00, category: 'Home', image: 'https://images.unsplash.com/photo-1543198126-a8ad8e47fb22?w=1200&q=80&auto=format', featured: 1, rating: 4.9 },
        { name: 'Velvet Sofa Set', description: 'Three-seater velvet sofa in emerald green. Solid oak frame.', price: 3499.00, original_price: 4200.00, category: 'Home', image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=1200&q=80&auto=format', featured: 1, rating: 4.8 },
        { name: 'Marble Coffee Table', description: 'Italian Carrara marble top with brass legs. Statement piece.', price: 1299.00, original_price: 1500.00, category: 'Home', image: 'https://images.unsplash.com/photo-1533090481720-856c6e3c1fdc?w=1200&q=80&auto=format', featured: 0, rating: 4.7 },
        { name: 'Silk Throw Pillows Set', description: 'Set of 4 handwoven silk pillows with gold embroidery.', price: 349.00, original_price: 420.00, category: 'Home', image: 'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?w=1200&q=80&auto=format', featured: 0, rating: 4.5 },
        { name: 'Persian Rug Vintage', description: 'Handwoven Persian rug with traditional motifs. 8x10 feet.', price: 4599.00, original_price: 5500.00, category: 'Home', image: 'https://images.unsplash.com/photo-1600166898405-da9535204843?w=1200&q=80&auto=format', featured: 1, rating: 4.9 },
        { name: 'Table Lamp Crystal', description: 'Crystal base table lamp with silk shade. Art deco design.', price: 449.00, original_price: 520.00, category: 'Home', image: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=1200&q=80&auto=format', featured: 0, rating: 4.6 },
        { name: 'Wall Art Canvas Set', description: 'Set of 3 abstract canvas prints with gold leaf accents.', price: 599.00, original_price: 720.00, category: 'Home', image: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=1200&q=80&auto=format', featured: 0, rating: 4.5 },

        // FITNESS - Premium Equipment
        { name: 'Smart Fitness Tracker', description: 'Advanced fitness band with heart rate, SpO2, and sleep tracking.', price: 149.00, original_price: 189.00, category: 'Fitness', image: 'https://images.unsplash.com/photo-1575311373937-040b8e1fd5b6?w=1200&q=80&auto=format', featured: 1, rating: 4.7 },
        { name: 'Yoga Mat Premium', description: 'Extra-thick natural rubber yoga mat with alignment lines.', price: 89.00, original_price: 110.00, category: 'Fitness', image: 'https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=1200&q=80&auto=format', featured: 0, rating: 4.6 },
        { name: 'Adjustable Dumbbells Set', description: 'Space-saving adjustable dumbbells 5-52.5 lbs each.', price: 449.00, original_price: 549.00, category: 'Fitness', image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1200&q=80&auto=format', featured: 1, rating: 4.8 },
        { name: 'Running Shoes Elite', description: 'Carbon fiber plate running shoes with responsive foam.', price: 275.00, original_price: 320.00, category: 'Fitness', image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=1200&q=80&auto=format', featured: 0, rating: 4.7 },
        { name: 'Resistance Bands Pro Set', description: 'Professional resistance bands with handles. 5 resistance levels.', price: 59.00, original_price: 79.00, category: 'Fitness', image: 'https://images.unsplash.com/photo-1598289431512-b97b0917affc?w=1200&q=80&auto=format', featured: 0, rating: 4.5 },

        // WOMEN'S FASHION
        { name: 'Designer Handbag Crossbody', description: 'Quilted leather crossbody with chain strap. Italian craftsmanship.', price: 1250.00, original_price: 1450.00, category: 'Women', image: 'https://images.unsplash.com/photo-1546333456-3e8ed81f41e2?w=1200&q=80&auto=format', featured: 1, rating: 4.8 },
        { name: 'Cashmere Cardigan', description: 'Oversized cashmere cardigan in cream. Button front.', price: 495.00, original_price: 595.00, category: 'Women', image: 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=1200&q=80&auto=format', featured: 0, rating: 4.6 },
        { name: 'Silk Camisole Top', description: 'Pure silk camisole with lace trim. French design.', price: 195.00, original_price: 240.00, category: 'Women', image: 'https://images.unsplash.com/photo-1770294758971-44fa1eae61a3?w=1200&q=80&auto=format', featured: 0, rating: 4.5 },
        { name: 'Wide Leg Trousers', description: 'High-waisted wide leg trousers in navy wool blend.', price: 295.00, original_price: 350.00, category: 'Women', image: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=1200&q=80&auto=format', featured: 0, rating: 4.6 },
        { name: 'Block Heel Sandals', description: 'Leather block heel sandals with ankle strap. 3-inch heel.', price: 395.00, original_price: 450.00, category: 'Women', image: 'https://images.unsplash.com/photo-1770757685000-c80e45122986?w=1200&q=80&auto=format', featured: 1, rating: 4.7 },
        { name: 'Statement Earrings Gold', description: 'Oversized gold-plated drop earrings with geometric design.', price: 145.00, original_price: 180.00, category: 'Women', image: 'https://images.unsplash.com/photo-1553926297-57bb350c4f08?w=1200&q=80&auto=format', featured: 0, rating: 4.5 },
        { name: 'Trench Coat Classic', description: 'Double-breasted trench coat in camel. Water-resistant cotton.', price: 899.00, original_price: 1050.00, category: 'Women', image: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=1200&q=80&auto=format', featured: 1, rating: 4.8 },
        { name: 'Ballet Flats Leather', description: 'Soft leather ballet flats with bow detail. Cushioned insole.', price: 295.00, original_price: 350.00, category: 'Women', image: 'https://images.unsplash.com/photo-1519415943484-9fa1873496d4?w=1200&q=80&auto=format', featured: 0, rating: 4.6 },

        // KIDS - Premium
        { name: 'Kids Cashmere Sweater', description: 'Soft cashmere crew neck for children. Available ages 4-12.', price: 145.00, original_price: 180.00, category: 'Kids', image: 'https://images.unsplash.com/photo-1503919545889-aef636e10ad4?w=1200&q=80&auto=format', featured: 0, rating: 4.7 },
        { name: 'Kids Designer Sneakers', description: 'Premium leather sneakers for kids with velcro closure.', price: 195.00, original_price: 240.00, category: 'Kids', image: 'https://images.unsplash.com/photo-1725271741207-b727541e983e?w=1200&q=80&auto=format', featured: 1, rating: 4.6 },
        { name: 'Kids Party Dress', description: 'Tulle party dress with sequin bodice. Sizes 3-10.', price: 175.00, original_price: 210.00, category: 'Kids', image: 'https://images.unsplash.com/photo-1518831959646-742c3a14ebf7?w=1200&q=80&auto=format', featured: 0, rating: 4.5 },
        { name: 'Kids Smart Watch', description: 'GPS tracking smartwatch for kids with calling features.', price: 129.00, original_price: 159.00, category: 'Kids', image: 'https://images.unsplash.com/photo-1617043786394-f977fa12eddf?w=1200&q=80&auto=format', featured: 1, rating: 4.7 },

        // BEAUTY - Premium
        { name: 'Luxury Skincare Set', description: 'Complete skincare routine with serum, moisturizer, and eye cream.', price: 399.00, original_price: 480.00, category: 'Beauty', image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=1200&q=80&auto=format', featured: 1, rating: 4.8 },
        { name: 'Makeup Palette Deluxe', description: '24-shade eyeshadow palette with mix of matte and shimmer.', price: 75.00, original_price: 95.00, category: 'Beauty', image: 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=1200&q=80&auto=format', featured: 0, rating: 4.6 },
        { name: 'Hair Styling Tools Set', description: 'Professional hair dryer, straightener, and curling wand set.', price: 349.00, original_price: 420.00, category: 'Beauty', image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=1200&q=80&auto=format', featured: 0, rating: 4.7 },
        { name: 'Luxury Bath Set', description: 'Bath bombs, oils, and salts in premium gift packaging.', price: 129.00, original_price: 160.00, category: 'Beauty', image: 'https://images.unsplash.com/photo-1547793548-7a0e7dfdb24f?w=1200&q=80&auto=format', featured: 0, rating: 4.5 }
    ];

    products.forEach(product => {
        db.run(`
            INSERT INTO products (name, description, price, original_price, category, image, featured, rating)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [product.name, product.description, product.price, product.original_price, product.category, product.image, product.featured, product.rating], function (err) {
            if (!err) console.log(`✓ Created product: ${product.name}`);
        });
    });

    // Seed Reviews
    setTimeout(() => {
        const reviews = [
            { product_id: 1, user_id: 2, username: 'peter', rating: 5, comment: 'Absolutely stunning watch! The craftsmanship is impeccable.' },
            { product_id: 1, user_id: 3, username: 'mj', rating: 5, comment: 'Worth every penny. Keeps perfect time.' },
            { product_id: 2, user_id: 2, username: 'peter', rating: 5, comment: 'A true grail piece. The blue dial is mesmerizing.' },
            { product_id: 4, user_id: 3, username: 'mj', rating: 5, comment: 'The leather quality is outstanding!' },
            { product_id: 5, user_id: 2, username: 'peter', rating: 4, comment: 'Classic design, very happy with purchase.' },
            { product_id: 7, user_id: 3, username: 'mj', rating: 5, comment: 'Beautiful bracelet, goes with everything.' },
            { product_id: 8, user_id: 2, username: 'peter', rating: 5, comment: 'The diamonds sparkle beautifully!' },
            { product_id: 10, user_id: 3, username: 'mj', rating: 5, comment: 'So elegant and comfortable to wear.' },
            { product_id: 14, user_id: 2, username: 'peter', rating: 5, comment: 'Perfect for special occasions!' }
        ];

        reviews.forEach(review => {
            db.run(`
                INSERT INTO reviews (product_id, user_id, username, rating, comment)
                VALUES (?, ?, ?, ?, ?)
            `, [review.product_id, review.user_id, review.username, review.rating, review.comment]);
        });
        console.log(`✓ Created ${reviews.length} reviews`);

        // Seed Orders - 4-9 orders per user
        const orders = [
            // Admin orders (user_id: 1) - 5 orders
            { user_id: 1, total: 89999.99, status: 'delivered', shipping_address: '123 Admin Street, New York, NY 10001', payment_method: 'credit_card', card_last_four: '9012', items: JSON.stringify([{ product_id: 2, name: 'Nautilus Platinum', quantity: 1, price: 89999.99 }]), tracking_number: 'LUX-2024-001001' },
            { user_id: 1, total: 12999.99, status: 'delivered', shipping_address: '123 Admin Street, New York, NY 10001', payment_method: 'credit_card', card_last_four: '9012', items: JSON.stringify([{ product_id: 8, name: 'Diamond Tennis Bracelet', quantity: 1, price: 12999.99 }]), tracking_number: 'LUX-2024-001002' },
            { user_id: 1, total: 5200.00, status: 'shipped', shipping_address: '123 Admin Street, New York, NY 10001', payment_method: 'credit_card', card_last_four: '9012', items: JSON.stringify([{ product_id: 15, name: 'Leather Biker Jacket', quantity: 1, price: 5200.00 }]), tracking_number: 'LUX-2024-001003' },
            { user_id: 1, total: 3499.99, status: 'processing', shipping_address: '123 Admin Street, New York, NY 10001', payment_method: 'credit_card', card_last_four: '9012', items: JSON.stringify([{ product_id: 13, name: 'Cashmere Overcoat', quantity: 1, price: 3499.99 }]), tracking_number: 'LUX-2024-001004' },
            { user_id: 1, total: 450.00, status: 'pending', shipping_address: '123 Admin Street, New York, NY 10001', payment_method: 'credit_card', card_last_four: '9012', items: JSON.stringify([{ product_id: 16, name: 'Aviator Sunglasses', quantity: 1, price: 450.00 }]), tracking_number: 'LUX-2024-001005' },

            // John's orders (user_id: 2) - 7 orders
            { user_id: 2, total: 24999.99, status: 'delivered', shipping_address: '456 Oak Avenue, Los Angeles, CA 90001', payment_method: 'credit_card', card_last_four: '1098', items: JSON.stringify([{ product_id: 1, name: 'Royal Oak Chronograph', quantity: 1, price: 24999.99 }]), tracking_number: 'LUX-2024-001234' },
            { user_id: 2, total: 8999.99, status: 'delivered', shipping_address: '456 Oak Avenue, Los Angeles, CA 90001', payment_method: 'credit_card', card_last_four: '1098', items: JSON.stringify([{ product_id: 5, name: 'Classic Flap Medium', quantity: 1, price: 8999.99 }]), tracking_number: 'LUX-2024-001235' },
            { user_id: 2, total: 38999.99, status: 'delivered', shipping_address: '456 Oak Avenue, Los Angeles, CA 90001', payment_method: 'credit_card', card_last_four: '1098', items: JSON.stringify([{ product_id: 3, name: 'Submariner Gold', quantity: 1, price: 38999.99 }]), tracking_number: 'LUX-2024-001240' },
            { user_id: 2, total: 795.00, status: 'shipped', shipping_address: '456 Oak Avenue, Los Angeles, CA 90001', payment_method: 'credit_card', card_last_four: '1098', items: JSON.stringify([{ product_id: 10, name: 'Red Bottom Pumps', quantity: 1, price: 795.00 }]), tracking_number: 'LUX-2024-001241' },
            { user_id: 2, total: 599.99, status: 'shipped', shipping_address: '456 Oak Avenue, Los Angeles, CA 90001', payment_method: 'credit_card', card_last_four: '1098', items: JSON.stringify([{ product_id: 12, name: 'Chelsea Suede Boots', quantity: 1, price: 599.99 }]), tracking_number: 'LUX-2024-001242' },
            { user_id: 2, total: 4999.99, status: 'processing', shipping_address: '456 Oak Avenue, Los Angeles, CA 90001', payment_method: 'credit_card', card_last_four: '1098', items: JSON.stringify([{ product_id: 9, name: 'Pearl Strand Necklace', quantity: 1, price: 4999.99 }]), tracking_number: 'LUX-2024-001243' },
            { user_id: 2, total: 1050.00, status: 'pending', shipping_address: '456 Oak Avenue, Los Angeles, CA 90001', payment_method: 'credit_card', card_last_four: '1098', items: JSON.stringify([{ product_id: 11, name: 'Triple S Sneakers', quantity: 1, price: 1050.00 }]), tracking_number: 'LUX-2024-001244' },

            // Jane's orders (user_id: 3) - 6 orders
            { user_id: 3, total: 15999.99, status: 'delivered', shipping_address: '789 Maple Drive, Chicago, IL 60601', payment_method: 'credit_card', card_last_four: '7777', items: JSON.stringify([{ product_id: 4, name: 'Birkin 35 Togo', quantity: 1, price: 15999.99 }]), tracking_number: 'LUX-2024-001236' },
            { user_id: 3, total: 7450.00, status: 'delivered', shipping_address: '789 Maple Drive, Chicago, IL 60601', payment_method: 'credit_card', card_last_four: '7777', items: JSON.stringify([{ product_id: 7, name: 'Love Bracelet Rose Gold', quantity: 1, price: 7450.00 }]), tracking_number: 'LUX-2024-001237' },
            { user_id: 3, total: 2899.99, status: 'delivered', shipping_address: '789 Maple Drive, Chicago, IL 60601', payment_method: 'credit_card', card_last_four: '7777', items: JSON.stringify([{ product_id: 14, name: 'Silk Evening Gown', quantity: 1, price: 2899.99 }]), tracking_number: 'LUX-2024-001250' },
            { user_id: 3, total: 435.00, status: 'shipped', shipping_address: '789 Maple Drive, Chicago, IL 60601', payment_method: 'credit_card', card_last_four: '7777', items: JSON.stringify([{ product_id: 17, name: 'Silk Scarf Carré', quantity: 1, price: 435.00 }]), tracking_number: 'LUX-2024-001251' },
            { user_id: 3, total: 1999.99, status: 'processing', shipping_address: '789 Maple Drive, Chicago, IL 60601', payment_method: 'credit_card', card_last_four: '7777', items: JSON.stringify([{ product_id: 6, name: 'Neverfull MM', quantity: 1, price: 1999.99 }]), tracking_number: 'LUX-2024-001252' },
            { user_id: 3, total: 295.00, status: 'pending', shipping_address: '789 Maple Drive, Chicago, IL 60601', payment_method: 'credit_card', card_last_four: '7777', items: JSON.stringify([{ product_id: 18, name: 'Leather Card Holder', quantity: 1, price: 295.00 }]), tracking_number: 'LUX-2024-001253' },

            // Demo user orders (user_id: 4) - 5 orders
            { user_id: 4, total: 1999.99, status: 'delivered', shipping_address: '321 Demo Lane, San Francisco, CA 94102', payment_method: 'credit_card', card_last_four: '3333', items: JSON.stringify([{ product_id: 6, name: 'Neverfull MM', quantity: 1, price: 1999.99 }]), tracking_number: 'LUX-2024-001238' },
            { user_id: 4, total: 450.00, status: 'delivered', shipping_address: '321 Demo Lane, San Francisco, CA 94102', payment_method: 'credit_card', card_last_four: '3333', items: JSON.stringify([{ product_id: 16, name: 'Aviator Sunglasses', quantity: 1, price: 450.00 }]), tracking_number: 'LUX-2024-001260' },
            { user_id: 4, total: 24999.99, status: 'shipped', shipping_address: '321 Demo Lane, San Francisco, CA 94102', payment_method: 'credit_card', card_last_four: '3333', items: JSON.stringify([{ product_id: 1, name: 'Royal Oak Chronograph', quantity: 1, price: 24999.99 }]), tracking_number: 'LUX-2024-001261' },
            { user_id: 4, total: 7450.00, status: 'processing', shipping_address: '321 Demo Lane, San Francisco, CA 94102', payment_method: 'credit_card', card_last_four: '3333', items: JSON.stringify([{ product_id: 7, name: 'Love Bracelet Rose Gold', quantity: 1, price: 7450.00 }]), tracking_number: 'LUX-2024-001262' },
            { user_id: 4, total: 795.00, status: 'pending', shipping_address: '321 Demo Lane, San Francisco, CA 94102', payment_method: 'credit_card', card_last_four: '3333', items: JSON.stringify([{ product_id: 10, name: 'Red Bottom Pumps', quantity: 1, price: 795.00 }]), tracking_number: 'LUX-2024-001263' },

            // Madhu's orders (user_id: 5) - 4 orders
            { user_id: 5, total: 34999.99, status: 'delivered', shipping_address: '88 Brigade Road, Bangalore, KA 560001', payment_method: 'credit_card', card_last_four: '4456', items: JSON.stringify([{ product_id: 4, name: 'Daytona Cosmograph', quantity: 1, price: 34999.99 }]), tracking_number: 'LUX-2024-001300' },
            { user_id: 5, total: 4500.00, status: 'delivered', shipping_address: '88 Brigade Road, Bangalore, KA 560001', payment_method: 'credit_card', card_last_four: '4456', items: JSON.stringify([{ product_id: 19, name: 'Bespoke Wool Suit', quantity: 1, price: 4500.00 }]), tracking_number: 'LUX-2024-001301' },
            { user_id: 5, total: 799.00, status: 'shipped', shipping_address: '88 Brigade Road, Bangalore, KA 560001', payment_method: 'credit_card', card_last_four: '4456', items: JSON.stringify([{ product_id: 38, name: 'Smart Watch Ultra', quantity: 1, price: 799.00 }]), tracking_number: 'LUX-2024-001302' },
            { user_id: 5, total: 450.00, status: 'pending', shipping_address: '88 Brigade Road, Bangalore, KA 560001', payment_method: 'credit_card', card_last_four: '4456', items: JSON.stringify([{ product_id: 27, name: 'Oud Royal Parfum', quantity: 1, price: 450.00 }]), tracking_number: 'LUX-2024-001303' },

            // Deepak's orders (user_id: 6) - 5 orders
            { user_id: 6, total: 12500.00, status: 'delivered', shipping_address: '45 MG Road, Pune, MH 411001', payment_method: 'credit_card', card_last_four: '2289', items: JSON.stringify([{ product_id: 5, name: 'Santos de Cartier', quantity: 1, price: 12500.00 }]), tracking_number: 'LUX-2024-001310' },
            { user_id: 6, total: 1899.00, status: 'delivered', shipping_address: '45 MG Road, Pune, MH 411001', payment_method: 'credit_card', card_last_four: '2289', items: JSON.stringify([{ product_id: 48, name: 'Leather Bomber Jacket', quantity: 1, price: 1899.00 }]), tracking_number: 'LUX-2024-001311' },
            { user_id: 6, total: 449.00, status: 'shipped', shipping_address: '45 MG Road, Pune, MH 411001', payment_method: 'credit_card', card_last_four: '2289', items: JSON.stringify([{ product_id: 37, name: 'Wireless ANC Headphones', quantity: 1, price: 449.00 }]), tracking_number: 'LUX-2024-001312' },
            { user_id: 6, total: 595.00, status: 'processing', shipping_address: '45 MG Road, Pune, MH 411001', payment_method: 'credit_card', card_last_four: '2289', items: JSON.stringify([{ product_id: 44, name: 'Luxury Sneakers White', quantity: 1, price: 595.00 }]), tracking_number: 'LUX-2024-001313' },
            { user_id: 6, total: 155.00, status: 'pending', shipping_address: '45 MG Road, Pune, MH 411001', payment_method: 'credit_card', card_last_four: '2289', items: JSON.stringify([{ product_id: 50, name: 'Bleu de Cologne', quantity: 1, price: 155.00 }]), tracking_number: 'LUX-2024-001314' },

            // Sumanth's orders (user_id: 7) - 4 orders
            { user_id: 7, total: 18500.00, status: 'delivered', shipping_address: '12 Jubilee Hills, Hyderabad, TS 500033', payment_method: 'credit_card', card_last_four: '7741', items: JSON.stringify([{ product_id: 10, name: 'Panthère de Cartier Ring', quantity: 1, price: 18500.00 }]), tracking_number: 'LUX-2024-001320' },
            { user_id: 7, total: 3200.00, status: 'delivered', shipping_address: '12 Jubilee Hills, Hyderabad, TS 500033', payment_method: 'credit_card', card_last_four: '7741', items: JSON.stringify([{ product_id: 20, name: 'Tuxedo Midnight Blue', quantity: 1, price: 3200.00 }]), tracking_number: 'LUX-2024-001321' },
            { user_id: 7, total: 550.00, status: 'shipped', shipping_address: '12 Jubilee Hills, Hyderabad, TS 500033', payment_method: 'credit_card', card_last_four: '7741', items: JSON.stringify([{ product_id: 30, name: 'Bois Précieux', quantity: 1, price: 550.00 }]), tracking_number: 'LUX-2024-001322' },
            { user_id: 7, total: 650.00, status: 'pending', shipping_address: '12 Jubilee Hills, Hyderabad, TS 500033', payment_method: 'credit_card', card_last_four: '7741', items: JSON.stringify([{ product_id: 34, name: 'Titanium Wayfarers', quantity: 1, price: 650.00 }]), tracking_number: 'LUX-2024-001323' }
        ];

        orders.forEach(order => {
            db.run(`
                INSERT INTO orders (user_id, total, status, shipping_address, payment_method, card_last_four, items, tracking_number)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `, [order.user_id, order.total, order.status, order.shipping_address, order.payment_method, order.card_last_four, order.items, order.tracking_number]);
        });
        console.log(`✓ Created ${orders.length} orders`);

        // Seed Gift Cards for Peter, Madhu, and Sumanth
        const giftCards = [
            // Peter's gift cards (user_id: 2)
            { user_id: 2, code: 'LUXE-GC-PK-2024-4781', balance: 50.00, original_amount: 50.00, status: 'active', expiry_date: '2027-06-30' },
            { user_id: 2, code: 'LUXE-GC-PK-2024-9203', balance: 125.50, original_amount: 200.00, status: 'active', expiry_date: '2027-12-31' },
            // Madhu's gift cards (user_id: 5)
            { user_id: 5, code: 'LUXE-GC-MK-2025-6637', balance: 500.00, original_amount: 500.00, status: 'active', expiry_date: '2027-09-15' },
            { user_id: 5, code: 'LUXE-GC-MK-2024-1155', balance: 0.00, original_amount: 100.00, status: 'redeemed', expiry_date: '2026-03-01' },
            { user_id: 5, code: 'LUXE-GC-MK-2025-8842', balance: 1000.00, original_amount: 1000.00, status: 'active', expiry_date: '2028-01-31' },
            // Sumanth's gift cards (user_id: 7)
            { user_id: 7, code: 'LUXE-GC-SR-2025-3319', balance: 250.00, original_amount: 250.00, status: 'active', expiry_date: '2027-11-30' },
            { user_id: 7, code: 'LUXE-GC-SR-2024-7760', balance: 0.00, original_amount: 75.00, status: 'expired', expiry_date: '2025-12-31' }
        ];

        giftCards.forEach(gc => {
            db.run(`
                INSERT INTO gift_cards (user_id, code, balance, original_amount, status, expiry_date)
                VALUES (?, ?, ?, ?, ?, ?)
            `, [gc.user_id, gc.code, gc.balance, gc.original_amount, gc.status, gc.expiry_date]);
        });
        console.log(`✓ Created ${giftCards.length} gift cards`);

        console.log('\n✅ Database seeded successfully!');
        console.log('\n📋 Test Accounts:');
        console.log('   Admin:  admin / admin123');
        console.log('   User:   peter / camera');
        console.log('   User:   mj / MJ123');
        console.log('   User:   jjj / spiderman');
        console.log('   User:   madhu / X#9kL!vQ2$mZ&pW7');
        console.log('   User:   deepak / deepak2024');
        console.log('   User:   sumanth / 48291637502');

        db.close();
    }, 500);
});
