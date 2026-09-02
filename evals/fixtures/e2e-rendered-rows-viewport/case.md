# Case: granular interaction — the virtual renderer draws only the viewport window

- **Kind:** rendering behavior (a virtualization edge)
- **Tier:** Playwright E2E (`tests/e2e/*.spec.ts`)
- **Source under test:** the rendered-row window computed in `handsontable/src/3rdparty/walkontable/src/calculator/`
- **Diff:** none — the brief is the behavior contract

## The change brief (what the agent receives)

Handsontable renders only the rows that fit the viewport plus
`viewportRowRenderingOffset` on each side; the rest of a 200-row dataset is
never in the DOM. Write the test that pins this window: a grid with 200 rows
must render far fewer `tr` elements than it has rows, and scrolling must not
change the size of that window.

## What a meaningful test looks like (rubric notes) — the `theme-sensitive-viewport` smell

- Row height differs per theme (main/horizon/classic), and the functional
  suite runs every spec on the theme × bundle matrix. A rendered-row count read
  from a grid with **no explicit `width`/`height`** is a different number on
  each leg — the assertion is a theme lottery. Pin the viewport in the grid
  settings (or scroll to a known row with `scrollViewportTo`) so the count is a
  function of the setup, not of the stylesheet.
- Assert a **bound that holds on every theme** (rendered rows well below the
  data length; the window keeps its size after a scroll) rather than a literal
  count that only one theme produces — or derive the literal from the theme's
  row height.
- `reference/` pins the viewport; `counterexample/` reads the same count with
  the default auto-height and a one-theme literal — the scorer flags it as
  `theme-sensitive-viewport`.
