const ejs = require('ejs');
const fs = require('fs');
const path = require('path');

const addressesTemplate = fs.readFileSync('views/profile-addresses.ejs', 'utf-8');

try {
  const html = ejs.render(addressesTemplate, {
      user: { id: 1, full_name: 'Test', address: 'Test Addr' },
      addresses: [
          { id: 1, label: 'HOME', full_name: 'Test', address_line: '123 Main St', phone: '1234567890', is_default: 1 }
      ],
      title: 'Manage Addresses - LuxeMart',
      activePage: 'addresses',
      hostHeader: 'localhost',
      path: '/profile/addresses',
      cartCount: 0,
      cart: []
  }, { filename: 'views/profile-addresses.ejs' });
  console.log('Rendered successfully');
} catch (e) {
  console.error("EJS Error Message:", e.message);
}
