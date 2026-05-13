const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database', 'luxemart.db');
const db = new sqlite3.Database(dbPath);

console.log('🖼️  Updating product images to reliable URLs...\n');

// Category-based image mapping using picsum.photos (reliable placeholder service)
const categoryImages = {
    'Watches': [
        'https://picsum.photos/seed/watch1/500/500',
        'https://picsum.photos/seed/watch2/500/500',
        'https://picsum.photos/seed/watch3/500/500',
        'https://picsum.photos/seed/watch4/500/500',
        'https://picsum.photos/seed/watch5/500/500'
    ],
    'Bags': [
        'https://picsum.photos/seed/bag1/500/500',
        'https://picsum.photos/seed/bag2/500/500',
        'https://picsum.photos/seed/bag3/500/500',
        'https://picsum.photos/seed/bag4/500/500',
        'https://picsum.photos/seed/bag5/500/500'
    ],
    'Jewelry': [
        'https://picsum.photos/seed/jewelry1/500/500',
        'https://picsum.photos/seed/jewelry2/500/500',
        'https://picsum.photos/seed/jewelry3/500/500',
        'https://picsum.photos/seed/jewelry4/500/500',
        'https://picsum.photos/seed/jewelry5/500/500'
    ],
    'Shoes': [
        'https://picsum.photos/seed/shoes1/500/500',
        'https://picsum.photos/seed/shoes2/500/500',
        'https://picsum.photos/seed/shoes3/500/500',
        'https://picsum.photos/seed/shoes4/500/500',
        'https://picsum.photos/seed/shoes5/500/500',
        'https://picsum.photos/seed/shoes6/500/500',
        'https://picsum.photos/seed/shoes7/500/500'
    ],
    'Suits': [
        'https://picsum.photos/seed/suit1/500/500',
        'https://picsum.photos/seed/suit2/500/500',
        'https://picsum.photos/seed/suit3/500/500',
        'https://picsum.photos/seed/suit4/500/500',
        'https://picsum.photos/seed/suit5/500/500'
    ],
    'Dresses': [
        'https://picsum.photos/seed/dress1/500/500',
        'https://picsum.photos/seed/dress2/500/500',
        'https://picsum.photos/seed/dress3/500/500',
        'https://picsum.photos/seed/dress4/500/500',
        'https://picsum.photos/seed/dress5/500/500',
        'https://picsum.photos/seed/dress6/500/500'
    ],
    'Perfumes': [
        'https://picsum.photos/seed/perfume1/500/500',
        'https://picsum.photos/seed/perfume2/500/500',
        'https://picsum.photos/seed/perfume3/500/500',
        'https://picsum.photos/seed/perfume4/500/500',
        'https://picsum.photos/seed/perfume5/500/500',
        'https://picsum.photos/seed/perfume6/500/500'
    ],
    'Sunglasses': [
        'https://picsum.photos/seed/sunglasses1/500/500',
        'https://picsum.photos/seed/sunglasses2/500/500',
        'https://picsum.photos/seed/sunglasses3/500/500',
        'https://picsum.photos/seed/sunglasses4/500/500',
        'https://picsum.photos/seed/sunglasses5/500/500'
    ],
    'Clothing': [
        'https://picsum.photos/seed/clothing1/500/500',
        'https://picsum.photos/seed/clothing2/500/500',
        'https://picsum.photos/seed/clothing3/500/500',
        'https://picsum.photos/seed/clothing4/500/500'
    ],
    'Accessories': [
        'https://picsum.photos/seed/accessory1/500/500',
        'https://picsum.photos/seed/accessory2/500/500',
        'https://picsum.photos/seed/accessory3/500/500',
        'https://picsum.photos/seed/accessory4/500/500',
        'https://picsum.photos/seed/accessory5/500/500'
    ],
    'Men': [
        'https://picsum.photos/seed/men1/500/500',
        'https://picsum.photos/seed/men2/500/500',
        'https://picsum.photos/seed/men3/500/500',
        'https://picsum.photos/seed/men4/500/500',
        'https://picsum.photos/seed/men5/500/500',
        'https://picsum.photos/seed/men6/500/500',
        'https://picsum.photos/seed/men7/500/500',
        'https://picsum.photos/seed/men8/500/500',
        'https://picsum.photos/seed/men9/500/500',
        'https://picsum.photos/seed/men10/500/500',
        'https://picsum.photos/seed/men11/500/500',
        'https://picsum.photos/seed/men12/500/500',
        'https://picsum.photos/seed/men13/500/500'
    ],
    'Electronics': [
        'https://picsum.photos/seed/electronics1/500/500',
        'https://picsum.photos/seed/electronics2/500/500',
        'https://picsum.photos/seed/electronics3/500/500',
        'https://picsum.photos/seed/electronics4/500/500',
        'https://picsum.photos/seed/electronics5/500/500',
        'https://picsum.photos/seed/electronics6/500/500',
        'https://picsum.photos/seed/electronics7/500/500',
        'https://picsum.photos/seed/electronics8/500/500'
    ],
    'Home': [
        'https://picsum.photos/seed/home1/500/500',
        'https://picsum.photos/seed/home2/500/500',
        'https://picsum.photos/seed/home3/500/500',
        'https://picsum.photos/seed/home4/500/500',
        'https://picsum.photos/seed/home5/500/500',
        'https://picsum.photos/seed/home6/500/500',
        'https://picsum.photos/seed/home7/500/500'
    ],
    'Fitness': [
        'https://picsum.photos/seed/fitness1/500/500',
        'https://picsum.photos/seed/fitness2/500/500',
        'https://picsum.photos/seed/fitness3/500/500',
        'https://picsum.photos/seed/fitness4/500/500',
        'https://picsum.photos/seed/fitness5/500/500'
    ],
    'Women': [
        'https://picsum.photos/seed/women1/500/500',
        'https://picsum.photos/seed/women2/500/500',
        'https://picsum.photos/seed/women3/500/500',
        'https://picsum.photos/seed/women4/500/500',
        'https://picsum.photos/seed/women5/500/500',
        'https://picsum.photos/seed/women6/500/500',
        'https://picsum.photos/seed/women7/500/500',
        'https://picsum.photos/seed/women8/500/500'
    ],
    'Kids': [
        'https://picsum.photos/seed/kids1/500/500',
        'https://picsum.photos/seed/kids2/500/500',
        'https://picsum.photos/seed/kids3/500/500',
        'https://picsum.photos/seed/kids4/500/500'
    ],
    'Beauty': [
        'https://picsum.photos/seed/beauty1/500/500',
        'https://picsum.photos/seed/beauty2/500/500',
        'https://picsum.photos/seed/beauty3/500/500',
        'https://picsum.photos/seed/beauty4/500/500'
    ]
};

// Track usage per category
const categoryCounter = {};

db.all('SELECT id, name, category FROM products ORDER BY id', [], (err, products) => {
    if (err) {
        console.error('Error fetching products:', err);
        return;
    }

    let updated = 0;
    const total = products.length;

    products.forEach((product, index) => {
        const category = product.category;

        // Initialize counter for this category
        if (!categoryCounter[category]) {
            categoryCounter[category] = 0;
        }

        // Get image array for category, or use a default
        const images = categoryImages[category] || ['https://picsum.photos/seed/product' + product.id + '/500/500'];

        // Get image using modulo to cycle through available images
        const imageIndex = categoryCounter[category] % images.length;
        const newImage = images[imageIndex];
        categoryCounter[category]++;

        // Update the product image
        db.run('UPDATE products SET image = ? WHERE id = ?', [newImage, product.id], (err) => {
            if (err) {
                console.error(`Error updating ${product.name}:`, err);
            } else {
                updated++;
                console.log(`✓ Updated: ${product.name} -> ${category}`);
            }

            // Check if all done
            if (index === total - 1) {
                setTimeout(() => {
                    console.log(`\n✅ Updated ${updated}/${total} product images!`);
                    db.close();
                }, 100);
            }
        });
    });
});
