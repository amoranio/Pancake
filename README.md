# Where's Daddy Pancake

Explore one continuous illustrated pancake coast. The harbour, beach, market, dune gardens, fairground, and picnic meadow flow into one another through shared paths, vegetation, and crowds. The whole scene uses a common perspective and character scale, without separate framed panels.

Daddy and eleven family members are painted into the crowd, with similar hats, scarves, and outfits to make you look twice.

- Scroll or drag in every direction. Arrow keys pan; plus and minus zoom.
- The key shows close-ups from the actual artwork, so every portrait matches a findable character.
- Use the overview map to jump to another part of the coast. Hide the key or map any time.
- Click the character itself to cross their name off the key. Nearby people do not count.
- A ring appears only after a real find. Find all twelve to finish.
- Progress, zoom, and panel preferences stay in this browser. Clear finds to play again.

The expanded scrolling world remains 13440 pixels wide at 100% zoom. Zoom out to see the whole coast, or zoom in to compare faces. The map opens at the harbour rather than showing the entire search area at once.

The site is static: serve this directory with any HTTP server. The existing GitHub Pages workflow publishes `main`.

## Checking changes

Run `npm ci`, then `npx playwright install chromium` and `npm test`. To use an installed Chromium, run `CHROMIUM_PATH=/path/to/chromium npm test`. Browser checks cover desktop and mobile viewport sizes, complete artwork rendering, the expanded scrolling area, matching portraits, all twelve finds, neighboring misses, saved progress, zoom restoration, completion, resetting, overview navigation, keyboard panning, mouse-wheel scrolling, dragging, and zooming out to the whole world.

## Updating the illustration

`assets/coast.jpg` is the complete continuous illustration, including every character. The browser draws it onto one canvas; the overview copies that same picture, and the key crops the same asset. The game does not blend independent scenes or overlay character sprites.

`IMG_W` and `IMG_H` in `game.js` match the artwork's native pixel dimensions. `SCALE` preserves the large scrolling world. `TARGETS` uses native pixel coordinates: `x`/`y` is the character's center and `w`/`h` describes its bounds. Those values drive matching portraits, elliptical click areas, and found rings. `MAP_AREAS` contains normalized landmark centers for the location label, without imposing visible boundaries on the illustration.

After changing the artwork or positions, measure the characters again and bump `SCENE_VERSION` and the saved-state key. Update the overview aspect ratio if the picture shape changes. Earlier map and portrait assets are retained for reference.
