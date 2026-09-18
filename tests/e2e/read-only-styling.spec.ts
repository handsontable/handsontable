import { test, expect } from '../fixtures/test';
import { ReadOnlyStylingPage } from '../fixtures/pages/ReadOnlyStylingPage';

test.describe('readOnlyStyling', () => {
  // The point of the option: a non-editable grid that does not look non-editable.
  // Compared against the fixture's editable grid rather than a fixed palette, so
  // the assertion means the same thing on every theme.
  test('a read-only cell is painted like an editable one when styling is off', async({ page, theme, bundle }) => {
    const grid = new ReadOnlyStylingPage(page, theme, bundle);

    await grid.goto();

    await grid.expectSameLook(['unstyled', 1, 1], ['editable', 1, 1]);
  });

  // The negative control. Without it the test above passes on a build where
  // read-only cells were never styled at all, which would prove nothing.
  test('a read-only cell is still dimmed by default', async({ page, theme, bundle }) => {
    const grid = new ReadOnlyStylingPage(page, theme, bundle);

    await grid.goto();

    await grid.expectDifferentLook(['styled', 1, 1], ['editable', 1, 1]);
  });

  // Appearance is ALL the option changes — the cell is as non-editable as before.
  test('a cell with styling off still rejects edits', async({ page, theme, bundle }) => {
    const grid = new ReadOnlyStylingPage(page, theme, bundle);

    await grid.goto();
    await grid.cell('unstyled', 1, 1).dblclick();

    await grid.expectNoEditor('unstyled');
    await grid.expectCell('unstyled', 1, 1, 'B2');
  });

  // A cell that looks editable but is not must still say so to a screen reader,
  // or turning the styling off would take away the only remaining signal.
  test('a cell with styling off is still announced as read-only', async({ page, theme, bundle }) => {
    const grid = new ReadOnlyStylingPage(page, theme, bundle);

    await grid.goto();

    expect(await grid.ariaReadonly('unstyled', 1, 1)).toBe('true');
    expect(await grid.ariaReadonly('editable', 1, 1)).toBeNull();
  });
});
