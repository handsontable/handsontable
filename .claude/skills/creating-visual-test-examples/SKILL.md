---
name: creating-visual-test-examples
path: examples/next/visual-tests/**
description: Use when adding or changing a demo the visual regression suite photographs - the Vite-based demo apps in examples/next/visual-tests/<framework>/demo/, the js Navigo router with one /<feature>-demo route per feature, the shared / grid that must stay identical across frameworks, and the sample-data patterns
---

# Creating Visual Test Examples

Covers the demo apps the visual suite (`visual-tests/`) renders: `examples/next/visual-tests/{js,react-wrapper,vue3,angular-wrapper}/demo/`, served on port 8082 by `visual-tests/scripts/run-tests.mjs`. The documentation examples in `examples/next/docs/` are another tree, owned by the `creating-docs-examples` skill, and the visual suite does not serve it.

## Decision rule

A new feature gets its own `/<feature>-demo` route on the js demo's router, and the shared `/` demo stays unchanged. A screenshot proves pixels only, so the visual spec that photographs the route is in addition to, never instead of a Playwright assertion in `tests/e2e`. The paragraph, the measured numbers, and the wrapper-coverage trade-off are `visual-tests/AGENTS.md` → Decision rule.

## Example location

The js demo is one Vite app with a Navigo router (`examples/next/visual-tests/js/demo/src/index.js`): `/` renders the shared multi-feature grid (`src/demos/default/`), and each feature has a `/<name>-demo` route backed by a `src/demos/<name>/` module (27 routes on 2026-09-18). The wrapper demos serve `/` only, plus `/scenario-grid` in `react-wrapper` and `angular-wrapper` (`vue3` has no router).

## Directory structure

```
examples/next/visual-tests/js/demo/
  index.html          # <div id="root">
  src/
    index.js          # The Navigo router: `/` plus one `/<name>-demo` route per feature
    data.js           # Shared sample data
    utils.js          # URL helpers (theme, direction, per-route params)
    demos/
      default/        # The shared `/` grid, frozen; the multi-frameworks specs photograph it
      <name>/         # One module per feature route, exporting `init()`
    styles/           # `styles.css` for `/`, `<name>-demo.css` for a route that needs one
  spec/
    Smoke.spec.js     # Puppeteer smoke test
```

## How to add a feature route

**1. Create the module.** `src/demos/<feature>/index.js` exports `init()`, which builds the grid inside `#root`. Read per-route options from the URL through `getFromURL()` in `src/utils.js`, so one route serves several visual states.

**2. Register the route.** In `src/index.js`, import the module and add `'/<feature>-demo'` next to the existing entries: `removeCSS()`, load the route's stylesheet (if any) and the theme through `loadThemeCSS()`, then call `init()`.

**3. Import from `handsontable/base`** and register what the module needs:

```js
import Handsontable from 'handsontable/base';
import { registerPlugin, ContextMenu, Filters } from 'handsontable/plugins';
import { registerCellType, NumericCellType } from 'handsontable/cellTypes';

registerPlugin(ContextMenu);
registerPlugin(Filters);
registerCellType(NumericCellType);
```

**4. Write the visual spec** under `visual-tests/tests/js-only/<feature>/`, navigating with `goto(helpers.setBaseUrl('/<feature>-demo').getFullUrl())` (pattern: `visual-testing` skill).

**5. Decide wrapper coverage out loud.** A route exists on the js demo only, so the spec is js-only by construction. To photograph the feature under a wrapper, either extend `/` (every spec that photographs it re-captures on every variant, the change is declared with `[visual budget: N – reason]` in the pull request body, and the config is mirrored in all four demos) or add the route to `react-wrapper/demo/src/index.tsx`, `angular-wrapper/demo/src/app/app.config.ts`, and the Vue demo (no router today), a per-framework change. Trade-off: `visual-tests/AGENTS.md` → Decision rule.

## The shared `/` grid

`/` combines several features in one grid (column sorting + filters + dropdown menu + hidden columns + context menu, …) and the wrapper demos render the same grid. It is frozen: any change to its config that affects rendering (cell types, `dateFormat`, `locale`, formatting, data) must be mirrored in all three wrapper demos, or the js-copied baseline gotcha (`visual-tests/AGENTS.md`, Golden snapshots) turns it into a red nightly. Put new features on their own route.

## Sample data, license, container

- Put realistic sample data (company names, dates, currencies, countries; 20-50+ rows) in a data module (`src/data.js` is shared; a route can carry its own `data.js`).
- Include `licenseKey: 'non-commercial-and-evaluation'`.
- Mount inside `#root`; a route module appends its own container to it.

## Smoke test

Every framework demo has `spec/Smoke.spec.js`, a Puppeteer test that asserts the grid rendered (`await page.$('.handsontable td')`). Base URL: `process.env.TEST_URL || 'http://localhost:8080'`.

## Key reference

`examples/next/visual-tests/js/demo/src/demos/default/index.js` (shared grid) and `src/demos/dialog/` (small single-feature route driven by URL parameters).
