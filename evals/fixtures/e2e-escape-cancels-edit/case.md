# Case: granular interaction — Escape discards an in-progress edit

- **Kind:** granular user interaction (keyboard, editor lifecycle)
- **Tier:** Playwright E2E (`tests/e2e/*.spec.ts`), house style: page object
  `tests/fixtures/pages/GridPage.ts`, stable `data-testid` hooks, web-first
  waits only

## The change brief (what the agent receives)

Intended behavior: the user double-clicks a cell to open the editor, types a
new value, and presses `Escape`. The edit is discarded — the cell keeps its
original value — and the selection stays on that cell, so a follow-up fast-edit
(typing while selected, committed with `Enter`) lands in the same cell.

Write the Playwright E2E test for this interaction against the demo fixture
(`GridPage`). The seeded grid shows `A1`, `B2`, `C3`, … in the corresponding
cells.

## What a meaningful test looks like (rubric notes)

- Asserts the **user-observable outcome**: the cell text after `Escape`, and
  where the follow-up fast-edit lands — not internal editor state.
- Drives real keys through the page object; hooks in by `data-testid`.
- Every wait is condition-based (an auto-retrying `expect`); a fixed sleep or a
  load-state wait is an automatic fail.
- One focused test; the E2E tier leans on granular-scenario quality, not count
  (mutation is too expensive for a browser suite).
