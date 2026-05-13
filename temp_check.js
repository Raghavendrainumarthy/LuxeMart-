const https = require('https');

const candidateUrl = 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=500';

const req = https.get(candidateUrl, (res) => {
    console.log(`Status: ${res.statusCode}`);
    if (res.statusCode >= 200 && res.statusCode < 400) {
        console.log('Image is valid!');
    } else {
        console.log('Image is broken/redirected loop');
    }
});

req.on('error', (e) => {
    console.error(e);
});
