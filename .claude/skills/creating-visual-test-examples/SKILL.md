---
name: creating-visual-test-examples
description: Use when creating standalone examples in examples/next/docs/ for visual regression testing or documentation demos - covers the Vite-based example structure, sample data patterns, and multi-feature demonstration
---

# Creating Visual Test Examples

This skill covers how to build standalone Vite-based examples in `examples/next/docs/`. These examples serve as both visual regression test targets and live documentation demos.

## Example Location

All standalone demos live under `examples/next/docs/js/`. Each demo gets its own directory (e.g., `examples/next/docs/js/demo/`).

## Directory Structure

```
examples/next/docs/js/demo/
  index.html          # Minimal HTML: just <div id="example"> and a script tag
  package.json        # Dependencies (handsontable, vite)
  vite.config.js      # Vite build configuration
  LICENSE.txt         # License file
  src/
    index.js          # Main entry - imports, registers, creates the grid
    constants.js      # Sample data arrays and configuration constants
    styles.css        # Custom styles for the demo
  spec/
    Smoke.spec.js     # Puppeteer smoke test
```

## How to Build an Example

**1. Import from `handsontable/base` and register explicitly.** Do not use the full bundle. Import only the plugins, cell types, and features the demo needs:

```js
import Handsontable from 'handsontable/base';
import { registerPlugin, ContextMenu, Filters } from 'handsontable/plugins';
import { registerCellType, NumericCellType } from 'handsontable/cellTypes';

registerPlugin(ContextMenu);
registerPlugin(Filters);
registerCellType(NumericCellType);
```

**2. Demonstrate multiple features together.** Unlike documentation examples (one concept each), visual test examples should combine several features in a single grid to verify they render correctly together. For example: column sorting + filters + dropdown menu + hidden columns + context menu.

**3. Use comprehensive, realistic sample data.** Extract data into `src/constants.js`. Use domain-appropriate content (company names, dates, currencies, countries) rather than placeholder strings. Aim for enough rows (20-50+) to demonstrate scrolling behavior.

**4. Always include `licenseKey: 'non-commercial-and-evaluation'`.**

**5. Target the `#example` container** defined in `index.html`.

## Smoke Test

Every example must include a smoke test in `spec/Smoke.spec.js`. The smoke test launches Puppeteer, navigates to the dev server, and asserts that the grid rendered:

```js
it('should render Handsontable', async () => {
  const hotCell = await page.$('.handsontable td');
  await expect(hotCell).toBeTruthy();
});
```

Use `process.env.TEST_URL || 'http://localhost:8080'` as the base URL.

## Key Reference

See `examples/next/docs/js/demo/src/index.js` for a complete working example that registers plugins and cell types individually, configures column types, enables multiple features, and uses helper functions for sample data generation.
