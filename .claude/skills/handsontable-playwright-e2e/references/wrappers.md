# Wrapper E2E (React / Angular / Vue) — reference

Wrapper functional tests drive the wrapper **example apps** (not a static demo) in a real browser, because the bugs that matter are framework-integration bugs jsdom cannot see. Same rules as core E2E — page objects, `data-testid`, web-first waits — plus the framework-specific gotchas below. Specs live under `tests/e2e/wrappers/<framework>/`.

## Driving the app

- Serve the wrapper's example app (the `examples/next/visual-tests/<framework>/demo` apps, or a purpose-built one) and point the page object at it. Add `data-testid` to the wrapper component and its controls.
- One mounted instance per test; reset via navigation, not shared state.

## React

- **StrictMode double-invoke:** React 18+ StrictMode mounts, unmounts, and remounts. Assert **exactly one** live Handsontable instance survives (no duplicate grid). This is the #1 wrapper regression — mount the app under `<React.StrictMode>` in the fixture and assert a single `.handsontable` root / one instance.
- **Selection preserved on `updateSettings`:** change a prop that triggers `updateSettings`, then assert the previously-selected cell is still selected.
- **HotColumn reorder / keyed children:** reorder columns via keys and assert the rendered order.

## Angular

- **NgZone:** hooks fired from outside Angular must run inside the zone (change detection updates the view). Trigger a HOT hook and assert the bound Angular view actually updated.
- Test against the supported version floor as well as latest (version matrix is a later nightly task).

## Vue 3

- **Deep-watch / reactivity:** mutate a reactive `settings` prop and assert the grid reflects it (and that `updateSettings` fired the expected number of times, not on every tick).
- **HotColumn comment-anchor ordering:** reorder and assert DOM order.

## SSR frameworks (Next / Nuxt / Gatsby / Remix / Astro)

- If the app renders server-side and hydrates, assert **no hydration-mismatch console error** on load — that is the class of bug an SSR wrapper test exists to catch. (Many demos disable SSR today; a real SSR+hydrate variant is the valuable one.)

## What jsdom already covers

Props mapping, lifecycle wiring, and pure logic are fine as **Jest** wrapper unit tests — keep those there. Reserve Playwright for what needs a real browser: rendering, real focus, scroll, StrictMode remount, NgZone, hydration.
