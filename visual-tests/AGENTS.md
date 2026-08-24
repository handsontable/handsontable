# Visual Regression Tests

Playwright-based visual regression testing with Argos CI for screenshot comparison.

## Framework

- Playwright with TypeScript
- Custom `tablePage` fixture from `src/test-runner.ts` (auto-navigates to demo, disables animations, waits for table)
- Config: `playwright.config.ts`, `playwright-cross-browser.config.ts`

## Test Pattern

```typescript
import { test } from '../../../src/test-runner';
import { helpers } from '../../../src/helpers';

test(__filename, async({ tablePage }) => {
  // Setup
  const cell = await tablePage.locator('.ht_master td').first();
  await cell.click();

  // Capture state
  await tablePage.screenshot({ path: helpers.screenshotPath() });

  // Action + another screenshot
  await tablePage.keyboard.press('Escape');
  await tablePage.screenshot({ path: helpers.screenshotPath() });
});
```

## Key Rules

- Test naming: `__filename` auto-generates title from file path
- Screenshots: Always use `helpers.screenshotPath()` for consistent naming
- Organization: `tests/js-only/`, `tests/multi-frameworks/`, `tests/cross-browser/`
- Examples for testing live in `examples/next/docs/`

## Golden snapshots: js-copied baselines (critical gotcha)

The reference (golden) baseline and PR builds are generated **differently**, and this asymmetry is a recurring source of false-positive Argos diffs.

- **Reference branch (`develop`)** — `scripts/run-tests.mjs` renders **only the `js` framework** (`getFrameworkList()` returns `[REFERENCE_FRAMEWORK]` when `isReferenceBranch()`), then **copies** the js `multi-frameworks` screenshots into the `react-wrapper` / `vue3` / `angular-wrapper` baselines. The wrapper screenshots in the golden set are therefore **identical to the js render** — the wrappers are never actually rendered on `develop`.
- **Pull requests (non-reference branches)** — every framework (`js` + all wrappers) is rendered for real from its own visual-test example, and each is compared against the copied js baseline.

**Implication:** the harness assumes every framework renders each multi-framework demo **pixel-identically to js**. When that assumption breaks, the affected wrapper snapshots diverge from the copied js baseline on **every** PR — a constant, content-independent diff — while `develop` builds can never detect it (they only ever re-copy js).

**Rule:** any change to a `js` visual-test demo that affects rendering (cell-type config, `dateFormat`, `locale`, formatting, data) **must be mirrored in all three wrapper demos**, or every future PR inherits a phantom diff. The wrapper demos must produce the same DOM/output as js.

- Visual-test examples live under **`examples/next/visual-tests/<framework>/demo/`** (js, react-wrapper, vue3, angular-wrapper) — distinct from the docs examples in `examples/next/docs/`.
- Example regression (DEV-1860): PRO-986 migrated the **js** date column to `dateFormat: { dateStyle: 'short' }` + `locale: 'en-US'` (native `Intl`) but left the wrapper demos with bare `type: 'date'`, so the wrappers rendered the default `Intl` format (`10/11/2020`) instead of the baseline's `10/11/20` → a constant 255-snapshot diff on every PR until the wrapper demos were synced. Pinning the browser `locale` in `playwright.config.ts` does **not** fix this class of bug — the gap is the demo config, not the runtime locale.

## Helpers

- `src/helpers.ts`: screenshotPath, DOM selectors, platform detection
- `src/page-helpers.ts`: selectCell, menu navigation, high-level interactions

## Run

See `package.json` scripts for build, test, and upload commands.

For detailed guidance: use skills `visual-testing`, `creating-visual-test-examples`
