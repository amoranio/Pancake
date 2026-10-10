# Where's Daddy Pancake

One continuous illustrated beach festival. Daddy Pancake and eleven family members are painted among the crowd, with similar hats, scarves, and outfits to make you look twice. Scroll or drag to explore and zoom in to compare faces.

- The key shows close-ups from the actual scene, so every portrait matches a findable character.
- Hide the key or map any time and bring them back.
- Click the character itself to cross their name off the key. Nearby beachgoers do not count.
- A ring appears only after a real find. Find all twelve to finish.
- Progress, zoom, and panel preferences stay in this browser. Clear finds to play again.

The small map uses the same picture. The site is static: serve this directory with any HTTP server, or open `index.html` directly. The existing GitHub Pages workflow publishes `main`.

## Checking changes

Run `npm ci`, then `npx playwright install chromium` and `npm test`. To use an installed Chromium, run `CHROMIUM_PATH=/path/to/chromium npm test`. The browser checks cover desktop and mobile viewport sizes, misses, nearby clicks, all twelve finds, duplicate clicks, saved progress, zoom restoration, the win banner, and resetting.

## Updating the illustration

`assets/picture.jpg` is the complete game scene, including every character. `IMG_W`, `IMG_H`, and `TARGETS` in `game.js` use its native pixel coordinates. Each target's `x`/`y` is its center and `w`/`h` describes its painted bounds; these drive portrait crops, elliptical click areas, and found rings. After replacing the artwork, measure all twelve again and bump both the picture cache version and the saved-state key. Also update the minimap aspect ratio and the image dimensions used in the browser checks.

The older individual PNG portraits and scene assets are retained for reference; the game no longer uses them for character rendering or the key.
