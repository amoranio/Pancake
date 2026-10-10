const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const { chromium } = require('playwright');

const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'game.js'), 'utf8');
const targets = Function('return ' + source.match(/const TARGETS = (\[[\s\S]*?\]);/)[1])();
const server = http.createServer((req, res) => {
  const file = path.join(root, new URL(req.url, 'http://localhost').pathname === '/'
    ? 'index.html' : new URL(req.url, 'http://localhost').pathname);
  if (!file.startsWith(root + path.sep)) { res.writeHead(403).end(); return; }
  fs.readFile(file, (error, data) => {
    if (error) { res.writeHead(404).end(); return; }
    const types = { '.js': 'text/javascript', '.css': 'text/css', '.jpg': 'image/jpeg', '.html': 'text/html' };
    res.setHeader('Content-Type', types[path.extname(file)] || 'application/octet-stream');
    res.end(data);
  });
});

(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const browser = await chromium.launch({ headless: true,
    ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}) });
  try {
    for (const size of [{ width: 1440, height: 1000 }, { width: 390, height: 844 }]) {
      const context = await browser.newContext({ viewport: size });
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.goto(`http://127.0.0.1:${server.address().port}`);
      await page.waitForFunction(() => document.querySelector('.picture').naturalWidth > 0);
      await page.locator('#start').click();
      fs.mkdirSync(path.join(root, 'test-results'), { recursive: true });
      await page.screenshot({ path: path.join(root, 'test-results', `hunt-${size.width}.png`) });
      await page.locator('#toggle-key').click();
      await page.locator('#toggle-mini').click();
      assert.equal(await page.locator('.world img').count(), 1, 'One integrated scene, no target sprites');
      assert.equal(await page.locator('.key-item .scene-portrait').count(), 12);
      assert.equal(await page.locator('.ring').count(), 0, 'No target markers before finding');
      await page.locator('#zoom-in').click();
      const zoom = await page.locator('#zoom-label').textContent();

      async function clickPoint(x, y) {
        const point = await page.evaluate(({ x, y }) => {
          const world = document.querySelector('#world');
          const viewport = document.querySelector('#viewport');
          const scale = world.offsetWidth / 1536;
          viewport.scrollLeft = x * scale - viewport.clientWidth / 2;
          viewport.scrollTop = y * scale - viewport.clientHeight / 2;
          const rect = world.getBoundingClientRect();
          return { x: rect.left + x * rect.width / 1536, y: rect.top + y * rect.height / 1024 };
        }, { x, y });
        await page.mouse.click(point.x, point.y);
      }
      await clickPoint(850, 55);
      assert.equal(await page.locator('#progress').textContent(), '0 of 12', 'Water misses');
      const first = targets[0];
      await clickPoint(first.x + first.w, first.y);
      assert.equal(await page.locator('#progress').textContent(), '0 of 12', 'Neighbor does not count');
      await clickPoint(first.x, first.y);
      assert.equal(await page.locator('#progress').textContent(), '1 of 12');
      await clickPoint(first.x, first.y);
      assert.equal(await page.locator('#progress').textContent(), '1 of 12', 'No duplicate finds');
      await page.waitForTimeout(300);
      await page.reload();
      await page.waitForFunction(() => document.querySelector('.picture').naturalWidth > 0);
      assert.equal(await page.locator('#progress').textContent(), '1 of 12', 'Find survives reload');
      assert.equal(await page.locator('#zoom-label').textContent(), zoom);
      assert.equal(await page.locator('.ring').count(), 1);
      for (const target of targets.slice(1)) await clickPoint(target.x, target.y);
      assert.equal(await page.locator('#progress').textContent(), '12 of 12');
      assert.equal(await page.locator('.ring').count(), 12);
      assert.equal(await page.locator('#banner').isVisible(), true, 'All twelve win');
      await page.locator('#dismiss-win').click();
      await page.locator('#toggle-key').click();
      await page.locator('#clear').click();
      assert.equal(await page.locator('#progress').textContent(), '0 of 12');
      assert.equal(await page.locator('.ring').count(), 0);
      assert.equal(await page.locator('.key-item.is-found').count(), 0);
      assert.deepEqual(errors, []);
      await context.close();
      console.log(`Passed hunt at ${size.width}×${size.height}`);
    }
  } finally { await browser.close(); server.close(); }
})().catch(error => { console.error(error); server.close(); process.exitCode = 1; });
