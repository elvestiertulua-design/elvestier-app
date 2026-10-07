const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
  page.on('requestfailed', request => console.log('REQUEST FAILED:', request.url(), request.failure().errorText));

  await page.goto('http://localhost:3000/', { waitUntil: 'networkidle2' });
  
  // Try to log in
  await page.type('input[type="password"]', '1234');
  await page.click('button[type="submit"]');

  await new Promise(r => setTimeout(r, 4000));

  await browser.close();
})();
