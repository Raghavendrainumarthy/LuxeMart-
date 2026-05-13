const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database/luxemart.db');

// Carefully curated image URLs that match each product name
const imageMap = {
    // WATCHES
    1: 'https://images.unsplash.com/photo-1587836374828-4dbafa94cf0e?w=500', // Royal Oak Chronograph
    2: 'https://images.unsplash.com/photo-1523170335258-f5ed11844a49?w=500', // Nautilus Platinum
    3: 'https://images.unsplash.com/photo-1547996160-81dfa63595aa?w=500', // Submariner Gold
    4: 'https://images.unsplash.com/photo-1614164185128-e4ec99c436d7?w=500', // Daytona Cosmograph
    5: 'https://images.unsplash.com/photo-1622434641406-a158123450f9?w=500', // Santos de Cartier

    // BAGS
    6: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=500', // Birkin 35 Togo
    7: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=500', // Classic Flap Medium
    8: 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=500', // Neverfull MM
    9: 'https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?w=500', // Kelly Sellier 28
    10: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500', // Speedy Bandoulière 30

    // JEWELRY
    11: 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=500', // Love Bracelet Rose Gold
    12: 'https://images.unsplash.com/photo-1515562141589-67f0d1acd94b?w=500', // Diamond Tennis Bracelet
    13: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=500', // Pearl Strand Necklace
    14: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=500', // Panthère de Cartier Ring
    15: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=500', // Tiffany Victoria Earrings

    // SHOES
    16: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=500', // Red Bottom Pumps
    17: 'https://images.unsplash.com/photo-1552346154-21d32810aba3?w=500', // Triple S Sneakers
    18: 'https://images.unsplash.com/photo-1638247025967-b4e38f787b76?w=500', // Chelsea Suede Boots
    19: 'https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?w=500', // Oxford Brogues Premium
    20: 'https://images.unsplash.com/photo-1582897085656-c636d006a246?w=500', // Velvet Loafers
    21: 'https://images.unsplash.com/photo-1596703263926-eb0762f17adb?w=500', // Stiletto Sandals Crystal
    22: 'https://images.unsplash.com/photo-1533867617858-e7b97e060509?w=500', // Leather Derby Shoes

    // SUITS
    23: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=500', // Bespoke Wool Suit
    24: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=500', // Tuxedo Midnight Blue
    25: 'https://images.unsplash.com/photo-1593030761757-71fae45fa0e7?w=500', // Linen Summer Suit
    26: 'https://images.unsplash.com/photo-1598808503746-f34c53b9323e?w=500', // Double-Breasted Pinstripe
    27: 'https://images.unsplash.com/photo-1592878904946-b3cd8ae243d0?w=500', // Velvet Dinner Jacket

    // DRESSES
    28: 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=500', // Silk Evening Gown
    29: 'https://images.unsplash.com/photo-1596783074918-c84cb06531ca?w=500', // Sequin Cocktail Dress
    30: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=500', // Cashmere Wrap Dress
    31: 'https://images.unsplash.com/photo-1518657422908-c09e7dee5c72?w=500', // Embroidered Ball Gown
    32: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=500', // Lace Midi Dress
    33: 'https://images.unsplash.com/photo-1612336307429-8a898d10e223?w=500', // Velvet Maxi Dress

    // PERFUMES
    34: 'https://images.unsplash.com/photo-1541643600914-78b084683601?w=500', // Oud Royal Parfum
    35: 'https://images.unsplash.com/photo-1523293182086-7651a899d37f?w=500', // Noir Absolu
    36: 'https://images.unsplash.com/photo-1588405748880-12d1d2a59f75?w=500', // Fleur de Luxe
    37: 'https://images.unsplash.com/photo-1594035910387-fea47794261f?w=500', // Bois Précieux
    38: 'https://images.unsplash.com/photo-1595425964272-fc617fa53a32?w=500', // Aqua di Mare
    39: 'https://images.unsplash.com/photo-1587017539504-67cfbddac569?w=500', // Rose Imperiale

    // SUNGLASSES
    40: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=500', // Aviator Sunglasses
    41: 'https://images.unsplash.com/photo-1577803645773-f96470509666?w=500', // Cat-Eye Acetate
    42: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=500', // Oversized Square
    43: 'https://images.unsplash.com/photo-1508296695146-257a814070b4?w=500', // Titanium Wayfarers
    44: 'https://images.unsplash.com/photo-1574258495973-f010dfbb5371?w=500', // Round Wire Frames

    // CLOTHING
    45: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=500', // Cashmere Overcoat
    46: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=500', // Leather Biker Jacket
    47: 'https://images.unsplash.com/photo-1598554747436-c9293d6a588f?w=500', // Silk Blouse Ivory
    48: 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=500', // Merino Wool Sweater

    // ACCESSORIES
    49: 'https://images.unsplash.com/photo-1606760227091-3dd870d97f1d?w=500', // Silk Scarf Carré
    50: 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=500', // Leather Card Holder
    51: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500', // Leather Belt Reversible
    52: 'https://images.unsplash.com/photo-1601924921557-45e8e0db4b28?w=500', // Cashmere Scarf
    53: 'https://images.unsplash.com/photo-1585487000160-6ebcfceb0d44?w=500', // Leather Gloves Silk-Lined

    // MEN'S FASHION
    54: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=500', // Italian Dress Shirt
    55: 'https://images.unsplash.com/photo-1625910513413-5fc42e44e48e?w=500', // Polo Ralph Lauren Classic
    56: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=500', // Designer Slim Jeans
    57: 'https://images.unsplash.com/photo-1520975954732-35dd22299614?w=500', // Leather Bomber Jacket
    58: 'https://images.unsplash.com/photo-1578587018452-892bacefd3f2?w=500', // Cashmere V-Neck Sweater
    59: 'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=500', // Formal Trousers Wool
    60: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=500', // Luxury Sneakers White
    61: 'https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?w=500', // Monk Strap Shoes
    62: 'https://images.unsplash.com/photo-1600269452121-4f2416e55c28?w=500', // High-Top Designer Sneakers

    // MEN'S COLOGNE
    63: 'https://images.unsplash.com/photo-1594035910387-fea47794261f?w=500', // Bleu de Cologne
    64: 'https://images.unsplash.com/photo-1523293182086-7651a899d37f?w=500', // Sauvage Intense
    65: 'https://images.unsplash.com/photo-1541643600914-78b084683601?w=500', // Aventus Creed
    66: 'https://images.unsplash.com/photo-1587017539504-67cfbddac569?w=500', // Tobacco Vanille

    // MEN'S SUNGLASSES
    67: 'https://images.unsplash.com/photo-1508296695146-257a814070b4?w=500', // Clubmaster Classic
    68: 'https://images.unsplash.com/photo-1574258495973-f010dfbb5371?w=500', // Sport Wraparound
    69: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=500', // Pilot Navigator

    // ELECTRONICS
    70: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500', // Wireless ANC Headphones
    71: 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=500', // Smart Watch Ultra
    72: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=500', // Wireless Earbuds Pro
    73: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=500', // Portable Speaker Premium
    74: 'https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?w=500', // Mechanical Keyboard RGB
    75: 'https://images.unsplash.com/photo-1622445272461-c6580cab8755?w=500', // Wireless Charging Pad
    76: 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=500', // Action Camera 4K
    77: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500', // E-Reader Premium

    // HOME DECOR
    78: 'https://images.unsplash.com/photo-1543198126-a8ad8e47fb22?w=500', // Crystal Chandelier
    79: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=500', // Velvet Sofa Set
    80: 'https://images.unsplash.com/photo-1533090481720-856c6e3c1fdc?w=500', // Marble Coffee Table
    81: 'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?w=500', // Silk Throw Pillows Set
    82: 'https://images.unsplash.com/photo-1600166898405-da9535204843?w=500', // Persian Rug Vintage
    83: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=500', // Table Lamp Crystal
    84: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=500', // Wall Art Canvas Set

    // FITNESS
    85: 'https://images.unsplash.com/photo-1576243345690-4e4b79b63288?w=500', // Smart Fitness Tracker
    86: 'https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=500', // Yoga Mat Premium
    87: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=500', // Adjustable Dumbbells Set
    88: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500', // Running Shoes Elite
    89: 'https://images.unsplash.com/photo-1598289431512-b97b0917affc?w=500', // Resistance Bands Pro Set

    // WOMEN
    90: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=500', // Designer Handbag Crossbody
    91: 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=500', // Cashmere Cardigan
    92: 'https://images.unsplash.com/photo-1485462537746-965f33f7f6a7?w=500', // Silk Camisole Top
    93: 'https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=500', // Wide Leg Trousers
    94: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=500', // Block Heel Sandals
    95: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=500', // Statement Earrings Gold
    96: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=500', // Trench Coat Classic
    97: 'https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?w=500', // Ballet Flats Leather

    // KIDS
    98: 'https://images.unsplash.com/photo-1503919545889-aef636e10ad4?w=500', // Kids Cashmere Sweater
    99: 'https://images.unsplash.com/photo-1514989940723-e8e51635b782?w=500', // Kids Designer Sneakers
    100: 'https://images.unsplash.com/photo-1518831959646-742c3a14ebf7?w=500', // Kids Party Dress
    101: 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=500', // Kids Smart Watch

    // BEAUTY
    102: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=500', // Luxury Skincare Set
    103: 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=500', // Makeup Palette Deluxe
    104: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=500', // Hair Styling Tools Set
    105: 'https://images.unsplash.com/photo-1507652313519-d4e9174996dd?w=500', // Luxury Bath Set
};

let done = 0;
const total = Object.keys(imageMap).length;

Object.entries(imageMap).forEach(([id, url]) => {
    db.run('UPDATE products SET image = ? WHERE id = ?', [url, parseInt(id)], (err) => {
        done++;
        if (err) console.log(`ERROR id=${id}: ${err.message}`);
        if (done === total) {
            console.log(`✅ Updated all ${total} product images!`);
            db.close();
        }
    });
});
