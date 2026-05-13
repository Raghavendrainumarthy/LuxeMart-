const http = require('http');

function req(method, path, body, cookie) {
    return new Promise((resolve, reject) => {
        const opts = { hostname: 'localhost', port: 3000, path, method, headers: { 'Content-Type': 'application/json' } };
        if (cookie) opts.headers.Cookie = cookie;
        const r = http.request(opts, resp => {
            let data = '';
            resp.on('data', c => data += c);
            resp.on('end', () => resolve({ status: resp.statusCode, headers: resp.headers, body: data }));
        });
        r.on('error', reject);
        if (body) r.write(JSON.stringify(body));
        r.end();
    });
}

async function test() {
    // Login
    const login = await req('POST', '/api/login', { username: 'Peter', password: 'camera' });
    if (!login.headers['set-cookie']) {
        console.log('Login failed');
        return;
    }
    const cookie = login.headers['set-cookie'][0].split(';')[0];
    console.log('Logged in as Peter');

    // Get the profile page
    const page = await req('GET', '/user/profile', null, cookie);
    console.log('Profile page status:', page.status);

    // Check for user ID in href URLs (should be NONE)
    const hrefMatches = page.body.match(/href=["']\/user\/profile\/\d+/g);
    console.log('User ID in href URLs:', hrefMatches || 'NONE (clean URLs!)');

    // Check for API calls with userId (should be present - this is the IDOR vector)
    const apiMatches = page.body.match(/api\/user\/profile\?userId=\d+/g);
    console.log('API calls with userId param (Network tab):', apiMatches || 'NONE');

    // Verify the IDOR API endpoint works
    const api1 = await req('GET', '/api/user/profile?userId=2', null, cookie);
    const api2 = await req('GET', '/api/user/profile?userId=3', null, cookie);
    console.log('IDOR test - userId=2:', api1.status, JSON.parse(api1.body).username);
    console.log('IDOR test - userId=3:', api2.status, JSON.parse(api2.body).username);
}

test().catch(console.error);
