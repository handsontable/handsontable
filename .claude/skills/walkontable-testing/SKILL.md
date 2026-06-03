---
name: walkontable-testing
path: handsontable/src/3rdparty/walkontable/**
description: Use when writing tests for the Walkontable rendering engine - has its own separate test pipeline, runner, and configuration distinct from main Handsontable E2E tests
---

# Testing the Walkontable Rendering Engine

## Separate Test Pipeline

Walkontable has its own dedicated test runner. Do NOT run Walkontable tests through the main `test:e2e` or `test:unit` commands -- they will not be picked up.

- **Run command:** `npm run test:walkontable --prefix handsontable`
- **Test location:** `src/3rdparty/walkontable/test/`

The directory contains two sub-pipelines:

- `test/spec/` -- E2E-style specs (Jasmine + Puppeteer, same as main E2E but with a separate Rspack config and bootstrap)
- `test/unit/` -- Unit-style specs for calculators, filters, renderers, and utilities

## Writing Tests

The same async/await rules that apply to main E2E tests apply here. All `it()` callbacks that call rendering APIs must be `async`, and those API calls must be `await`-ed.

Tests are organized by subsystem: `overlay/`, `scroll/`, `selection/`, `renderer/`, `table/`, `viewport.spec.js`, etc. Place new tests in the directory that matches the subsystem you are modifying.

## What to Cover

- **Frozen rows and columns:** The overlay system (6 overlay types) is the most fragile part of Walkontable. Always include tests with frozen rows/columns to catch overlay positioning and synchronization regressions.
- **Viewport calculations:** Test with various container sizes (small containers that clip content, containers larger than the data, and containers that resize dynamically).
- **Scroll synchronization:** Verify that scrolling the main table keeps frozen overlays aligned. Test both horizontal and vertical scroll.
- **Large datasets:** Include performance-oriented tests with 10k+ rows. Use `forEach` loops to populate data arrays -- never `arr.push(...largeArray)`.

## Common Mistakes

- Running Walkontable tests via `test:e2e` -- they have their own command and will not execute.
- Skipping frozen row/column scenarios -- this misses the overlay edge cases where most regressions occur.
- Testing only small datasets -- Walkontable bugs often surface at scale.
- Modifying Walkontable test bootstrap/Rspack config without verifying that both `spec/` and `unit/` sub-pipelines still pass.
