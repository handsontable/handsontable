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
      mixedMarks: 0,
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
      mixedMarks: 0,
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
      mixedMarks: 0,
    });

    for (const side of ['Right', 'Bottom', 'Left']) {
      expect(await menu.itemState(side, true)).toEqual({
        role: 'menuitemcheckbox',
        ariaChecked: 'false',
        ariaLabel: side,
        checkMarks: 0,
        mixedMarks: 0,
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
      mixedMarks: 0,
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

  /**
   * DEV-124. With one read-only cell in a selection of writable ones, both read-only items drew a
   * full check mark and announced `aria-checked="true"`, because the state was "at least one cell".
   * A partly-on selection is now drawn as a dash and announced as `mixed`. The click is unchanged:
   * it still makes the whole selection writable, which `readOnly.spec.js` pins.
   */
  test.describe('a selection that is only partly on (DEV-124)', () => {
    test('draws and announces both read-only items as mixed, not checked', async () => {
      await menu.markCellChecked();
      await menu.markNeighborUnchecked();
      await menu.selectFirstTwoCells();
      await menu.openMenuOnFirstCell();

      // A precondition, not decoration: if the right-click collapsed the selection to (0, 0), the
      // items would read as checked for a reason unrelated to the fix.
      expect(await menu.selectedRange()).toEqual([0, 0, 0, 1]);

      for (const label of ['Read only', 'Read-only comment']) {
        expect(await menu.itemState(label)).toEqual({
          role: 'menuitemcheckbox',
          ariaChecked: 'mixed',
          ariaLabel: label,
          checkMarks: 0,
          mixedMarks: 1,
        });
      }
    });

    test('keeps a selection whose every cell is on checked, not mixed', async () => {
      // The control for the test above. Without it, an implementation that reported every
      // multi-cell selection as mixed would pass.
      await menu.markCellChecked();
      await menu.markNeighborChecked();
      await menu.selectFirstTwoCells();
      await menu.openMenuOnFirstCell();

      expect(await menu.selectedRange()).toEqual([0, 0, 0, 1]);

      for (const label of ['Read only', 'Read-only comment']) {
        expect(await menu.itemState(label)).toEqual({
          role: 'menuitemcheckbox',
          ariaChecked: 'true',
          ariaLabel: label,
          checkMarks: 1,
          mixedMarks: 0,
        });
      }
    });

    test('reads a merged cell by its top-left cell, so it stays checked', async () => {
      // The block is selected as all four cells, and only the top-left one carries `readOnly` and
      // the read-only comment. Counting the three hidden cells turned one fully read-only visible
      // cell into a "partly read-only" selection.
      await menu.mergeReadOnlyBlock();
      await menu.openMenuOnCell(2, 0);

      expect(await menu.selectedRange()).toEqual([2, 0, 3, 1]);

      for (const label of ['Read only', 'Read-only comment']) {
        expect(await menu.itemState(label)).toEqual({
          role: 'menuitemcheckbox',
          ariaChecked: 'true',
          ariaLabel: label,
          checkMarks: 1,
          mixedMarks: 0,
        });
      }
    });

    test('judges the comment item only by the cells that hold a comment', async () => {
      // (0, 0) is read-only with a read-only comment; (0, 1) is writable and has no comment. The
      // cells are partly read-only, but every comment in the selection is.
      await menu.markCellChecked();
      await menu.selectFirstTwoCells();
      await menu.openMenuOnFirstCell();

      expect(await menu.selectedRange()).toEqual([0, 0, 0, 1]);
      expect((await menu.itemState('Read only')).ariaChecked).toBe('mixed');
      expect(await menu.itemState('Read-only comment')).toEqual({
        role: 'menuitemcheckbox',
        ariaChecked: 'true',
        ariaLabel: 'Read-only comment',
        checkMarks: 1,
        mixedMarks: 0,
      });
    });

    test('clears the "Read-only comment" dash with one click', async () => {
      // (0, 0) holds a read-only comment, (0, 1) a writable one. The click must leave every comment
      // in one state; flipping each cell on its own just swaps which one is read-only.
      await menu.markCellChecked();
      await menu.markNeighborUnchecked();
      await menu.selectFirstTwoCells();
      await menu.openMenuOnFirstCell();

      expect((await menu.itemState('Read-only comment')).ariaChecked).toBe('mixed');

      await menu.clickItem('Read-only comment');
      await menu.openMenuOnFirstCell();

      expect(await menu.selectedRange()).toEqual([0, 0, 0, 1]);
      expect(await menu.itemState('Read-only comment')).toEqual({
        role: 'menuitemcheckbox',
        ariaChecked: 'false',
        ariaLabel: 'Read-only comment',
        checkMarks: 0,
        mixedMarks: 0,
      });
    });

    test('paints the mixed state with its own glyph, not the check mark', async () => {
      // Counting spans proves the DOM only. This reads the icon mask the theme's stylesheet puts on
      // each mark, which is what the user actually sees - and which a missing icon rule for
      // `htMixed` would leave as `none`, an invisible mark on a correctly announced item.
      await menu.markCellChecked();
      await menu.markNeighborUnchecked();
      await menu.selectFirstTwoCells();
      await menu.openMenuOnFirstCell();

      const mixed = await menu.markGlyph('Read only');

      await menu.closeMenu();
      await menu.markNeighborChecked();
      await menu.selectFirstTwoCells();
      await menu.openMenuOnFirstCell();

      const checked = await menu.markGlyph('Read only');

      expect(mixed.className).toBe('htMixed');
      expect(checked.className).toBe('selected');
      expect(mixed.maskImage).toContain('svg');
      expect(checked.maskImage).toContain('svg');
      expect(mixed.maskImage).not.toBe(checked.maskImage);
      // The dash sits where the check mark sits, at the same icon size.
      expect(mixed.width).toBeGreaterThan(0);
      expect(mixed.width).toBe(checked.width);
    });
  });
});
