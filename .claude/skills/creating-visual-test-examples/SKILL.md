---
name: creating-visual-test-examples
path: examples/next/visual-tests/**
description: Use when adding or changing a demo the visual regression suite photographs - the Vite-based demo apps in examples/next/visual-tests/<framework>/demo/, the js Navigo router with one /<feature>-demo route per feature, the shared / grid that must stay identical across frameworks, and the sample-data patterns
---

# Creating Visual Test Examples

This skill covers the demo apps the visual regression suite (`visual-tests/`) renders: `examples/next/visual-tests/{js,react-wrapper,vue3,angular-wrapper}/demo/`, served on port 8082 by `visual-tests/scripts/run-tests.mjs`. The documentation examples in `examples/next/docs/` are a different tree with a different purpose — the `creating-docs-examples` skill owns it, and nothing in the visual suite serves it. Both trees have a `demo/` directory, which is why the wrong path never looked wrong.

## Decision rule

A new feature gets its own `/<feature>-demo` route on the js demo's router, never a change to the shared `/` demo. A screenshot proves pixels only, so the visual spec that photographs the route is in addition to, never instead of a Playwright assertion in `tests/e2e`. The paragraph, the measured numbers, and the wrapper-coverage trade-off are `visual-tests/AGENTS.md` → Decision rule.

## Example Location

The js demo is one Vite app with a Navigo router (`examples/next/visual-tests/js/demo/src/index.js`): `/` renders the shared multi-feature grid (`src/demos/default/`), and each feature has a `/<name>-demo` route backed by a `src/demos/<name>/` module (27 routes on 2026-09-18). The wrapper demos serve `/` only, plus `/scenario-grid` in `react-wrapper` and `angular-wrapper` (the `vue3` demo has no router).

## Directory Structure

```
examples/next/visual-tests/js/demo/
  index.html          # Minimal HTML: <div id="root"> and a script tag
  package.json        # Dependencies (handsontable, navigo, vite)
  vite.config.js      # Vite build configuration
  LICENSE.txt         # License file
  src/
    index.js          # The Navigo router: `/` plus one `/<name>-demo` route per feature
    data.js           # Shared sample data
    utils.js          # URL helpers (theme, direction, per-route params)
    demos/
      default/        # The shared `/` grid — frozen; the multi-frameworks specs photograph it
      <name>/         # One module per feature route, exporting `init()`
    styles/           # `styles.css` for `/`, `<name>-demo.css` for a route that needs one
  spec/
    Smoke.spec.js     # Puppeteer smoke test
```

## How to Add a Feature Route

**1. Create the module.** `src/demos/<feature>/index.js` exports `init()`, which builds the grid inside `#root` (the existing modules show the shape; `src/demos/dialog/` is a small one). Read per-route options from the URL through `getFromURL()` in `src/utils.js`, so one route serves several visual states without a second route.

**2. Register the route.** In `src/index.js`, import the module and add `'/<feature>-demo'` next to the existing entries: `removeCSS()`, load the route's stylesheet (if any) and the theme through `loadThemeCSS()`, then call `init()`.

**3. Import from `handsontable/base` and register explicitly** where the module needs only part of the library. Do not use the full bundle for a new route:

```js
import Handsontable from 'handsontable/base';
import { registerPlugin, ContextMenu, Filters } from 'handsontable/plugins';
import { registerCellType, NumericCellType } from 'handsontable/cellTypes';

registerPlugin(ContextMenu);
registerPlugin(Filters);
registerCellType(NumericCellType);
```

**4. Write the visual spec** under `visual-tests/tests/js-only/<feature>/`, navigating with `goto(helpers.setBaseUrl('/<feature>-demo').getFullUrl())` — the `visual-testing` skill has the pattern, and the decision rule says what earns a capture.

**5. Decide wrapper coverage out loud.** A route exists on the js demo only, so the spec is js-only by construction. If the feature must be photographed under a wrapper, either extend `/` — every spec that photographs it re-captures on every variant, the change is declared with `[visual budget: N – reason]` in the pull request body, and the config must be mirrored in all four demos — or add the route to `react-wrapper/demo/src/index.tsx`, `angular-wrapper/demo/src/app/app.config.ts`, and the Vue demo (which has no router today). That is a per-framework change, not a Navigo edit. `visual-tests/AGENTS.md` → Decision rule states the trade-off.

## The Shared `/` Grid

`/` combines several features in one grid (column sorting + filters + dropdown menu + hidden columns + context menu, …) so they are photographed together, and the wrapper demos render the same grid. It is frozen: any change to its config that affects rendering (cell types, `dateFormat`, `locale`, formatting, data) must be mirrored in all three wrapper demos, or the js-copied baseline gotcha (`visual-tests/AGENTS.md`, Golden snapshots) turns it into a red nightly. Do not add features to it.

## Sample Data, License, Container

- **Use comprehensive, realistic sample data.** Extract it into a data module (`src/data.js` is shared; a route can carry its own `data.js`). Use domain-appropriate content (company names, dates, currencies, countries) rather than placeholder strings, and enough rows (20-50+) to exercise scrolling.
- **Always include `licenseKey: 'non-commercial-and-evaluation'`.**
- **Mount inside `#root`** from `index.html`; a route module appends its own container to it.

## Smoke Test

Every framework demo has a smoke test in `spec/Smoke.spec.js`. It launches Puppeteer, navigates to the dev server, and asserts that the grid rendered:

```js
it('should render Handsontable', async () => {
  const hotCell = await page.$('.handsontable td');
  await expect(hotCell).toBeTruthy();
});
```

Use `process.env.TEST_URL || 'http://localhost:8080'` as the base URL.

## Key Reference

See `examples/next/visual-tests/js/demo/src/demos/default/index.js` for the shared grid (individual plugin and cell-type registration, column types, several features together, helper-generated data) and `src/demos/dialog/` for a small single-feature route driven by URL parameters.
