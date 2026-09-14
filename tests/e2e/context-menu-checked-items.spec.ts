import { test, expect } from '../fixtures/test';
import { ContextMenuCheckedItemsPage } from '../fixtures/pages/ContextMenuCheckedItemsPage';

/**
 * DEV-2650. Six context menu items draw a check mark. The mark used to be an HTML string baked
 * into the item's `name`, which made the menu throw under a CSP enforcing Trusted Types; it is a
 * DOM node now, built from a `checked` option the item declares.
 *
 * Only `make_read_only` declared `checkable` before that change. The other five - the four
 * `customBorders` items and `commentsReadOnly` - would have kept drawing a visible mark as a plain
 * `role="menuitem"`, and `aria-checked` is invalid there, so their checked and unchecked states
 * would have sounded identical to a screen reader. Declaring `checked` now makes an item checkable
 * for exactly that reason.
 *
 * Nothing else covers those five in a real browser. The Trusted Types fixture configures
 * `contextMenu: ['make_read_only']` only and counts marks, not ARIA; the legacy a11y specs assert
 * `menuitemcheckbox` for "Read only" alone and pin the count at 1; and the four positioning specs
 * that measure `span.selected` query "Read only" too. The unit suite reaches all six factories but
 * against a stub, so it cannot see the renderer.
 */
test.describe('context menu items that draw a check mark', () => {
  let menu: ContextMenuCheckedItemsPage;

  test.beforeEach(async ({ page, theme, bundle }) => {
    menu = new ContextMenuCheckedItemsPage(page, theme, bundle);

    await menu.goto();
  });

  test('marks and announces "Read only" once the selection is read-only', async () => {
    await menu.markCellChecked();
    await menu.openMenuOnFirstCell();

    const state = await menu.itemState('Read only');

    expect(state).toEqual({
      role: 'menuitemcheckbox',
      ariaChecked: 'true',
      ariaLabel: 'Read only',
      checkMarks: 1,
    });
  });

  test('marks and announces "Read-only comment" once the comment is read-only', async () => {
    await menu.markCellChecked();
    await menu.openMenuOnFirstCell();

    // This item declares no `ariaLabel` of its own, so the renderer has to fall back to the label.
    // Reading `ariaLabel` unconditionally would put the string "undefined" here.
    const state = await menu.itemState('Read-only comment');

    expect(state).toEqual({
      role: 'menuitemcheckbox',
      ariaChecked: 'true',
      ariaLabel: 'Read-only comment',
      checkMarks: 1,
    });
  });

  test('marks and announces the bordered side in the Borders submenu', async () => {
    await menu.markCellChecked();
    await menu.openMenuOnFirstCell();
    await menu.openBordersSubmenu();

    // Only the top border was applied, so "Top" is the one side that must read as checked. The
    // others are the control: they prove the mark tracks the cell's real state rather than
    // appearing on every item in the submenu.
    expect(await menu.itemState('Top', true)).toEqual({
      role: 'menuitemcheckbox',
      ariaChecked: 'true',
      ariaLabel: 'Top',
      checkMarks: 1,
    });

    for (const side of ['Right', 'Bottom', 'Left']) {
      expect(await menu.itemState(side, true)).toEqual({
        role: 'menuitemcheckbox',
        ariaChecked: 'false',
        ariaLabel: side,
        checkMarks: 0,
      });
    }
  });

  test('announces the unchecked state rather than dropping it', async () => {
    // No `markCellChecked()` here. An item read from the resolved value instead of the declared
    // one would be a plain `menuitem` in this state, losing the `aria-checked="false"` that tells
    // a screen reader the toggle exists and is off.
    await menu.openMenuOnFirstCell();

    const readOnly = await menu.itemState('Read only');

    expect(readOnly.role).toBe('menuitemcheckbox');
    expect(readOnly.ariaChecked).toBe('false');
    expect(readOnly.checkMarks).toBe(0);

    await menu.openBordersSubmenu();

    expect(await menu.itemState('Top', true)).toEqual({
      role: 'menuitemcheckbox',
      ariaChecked: 'false',
      ariaLabel: 'Top',
      checkMarks: 0,
    });
  });

  test('keeps the label free of markup, so no item needs a sanitizer', async () => {
    await menu.markCellChecked();
    await menu.openMenuOnFirstCell();

    // The mark is a sibling element now, not part of the label. `aria-label` is the observable
    // that regressed while it lived inside `name`: a bordered selection announced
    // `<span class="selected">✓</span>Top` as its accessible name.
    for (const label of ['Read only', 'Read-only comment']) {
      const state = await menu.itemState(label);

      expect(state.ariaLabel).toBe(label);
      expect(state.ariaLabel).not.toContain('<');
    }
  });
});
