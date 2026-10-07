# Browser regression checks

From the repository root:

```sh
npm install --no-save --package-lock=false playwright
npx playwright install chromium
node tests/browser.cjs
```

The script serves the site locally and checks phone portrait, small phone,
phone landscape, tablet, and desktop viewports. It covers entry and gallery
layout, touch target bounds, comparison dragging, settings visibility, Back,
music, and matching quality images and selection icons after scene changes.
It also simulates out-of-order image loads and closing during a pending load.

Set `BROWSER_EXECUTABLE` to use an installed Chromium browser instead.
Optionally set `SNAPSHOT_DIR` to an existing directory to save screenshots.
