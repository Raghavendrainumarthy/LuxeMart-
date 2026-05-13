// Quick script to test all product image URLs
const https = require('https');
const http = require('http');

const imageUrls = [
    { name: 'Royal Oak Chronograph', url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500' },
    { name: 'Nautilus Platinum', url: 'https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=500' },
    { name: 'Submariner Gold', url: 'https://images.unsplash.com/photo-1547996160-81dfa63595aa?w=500' },
    { name: 'Daytona Cosmograph', url: 'https://images.unsplash.com/photo-1526045431048-f857369baa09?w=500' },
    { name: 'Santos de Cartier', url: 'https://images.unsplash.com/photo-1522312346375-d1a52e2b99b3?w=500' },
    { name: 'Birkin 35 Togo', url: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=500' },
    { name: 'Classic Flap Medium', url: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=500' },
    { name: 'Neverfull MM', url: 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=500' },
    { name: 'Kelly Sellier 28', url: 'https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?w=500' },
    { name: 'Speedy Bandoulière 30', url: 'https://images.unsplash.com/photo-1594223274512-ad4803739b7c?w=500' },
    { name: 'Love Bracelet Rose Gold', url: 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=500' },
    { name: 'Diamond Tennis Bracelet', url: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=500' },
    { name: 'Pearl Strand Necklace', url: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=500' },
    { name: 'Panthère de Cartier Ring', url: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=500' },
    { name: 'Tiffany Victoria Earrings', url: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=500' },
    { name: 'Red Bottom Pumps', url: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=500' },
    { name: 'Triple S Sneakers', url: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=500' },
    { name: 'Chelsea Suede Boots', url: 'https://images.unsplash.com/photo-1638247025967-b4e38f787b76?w=500' },
    { name: 'Oxford Brogues Premium', url: 'https://images.unsplash.com/photo-1614252369475-531eba835eb1?w=500' },
    { name: 'Velvet Loafers', url: 'https://images.unsplash.com/photo-1533867617858-e7b97e060509?w=500' },
    { name: 'Stiletto Sandals Crystal', url: 'https://images.unsplash.com/photo-1596703263926-eb0762ee17e4?w=500' },
    { name: 'Leather Derby Shoes', url: 'https://images.unsplash.com/photo-1449505278894-297fdb3edbc1?w=500' },
    { name: 'Bespoke Wool Suit', url: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=500' },
    { name: 'Tuxedo Midnight Blue', url: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=500' },
    { name: 'Linen Summer Suit', url: 'https://images.unsplash.com/photo-1593030761757-71fae45fa0e7?w=500' },
    { name: 'Double-Breasted Pinstripe', url: 'https://images.unsplash.com/photo-1617127365659-c47fa864d8bc?w=500' },
    { name: 'Velvet Dinner Jacket', url: 'https://images.unsplash.com/photo-1592878904946-b3cd8ae243d0?w=500' },
    { name: 'Silk Evening Gown', url: 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=500' },
    { name: 'Sequin Cocktail Dress', url: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=500' },
    { name: 'Cashmere Wrap Dress', url: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=500' },
    { name: 'Embroidered Ball Gown', url: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=500' },
    { name: 'Lace Midi Dress', url: 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=500' },
    { name: 'Velvet Maxi Dress', url: 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=500' },
    { name: 'Oud Royal Parfum', url: 'https://images.unsplash.com/photo-1541643600914-78b084683601?w=500' },
    { name: 'Noir Absolu', url: 'https://images.unsplash.com/photo-1523293182086-7651a899d37f?w=500' },
    { name: 'Fleur de Luxe', url: 'https://images.unsplash.com/photo-1588405748880-12d1d2a59f75?w=500' },
    { name: 'Bois Précieux', url: 'https://images.unsplash.com/photo-1594035910387-fea47794261f?w=500' },
    { name: 'Aqua di Mare', url: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=500' },
    { name: 'Rose Imperiale', url: 'https://images.unsplash.com/photo-1587017539504-67cfbddac569?w=500' },
    { name: 'Aviator Sunglasses', url: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=500' },
    { name: 'Cat-Eye Acetate', url: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=500' },
    { name: 'Oversized Square', url: 'https://images.unsplash.com/photo-1577803645773-f96470509666?w=500' },
    { name: 'Titanium Wayfarers', url: 'https://images.unsplash.com/photo-1574258495973-f010dfbb5371?w=500' },
    { name: 'Round Wire Frames', url: 'https://images.unsplash.com/photo-1473496169904-658ba7c44d8a?w=500' },
    { name: 'Cashmere Overcoat', url: 'https://images.unsplash.com/photo-1544022613-e87ca75a784a?w=500' },
    { name: 'Leather Biker Jacket', url: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=500' },
    { name: 'Silk Blouse Ivory', url: 'https://images.unsplash.com/photo-1485462537746-965f33f7f6a7?w=500' },
    { name: 'Merino Wool Sweater', url: 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=500' },
    { name: 'Silk Scarf Carré', url: 'https://images.unsplash.com/photo-1584589167171-541ce45f1eea?w=500' },
    { name: 'Leather Card Holder', url: 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=500' },
    { name: 'Leather Belt Reversible', url: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500' },
    { name: 'Cashmere Scarf', url: 'https://images.unsplash.com/photo-1520903920243-00d872a2d1c9?w=500' },
    { name: 'Leather Gloves Silk-Lined', url: 'https://images.unsplash.com/photo-1531079567472-8a771c1e00d0?w=500' },
    { name: 'Italian Dress Shirt', url: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=500' },
    { name: 'Polo Ralph Lauren Classic', url: 'https://images.unsplash.com/photo-1625910513413-5fc42e44e48e?w=500' },
    { name: 'Designer Slim Jeans', url: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=500' },
    { name: 'Leather Bomber Jacket', url: 'https://images.unsplash.com/photo-1520975954732-35dd22299614?w=500' },
    { name: 'Cashmere V-Neck Sweater', url: 'https://images.unsplash.com/photo-1578587018452-892bacefd3f2?w=500' },
    { name: 'Formal Trousers Wool', url: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=500' },
    { name: 'Luxury Sneakers White', url: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=500' },
    { name: 'Monk Strap Shoes', url: 'https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?w=500' },
    { name: 'High-Top Designer Sneakers', url: 'https://images.unsplash.com/photo-1600269452121-4f2416e55c28?w=500' },
    { name: 'Bleu de Cologne', url: 'https://images.unsplash.com/photo-1594035910387-fea47794261f?w=500' },
    { name: 'Sauvage Intense', url: 'https://images.unsplash.com/photo-1523293182086-7651a899d37f?w=500' },
    { name: 'Aventus Creed', url: 'https://images.unsplash.com/photo-1541643600914-78b084683601?w=500' },
    { name: 'Tobacco Vanille', url: 'https://images.unsplash.com/photo-1590736969955-71cc94901144?w=500' },
    { name: 'Clubmaster Classic', url: 'https://images.unsplash.com/photo-1508296695146-257a814070b4?w=500' },
    { name: 'Sport Wraparound', url: 'https://images.unsplash.com/photo-1574258495973-f010dfbb5371?w=500' },
    { name: 'Pilot Navigator', url: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=500' },
    { name: 'Wireless ANC Headphones', url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500' },
    { name: 'Smart Watch Ultra', url: 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=500' },
    { name: 'Wireless Earbuds Pro', url: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=500' },
    { name: 'Portable Speaker Premium', url: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=500' },
    { name: 'Mechanical Keyboard RGB', url: 'https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?w=500' },
    { name: 'Wireless Charging Pad', url: 'https://images.unsplash.com/photo-1586816879360-004f5b0c51e3?w=500' },
    { name: 'Action Camera 4K', url: 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=500' },
    { name: 'E-Reader Premium', url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500' },
    { name: 'Crystal Chandelier', url: 'https://images.unsplash.com/photo-1543198126-a8ad8e47fb22?w=500' },
    { name: 'Velvet Sofa Set', url: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=500' },
    { name: 'Marble Coffee Table', url: 'https://images.unsplash.com/photo-1533090481720-856c6e3c1fdc?w=500' },
    { name: 'Silk Throw Pillows Set', url: 'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?w=500' },
    { name: 'Persian Rug Vintage', url: 'https://images.unsplash.com/photo-1600166898405-da9535204843?w=500' },
    { name: 'Table Lamp Crystal', url: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=500' },
    { name: 'Wall Art Canvas Set', url: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=500' },
    { name: 'Smart Fitness Tracker', url: 'https://images.unsplash.com/photo-1575311373937-040b8e1fd5b6?w=500' },
    { name: 'Yoga Mat Premium', url: 'https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=500' },
    { name: 'Adjustable Dumbbells Set', url: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=500' },
    { name: 'Running Shoes Elite', url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500' },
    { name: 'Resistance Bands Pro Set', url: 'https://images.unsplash.com/photo-1598289431512-b97b0917affc?w=500' },
    { name: 'Designer Handbag Crossbody', url: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=500' },
    { name: 'Cashmere Cardigan', url: 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=500' },
    { name: 'Silk Camisole Top', url: 'https://images.unsplash.com/photo-1485462537746-965f33f7f6a7?w=500' },
    { name: 'Wide Leg Trousers', url: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=500' },
    { name: 'Block Heel Sandals', url: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=500' },
    { name: 'Statement Earrings Gold', url: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=500' },
    { name: 'Trench Coat Classic', url: 'https://images.unsplash.com/photo-1544022613-e87ca75a784a?w=500' },
    { name: 'Ballet Flats Leather', url: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=500' },
    { name: 'Kids Cashmere Sweater', url: 'https://images.unsplash.com/photo-1503919545889-aef636e10ad4?w=500' },
    { name: 'Kids Designer Sneakers', url: 'https://images.unsplash.com/photo-1555274175-75f79b09d5b8?w=500' },
    { name: 'Kids Party Dress', url: 'https://images.unsplash.com/photo-1518831959646-742c3a14ebf7?w=500' },
    { name: 'Kids Smart Watch', url: 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=500' },
    { name: 'Luxury Skincare Set', url: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=500' },
    { name: 'Makeup Palette Deluxe', url: 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=500' },
    { name: 'Hair Styling Tools Set', url: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=500' },
    { name: 'Luxury Bath Set', url: 'https://images.unsplash.com/photo-1570194065650-d99fb4b38b15?w=500' },
];

// Deduplicate URLs
const uniqueUrls = new Map();
imageUrls.forEach(item => {
    if (!uniqueUrls.has(item.url)) {
        uniqueUrls.set(item.url, [item.name]);
    } else {
        uniqueUrls.get(item.url).push(item.name);
    }
});

function checkUrl(name, url) {
    return new Promise((resolve) => {
        const client = url.startsWith('https') ? https : http;
        const req = client.get(url, { timeout: 10000 }, (res) => {
            // Follow redirects
            if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                resolve({ name, url, status: res.statusCode, ok: true, redirect: res.headers.location });
            } else {
                resolve({ name, url, status: res.statusCode, ok: res.statusCode >= 200 && res.statusCode < 400 });
            }
            res.resume(); // consume response data
        });
        req.on('error', (err) => {
            resolve({ name, url, status: 'ERROR', ok: false, error: err.message });
        });
        req.on('timeout', () => {
            req.destroy();
            resolve({ name, url, status: 'TIMEOUT', ok: false });
        });
    });
}

async function main() {
    console.log(`Testing ${uniqueUrls.size} unique image URLs...\n`);

    const broken = [];
    const working = [];

    // Check in batches of 10
    const entries = Array.from(uniqueUrls.entries());
    for (let i = 0; i < entries.length; i += 10) {
        const batch = entries.slice(i, i + 10);
        const results = await Promise.all(
            batch.map(([url, names]) => checkUrl(names.join(', '), url))
        );
        results.forEach(r => {
            if (r.ok) {
                working.push(r);
            } else {
                broken.push(r);
            }
            const icon = r.ok ? '✓' : '✗';
            console.log(`${icon} [${r.status}] ${r.name}`);
        });
    }

    console.log(`\n${'='.repeat(60)}`);
    console.log(`RESULTS: ${working.length} working, ${broken.length} broken`);

    if (broken.length > 0) {
        console.log(`\nBROKEN IMAGES:`);
        broken.forEach(b => {
            const products = uniqueUrls.get(b.url);
            console.log(`  - ${products.join(', ')}: ${b.url} (${b.status} ${b.error || ''})`);
        });
    }
}

main();
