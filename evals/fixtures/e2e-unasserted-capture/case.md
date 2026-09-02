# Case: granular interaction — adding a row grows the rendered grid by one

- **Kind:** bug fix (the "add row" action rendered the new row only after the next redraw)
- **Tier:** Playwright E2E (`tests/e2e/*.spec.ts`), against the demo fixture's **Add row** button (`GridPage.addRowButton`)
- **Diff:** none — the brief is the behavior contract

## The change brief (what the agent receives)

The demo fixture's **Add row** button calls `alter('insert_row_below')`. After
the click the grid must render exactly one more row than before, and the new
last row must be empty. Write the regression test.

## What a meaningful test looks like (rubric notes) — the `unasserted-capture` smell

- A value fetched with `await` and never fed to an assertion is dead weight
  that *looks* like verification: `const before = await grid.rowCount();`
  followed by a click and a visibility check has exercised the code path
  without checking the row count at all. The scorer flags every such capture
  as `unasserted-capture`, by name.
- The reference feeds the captured count into the expectation (`before + 1`),
  so the assertion is anchored to the state the test observed — not to a
  literal that happens to match the fixture today.
- `counterexample/` captures the count and only navigates with it — so
  `no-unused-vars` is quiet — while its only assertion is that the button is
  still visible. Lint cannot see that gap; the scorer can.
