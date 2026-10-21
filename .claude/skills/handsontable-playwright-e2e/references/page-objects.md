# Page objects, selectors & fixtures (reference)

Canonical example: `tests/e2e/grid.spec.ts` with `tests/fixtures/pages/GridPage.ts`.

## Page Object Model

- **One object per surface** (a grid, a context menu, a filters dialog). Compose them (a `GridPage` can return a `ContextMenu`).
- **Locators as fields, resolved lazily.** Assign `page.getByTestId(...)` in the constructor.
- **Methods are actions or queries**, not assertions, except thin `expectX` helpers wrapping a web-first assertion. Real assertions stay in the spec.
- A page object that must wait, waits on a condition.

```ts
export class GridPage {
  readonly grid: Locator;
  constructor(readonly page: Page) { this.grid = page.getByTestId('grid'); }
  async goto() {
    await this.page.goto('/tests/fixtures/demo/grid.html');
    await expect(this.cell(0, 0)).toBeVisible(); // DOM condition, not a sleep or custom flag
  }
  cell(row: number, col: number) { return this.page.getByTestId(`cell-${row}-${col}`); }
}
```

## Hooking in by test id

Prefer, in order: `getByTestId` → `getByRole`/`getByText` → structural CSS.

- Stamp cells in a fixture via a renderer so every cell is addressable:
  ```js
  const testIdRenderer = function (instance, td, row, col, prop, value) {
    Handsontable.renderers.TextRenderer.apply(this, arguments);
    td.setAttribute('data-testid', `cell-${row}-${col}`);
  };
  ```
  `row`/`col` are visual indices.
- Put `data-testid` on the container, toolbar buttons, and any menu/dialog the test drives.
- An element with no stable hook and no fixture access: add a test id to the component.

## Grid-specific locators (when no test id is available)

- Master overlay rows: `.ht_master .htCore tbody tr`.
- The text editor input: `.handsontableInput`.

## Editing a cell

```ts
async editCell(row: number, col: number, value: string) {
  await this.cell(row, col).dblclick();
  const editor = this.page.locator('.handsontableInput');
  await expect(editor).toBeVisible();
  await editor.fill(value);
  await editor.press('Enter');
}
```

## Fixtures and the demo server

- Demo pages live in `tests/fixtures/demo/` and mount a real grid from the built `handsontable/dist`. The static server (`tests/support/static-server.mjs`) serves the repo root.
- Pass `licenseKey: 'non-commercial-and-evaluation'`.
- A wrapper functional test drives the wrapper example app; page-object and test-id rules are identical.
