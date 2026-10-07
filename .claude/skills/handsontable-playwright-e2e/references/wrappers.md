# Wrapper E2E (React / Angular / Vue) (reference)

Wrapper functional tests drive the wrapper example apps (not a static demo) in a real browser. Same rules as core E2E, plus the gotchas below. No Playwright wrapper spec exists yet: `tests/e2e/` has no `wrappers/` directory, and the suite's one web server (`tests/support/static-server.mjs`) serves static files from the repo root, not a running example app. Put the first one under `tests/e2e/wrappers/<framework>/`.

## Driving the app

- Serve the wrapper's example app (`examples/next/visual-tests/<framework>/demo`, or a purpose-built one) and point the page object at it. Add `data-testid` to the wrapper component and its controls.
- One mounted instance per test; reset via navigation.

## React

- **StrictMode double-invoke:** mount the app under `<React.StrictMode>` in the fixture and assert exactly one live Handsontable instance survives (a single `.handsontable` root). This is the #1 wrapper regression.
- **Selection preserved on `updateSettings`:** change a prop that triggers `updateSettings`, then assert the selected cell is still selected.
- **HotColumn reorder / keyed children:** reorder columns via keys and assert the rendered order.

## Angular

- **NgZone:** trigger a HOT hook from outside Angular and assert the bound Angular view updated.
- Test against the supported version floor as well as latest.

## Vue 3

- **Deep-watch / reactivity:** mutate a reactive `settings` prop and assert the grid reflects it, with `updateSettings` firing the expected number of times, not on every tick.
- **HotColumn comment-anchor ordering:** reorder and assert DOM order.

## SSR frameworks (Next / Nuxt / Gatsby / Remix / Astro)

- For a server-rendered, hydrating app, assert no hydration-mismatch console error on load. (Many demos disable SSR today; an SSR+hydrate variant is the valuable one.)

## Jest vs Playwright

Props mapping, lifecycle wiring, and pure logic belong in Jest wrapper unit tests. Playwright covers rendering, real focus, scroll, StrictMode remount, NgZone, hydration.
