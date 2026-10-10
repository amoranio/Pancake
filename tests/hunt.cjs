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
      await page.waitForFunction(() => document.querySelector('.picture').dataset.ready === 'true');
      await page.locator('#start').click();
      fs.mkdirSync(path.join(root, 'test-results'), { recursive: true });
      await page.screenshot({ path: path.join(root, 'test-results', `hunt-${size.width}.png`) });
      await page.locator('#toggle-key').click();
      await page.locator('#toggle-mini').click();
      assert.equal(await page.locator('.world .picture').count(), 1, 'One integrated scene');
      assert.equal(await page.locator('.world img, .world button').count(), 0, 'No target sprites');
      const map = await page.locator('.picture').evaluate(canvas => ({ width: canvas.width, height: canvas.height }));
      assert.ok(map.width * map.height > 1536 * 1024 * 5, 'More than five times the original search area');
      assert.equal(await page.locator('.picture').evaluate(canvas => {
        const ctx = canvas.getContext('2d');
        return [0.15, 0.5, 0.85].every(x => [0.25, 0.75].every(y =>
          ctx.getImageData(Math.floor(canvas.width * x), Math.floor(canvas.height * y), 1, 1).data[3] === 255));
      }), true, 'Artwork fills every map area');
      assert.equal(await page.locator('.key-item .scene-portrait').count(), 12);
      assert.equal(await page.locator('.ring').count(), 0, 'No target markers before finding');
      await page.locator('#zoom-in').click();
      const zoom = await page.locator('#zoom-label').textContent();

      async function clickPoint(x, y) {
        const point = await page.evaluate(({ x, y }) => {
          const world = document.querySelector('#world');
          const viewport = document.querySelector('#viewport');
          const canvas = world.querySelector('canvas');
          const scale = world.offsetWidth / canvas.width;
          viewport.scrollLeft = x * scale - viewport.clientWidth / 2;
          viewport.scrollTop = y * scale - viewport.clientHeight / 2;
          const rect = world.getBoundingClientRect();
          return { x: rect.left + x * rect.width / canvas.width, y: rect.top + y * rect.height / canvas.height };
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
      await page.waitForFunction(() => document.querySelector('.picture').dataset.ready === 'true');
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
      await page.locator('#toggle-key').click();
      await page.locator('#toggle-mini').click();
      const mini = await page.locator('#mini-shot').boundingBox();
      await page.mouse.click(mini.x + mini.width * 0.82, mini.y + mini.height * 0.78);
      await page.waitForFunction(() => document.querySelector('#where').textContent === 'The picnic meadow');
      const beforePan = await page.locator('#viewport').evaluate(node => node.scrollLeft);
      await page.locator('#viewport').focus();
      await page.keyboard.press('ArrowLeft');
      assert.ok(await page.locator('#viewport').evaluate(node => node.scrollLeft) < beforePan, 'Keyboard pans the expanded world');
      const viewport = await page.locator('#viewport').boundingBox();
      const beforeScroll = await page.locator('#viewport').evaluate(node => node.scrollTop);
      await page.mouse.move(viewport.x + viewport.width / 2, viewport.y + viewport.height / 2);
      await page.mouse.wheel(0, 120);
      await page.waitForFunction(before => document.querySelector('#viewport').scrollTop > before, beforeScroll);
      const beforeDrag = await page.locator('#viewport').evaluate(node => node.scrollLeft);
      await page.mouse.move(viewport.x + viewport.width / 2, viewport.y + viewport.height / 2);
      await page.mouse.down();
      await page.mouse.move(viewport.x + viewport.width / 2 + 80, viewport.y + viewport.height / 2, { steps: 5 });
      await page.mouse.up();
      assert.ok(await page.locator('#viewport').evaluate(node => node.scrollLeft) < beforeDrag, 'Dragging pans');
      assert.equal(await page.locator('#progress').textContent(), '0 of 12', 'Dragging does not find characters');
      await page.locator('#toggle-mini').click();
      await page.locator('#zoom-out').evaluate(button => { for (let i = 0; i < 40; i++) button.click(); });
      assert.equal(await page.locator('#viewport').evaluate(node => {
        const world = node.querySelector('#world');
        const rect = world.getBoundingClientRect();
        const viewport = node.getBoundingClientRect();
        return world.offsetWidth <= node.clientWidth + 2 && world.offsetHeight <= node.clientHeight + 2
          && node.scrollLeft === 0 && node.scrollTop === 0
          && rect.left >= viewport.left && rect.top >= viewport.top;
      }), true, 'The entire map can be viewed at minimum zoom');
      await page.screenshot({ path: path.join(root, 'test-results', `overview-${size.width}.png`) });
      await clickPoint(first.x + first.w, first.y);
      assert.equal(await page.locator('#progress').textContent(), '0 of 12', 'Overview clicks do not expand into neighbors');
      assert.deepEqual(errors, []);
      await context.close();
      console.log(`Passed hunt at ${size.width}×${size.height}`);
    }
  } finally { await browser.close(); server.close(); }
})().catch(error => { console.error(error); server.close(); process.exitCode = 1; });
