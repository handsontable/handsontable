# Testing Overview (Monorepo)

This is a short map of the test pipelines across the monorepo. Each entry lists
its run command and points to the deep reference for detail.

For full core testing detail (boilerplate, async rules, theme-aware assertions,
global helpers, mocking, fixtures, custom matchers), see
[`handsontable/.ai/TESTING.md`](../handsontable/.ai/TESTING.md).

## Pipelines

| Pipeline | Framework | File pattern | Run command | Deep reference |
|---|---|---|---|---|
| Core unit | Jest (jsdom, `jest-jasmine2` runner) | `*.unit.js` | `npm --prefix handsontable run test:unit` | [`handsontable/.ai/TESTING.md`](../handsontable/.ai/TESTING.md) |
| Core E2E | Jasmine + Puppeteer (headless Chrome) | `*.spec.js` | `npm --prefix handsontable run test:e2e` | [`handsontable/.ai/TESTING.md`](../handsontable/.ai/TESTING.md) |
| Type tests | `tsc` only | `*.types.ts` | `npm --prefix handsontable run test:types` | [`handsontable/.ai/TESTING.md`](../handsontable/.ai/TESTING.md) |
| Walkontable | Separate runner (`SpecRunner.html`) | — | `npm --prefix handsontable run test:walkontable` | `handsontable/src/3rdparty/walkontable/AGENTS.md`; skills `walkontable-testing`, `walkontable-dev` |
| React wrapper | Jest + `@testing-library/react` | — | `npm --prefix wrappers/react-wrapper run test` | `wrappers/react-wrapper/AGENTS.md` |
| Vue 3 wrapper | Jest + `@vue/test-utils` | — | `npm --prefix wrappers/vue3 run test` | `wrappers/vue3/AGENTS.md` |
| Angular wrapper | `jest-preset-angular` | — | `npm --prefix wrappers/angular-wrapper run test` | `wrappers/angular-wrapper/AGENTS.md` |
| Visual regression | Playwright + Argos | — | `npm --prefix visual-tests run test` | `visual-tests/AGENTS.md`; skills `visual-testing`, `creating-visual-test-examples` |
| Performance | Playwright + CDP traces | — | `node scripts/run.mjs` (run from `performance-tests/`) | skill `performance-testing` |

## Notes

- The core unit and E2E pipelines are the highest-traffic. Both live inside the
  `handsontable` package. Run targeted subsets with `--testPathPattern=<regex>`.
- The Angular wrapper test script sets `NODE_OPTIONS=--openssl-legacy-provider`
  internally — no manual flag is needed.
- The Walkontable engine has its own runner and configuration. Do not mix
  Walkontable specs with the core E2E suite.
- `performance-tests/` is not a pnpm workspace. Run its scripts from inside the
  directory (for example `node scripts/run.mjs`). See the `performance-testing`
  skill for the trace-based measurement system and the golden-snapshot workflow.
- Build the core package before running wrapper tests. Wrappers consume the
  core `tmp/` output through workspace linking. See
  [`.ai/BUILD-RELEASE.md`](BUILD-RELEASE.md).

## Inside a package

Run a package script from the workspace root with `npm --prefix <dir> run <task>`,
or `cd` into the package and use `npm run <task>` directly. The core package
exposes a full pipeline (`npm run test` runs lint, unit, types, walkontable,
e2e, and production checks).
