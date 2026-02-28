const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();

    let captureLogs = false;
    let logsCount = 0;

    page.on('console', msg => {
        const text = msg.text();
        if (text === '=== RootRedirect Debug ===') {
            captureLogs = true;
            logsCount = 0;
        }
        if (captureLogs) {
            console.log(text);
            logsCount++;
            if (logsCount > 6) {
                captureLogs = false;
            }
        }
    });

    console.log("Navigating to login...");
    await page.goto('http://localhost:3000/login');

    console.log("Typing credentials...");
    await page.waitForSelector('input[type="email"]');
    await page.type('input[type="email"]', 'admin@learnquest.com');
    await page.type('input[type="password"]', '123');

    console.log("Clicking submit...");
    await Promise.all([
        page.waitForNavigation({ waitUntil: 'networkidle0' }),
        page.click('button[type="submit"]')
    ]);

    console.log("Logged in. Navigating to root /...");
    await page.goto('http://localhost:3000/');
    await page.waitForTimeout(2000); // give it time to evaluate the redirect

    console.log("Current URL after root access:", page.url());

    await browser.close();
})();
