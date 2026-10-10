# Where's Daddy Pancake

A sprawling illustrated pancake coast, more than five times the previous search area. Explore the harbour, beach, seaside market, dune gardens, fairground, and picnic meadow. Daddy and eleven family members are scattered across all six areas among similarly dressed beachgoers.

- Scroll or drag in every direction. Arrow keys pan; plus and minus zoom.
- The key shows close-ups from the actual artwork, so every portrait matches a findable character.
- Use the overview map to jump to another part of the coast. Hide the key or map any time.
- Click the character itself to cross their name off the key. Nearby people do not count.
- A ring appears only after a real find. Find all twelve to finish.
- Progress, zoom, and panel preferences stay in this browser. Clear finds to play again.

The map contains 4480 × 1984 pixels of new artwork and occupies a 13440 × 5952 scrolling world at 100% zoom. Zoom out to see the whole coast, or zoom in to compare faces. The map opens at the harbour rather than showing the entire search area at once.

The site is static: serve this directory with any HTTP server. The existing GitHub Pages workflow publishes `main`.

## Checking changes

Run `npm ci`, then `npx playwright install chromium` and `npm test`. To use an installed Chromium, run `CHROMIUM_PATH=/path/to/chromium npm test`. The browser checks cover desktop and mobile viewport sizes, complete map rendering, all twelve finds, neighboring misses, saved progress, zoom restoration, completion, resetting, minimap navigation, keyboard panning, dragging, and zooming out to the whole world.

## Updating the illustration

Six `assets/map-*.jpg` illustrations each measure 1536 × 1024 pixels. Every character is already painted into its area's illustration. The browser draws the neighboring areas once onto one canvas, blending their empty sandy margins over a 64-pixel overlap. The overview uses that same finished picture. There are no independent character overlays.

`MAP_TILES` in `game.js` sets the area layout. `TARGETS` uses coordinates in the complete 4480 × 1984 picture: `x`/`y` is the character's center, `w`/`h` describes its bounds, and `tile` selects the original illustration for its portrait crop. These values drive matching portraits, elliptical click areas, and found rings. After changing artwork or positions, measure the characters again and bump `SCENE_VERSION` and the saved-state key. Update the overview aspect ratio if the overall map shape changes.

The previous scene and individual PNG portraits are retained as reference assets.
