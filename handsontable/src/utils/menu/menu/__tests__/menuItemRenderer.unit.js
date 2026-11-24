import { createMenuItemRenderer } from 'handsontable/utils/menu/menu/menuItemRenderer';
import { isItemChecked, isItemCheckable } from 'handsontable/utils/menu/menu/utils';
import { SEPARATOR } from 'handsontable/utils/menu/predefinedItems';

const CHECK_MARK = String.fromCharCode(10003);
const MIXED_MARK = String.fromCharCode(8211);

/**
 * Builds the pair of instances the renderer reads from: the main grid it takes the document,
 * settings and sanitizer from, and the menu grid it takes the item definition from.
 *
 * @param {object} item The menu item definition under test.
 * @param {object} [settings] Settings the main instance should report.
 * @returns {{ mainTableHot: object, menuHot: object }}
 */
function createInstances(item, settings = {}) {
  const rootElement = document.createElement('div');

  return {
    mainTableHot: {
      rootDocument: document,
      rootElement,
      getSettings: () => settings,
    },
    menuHot: createMenuHot([item]),
  };
}

/**
 * Builds the menu grid the renderer reads its items and their positions from.
 *
 * @param {object[]} items The menu items, one per row.
 * @param {number[]} [hiddenRows] The rows the menu grid hides (the Filters plugin hides some of its own).
 * @returns {object}
 */
function createMenuHot(items, hiddenRows = []) {
  return {
    getSourceDataAtRow: row => items[row],
    countRows: () => items.length,
    toPhysicalRow: row => row,
    rowIndexMapper: {
      isHidden: physicalRow => hiddenRows.includes(physicalRow),
    },
  };
}

/**
 * Renders one item into a fresh `<td>` and hands back the cell plus its item wrapper.
 *
 * @param {object} item The menu item definition under test.
 * @param {object} [settings] Settings the main instance should report.
 * @returns {{ TD: HTMLTableCellElement, wrapper: HTMLElement }}
 */
function renderItem(item, settings) {
  const { mainTableHot, menuHot } = createInstances(item, settings);
  const TD = document.createElement('td');
  const value = item.name;

  createMenuItemRenderer(mainTableHot)(menuHot, TD, 0, 0, '0', value, {});

  return { TD, wrapper: TD.querySelector('.htItemWrapper') };
}

describe('menu/utils', () => {
  describe('isItemChecked', () => {
    it('should read a literal `true`', () => {
      expect(isItemChecked({ checked: true }, {})).toBe(true);
    });

    it('should call a function and read its result, bound to the passed instance', () => {
      const hot = { marker: 'the instance' };
      let seenThis = null;

      const result = isItemChecked({
        checked() {
          seenThis = this;

          return true;
        },
      }, hot);

      expect(result).toBe(true);
      expect(seenThis).toBe(hot);
    });

    it('should be false for an item that does not declare the flag at all', () => {
      expect(isItemChecked({}, {})).toBe(false);
    });

    it('should not treat a truthy non-boolean as checked', () => {
      // Mirrors `isItemDisabled`, which compares against `true` rather than coercing. A `name`
      // reading `'Read only'` must never be mistaken for a state.
      expect(isItemChecked({ checked: 'yes' }, {})).toBe(false);
      expect(isItemChecked({ checked: 1 }, {})).toBe(false);
      expect(isItemChecked({ checked: () => 'yes' }, {})).toBe(false);
    });
  });
});

describe('menuItemRenderer', () => {
  describe('the check mark of a checked item', () => {
    it('should build the mark as a real element, not as markup inside the label', () => {
      const { wrapper } = renderItem({ key: 'a', name: 'Read only', checked: true });
      const mark = wrapper.querySelector('span.selected');

      expect(mark).not.toBe(null);
      expect(mark.textContent).toBe(CHECK_MARK);
      expect(mark.tagName).toBe('SPAN');
    });

    it('should put the mark before the label, matching the DOM the label string used to produce', () => {
      const { wrapper } = renderItem({ key: 'a', name: 'Read only', checked: true });

      expect(wrapper.childNodes.length).toBe(2);
      expect(wrapper.childNodes[0].className).toBe('selected');
      expect(wrapper.childNodes[1].textContent).toBe('Read only');
      expect(wrapper.textContent).toBe(`${CHECK_MARK}Read only`);
    });

    it('should keep the label out of the HTML sink, so no sanitizer is needed to render it', () => {
      // The whole point of DEV-2650: a checked item used to hand `fastInnerHTML` a label carrying
      // `<span class="selected">`, which a page enforcing Trusted Types rejects. `fastInnerHTML`
      // only reaches `innerHTML` for content shaped like markup, so a plain label takes the text
      // path. Asserted through the sanitizer, which is the one observer of that decision.
      const seen = [];
      const sanitizer = (html) => {
        seen.push(html);

        return html;
      };

      renderItem({ key: 'a', name: 'Read only', checked: true }, { sanitizer });

      expect(seen).toEqual([]);
    });

    it('should resolve a function form against the main instance', () => {
      let seenThis = null;
      const { mainTableHot, menuHot } = createInstances({
        key: 'a',
        name: 'Top',
        checked() {
          seenThis = this;

          return true;
        },
      });
      const TD = document.createElement('td');

      createMenuItemRenderer(mainTableHot)(menuHot, TD, 0, 0, '0', 'Top', {});

      expect(seenThis).toBe(mainTableHot);
      expect(TD.querySelector('span.selected')).not.toBe(null);
    });

    it('should draw no mark for an unchecked item', () => {
      const { wrapper } = renderItem({ key: 'a', name: 'Read only', checked: () => false });

      expect(wrapper.querySelector('span.selected')).toBe(null);
      expect(wrapper.querySelector('span.htMixed')).toBe(null);
      expect(wrapper.textContent).toBe('Read only');
    });

    it('should draw a dash, not a check mark, for a partly-checked item (DEV-124)', () => {
      const { wrapper } = renderItem({ key: 'a', name: 'Read only', checked: () => 'mixed' });

      // Its own class, not `selected`: that class carries the check glyph's mask and the active-row
      // background, and a partly-on item is neither.
      expect(wrapper.querySelector('span.selected')).toBe(null);
      expect(wrapper.querySelectorAll('span.htMixed').length).toBe(1);
      expect(wrapper.firstChild.className).toBe('htMixed');
      expect(wrapper.textContent).toBe(`${MIXED_MARK}Read only`);
    });

    it('should keep drawing the check mark, and only it, for a checked item', () => {
      const { wrapper } = renderItem({ key: 'a', name: 'Read only', checked: () => true });

      expect(wrapper.querySelector('span.htMixed')).toBe(null);
      expect(wrapper.firstChild.className).toBe('selected');
      expect(wrapper.textContent).toBe(`${CHECK_MARK}Read only`);
    });

    it('should draw no mark for an item that never declares the flag', () => {
      const { wrapper } = renderItem({ key: 'a', name: 'Insert row above' });

      expect(wrapper.querySelector('span.selected')).toBe(null);
    });

    it('should leave an item with its own renderer alone', () => {
      // A custom renderer owns the wrapper's content, so the mark is not ours to add there.
      const custom = document.createElement('span');
      const { TD } = renderItem({
        key: 'a',
        name: 'Custom',
        checked: true,
        renderer: () => custom,
      });

      expect(TD.querySelector('span.selected')).toBe(null);
      expect(TD.contains(custom)).toBe(true);
    });
  });

  describe('the `aria-checked` state of a checkable item', () => {
    it('should follow the `checked` flag when the item declares no `ariaChecked`', () => {
      const { TD } = renderItem({
        key: 'a',
        name: 'Read only',
        checkable: true,
        ariaLabel: 'Read only',
        checked: true,
      }, { ariaTags: true });

      expect(TD.getAttribute('aria-checked')).toBe('true');
      expect(TD.getAttribute('role')).toBe('menuitemcheckbox');
      expect(TD.getAttribute('aria-label')).toBe('Read only');
    });

    it('should report false for a checkable item that is not checked', () => {
      const { TD } = renderItem({
        key: 'a',
        name: 'Read only',
        checkable: true,
        ariaLabel: 'Read only',
        checked: () => false,
      }, { ariaTags: true });

      expect(TD.getAttribute('aria-checked')).toBe('false');
    });

    it('should announce a partly-checked item as mixed (DEV-124)', () => {
      // Announcing it as "true" is the accessibility half of the bug: a screen reader told the user
      // a mostly-writable selection was read-only.
      const { TD } = renderItem({
        key: 'a',
        name: 'Read only',
        checkable: true,
        checked: () => 'mixed',
      }, { ariaTags: true });

      expect(TD.getAttribute('role')).toBe('menuitemcheckbox');
      expect(TD.getAttribute('aria-checked')).toBe('mixed');
      expect(TD.getAttribute('aria-label')).toBe('Read only');
    });

    it('should still honor an explicit `ariaChecked`, which predates the flag', () => {
      const { TD } = renderItem({
        key: 'a',
        name: 'Read only',
        checkable: true,
        ariaLabel: 'Read only',
        ariaChecked: () => true,
      }, { ariaTags: true });

      expect(TD.getAttribute('aria-checked')).toBe('true');
    });

    it('should announce an item that declares only `checked` as a checkbox', () => {
      // The border items and the read-only comment item declare `checked` and not `checkable`.
      // Announcing them as a plain `menuitem` would leave the visible mark with nothing behind
      // it - `aria-checked` is only valid on `menuitemcheckbox` - so the checked and unchecked
      // states would sound identical. That is worse than what they did before DEV-2650, when the
      // marker at least reached the accessible name (as raw markup).
      const { TD } = renderItem({ key: 'a', name: 'Top', checked: true }, { ariaTags: true });

      expect(TD.getAttribute('role')).toBe('menuitemcheckbox');
      expect(TD.getAttribute('aria-checked')).toBe('true');
      expect(TD.getAttribute('aria-label')).toBe('Top');
    });

    it('should label such an item from its name, never `undefined`', () => {
      // These items declare no `ariaLabel`, and the checkbox branch used to read one
      // unconditionally - which would have written the string "undefined" as the accessible name.
      const { TD } = renderItem({ key: 'a', name: 'Top', checked: () => false }, { ariaTags: true });

      expect(TD.getAttribute('aria-label')).toBe('Top');
      expect(TD.getAttribute('aria-checked')).toBe('false');
    });

    it('should leave an item that declares no state a plain menu item', () => {
      const { TD } = renderItem({ key: 'a', name: 'Insert row above' }, { ariaTags: true });

      expect(TD.getAttribute('role')).toBe('menuitem');
      expect(TD.getAttribute('aria-checked')).toBe(null);
    });

    it('should not turn a custom item carrying an unrelated `checked` into a checkbox', () => {
      // `checked` is a common property name. Reading it by presence rather than by type would
      // change the role of somebody's existing item on upgrade, purely because of the name.
      expect(isItemCheckable({ key: 'a', name: 'Sync', checked: 'pending' })).toBe(false);
      expect(isItemCheckable({ key: 'a', name: 'Sync', checked: 1 })).toBe(false);

      const { TD } = renderItem({ key: 'a', name: 'Sync', checked: 'pending' }, { ariaTags: true });

      expect(TD.getAttribute('role')).toBe('menuitem');
    });

    it('should keep an unchecked item a checkbox, so its state is still announced', () => {
      // Read from the resolved value instead, an item would only be a checkbox while checked, and
      // unchecking it would drop the `aria-checked="false"` that conveys the state.
      expect(isItemCheckable({ key: 'a', name: 'Top', checked: false })).toBe(true);
      expect(isItemCheckable({ key: 'a', name: 'Top', checked: () => false })).toBe(true);
    });
  });

  describe('the disabled state of an item', () => {
    it('should call the `disabled` callback once per render and mark the item from that answer', () => {
      // A `disabled()` callback may walk the whole selection (the comment items do), so the
      // renderer asks once and reuses the answer for `tabindex`, `aria-disabled` and the class.
      const disabled = jest.fn(() => true);
      const { TD } = renderItem({ key: 'a', name: 'Delete comment', disabled }, { ariaTags: true });

      expect(disabled).toHaveBeenCalledTimes(1);
      expect(TD.getAttribute('aria-disabled')).toBe('true');
      expect(TD.hasAttribute('tabindex')).toBe(false);
      expect(TD.classList.contains('htDisabled')).toBe(true);
    });

    it('should leave an enabled item focusable and not mark it as disabled', () => {
      const disabled = jest.fn(() => false);
      const { TD } = renderItem({ key: 'a', name: 'Delete comment', disabled }, { ariaTags: true });

      expect(disabled).toHaveBeenCalledTimes(1);
      expect(TD.getAttribute('aria-disabled')).toBe(null);
      expect(TD.getAttribute('tabindex')).toBe('-1');
      expect(TD.classList.contains('htDisabled')).toBe(false);
    });
  });

  describe('a separator', () => {
    it('should be exposed as a separator with no name and no tab stop', () => {
      const { TD } = renderItem({ name: SEPARATOR }, { ariaTags: true });

      expect(TD.getAttribute('role')).toBe('separator');
      expect(TD.hasAttribute('aria-label')).toBe(false);
      expect(TD.hasAttribute('tabindex')).toBe(false);
      expect(TD.classList.contains('htSeparator')).toBe(true);
    });

    it('should drop the item attributes a reused cell carried from an earlier item', () => {
      const separator = { name: SEPARATOR };
      const item = { key: 'a', name: 'Top', checked: true, disabled: true, submenu: { items: [] } };
      const TD = document.createElement('td');
      let current = item;
      const { mainTableHot, menuHot } = createInstances(item, { ariaTags: true });
      const render = createMenuItemRenderer(mainTableHot);

      menuHot.getSourceDataAtRow = () => current;
      render(menuHot, TD, 0, 0, '0', item.name, {});
      current = separator;
      render(menuHot, TD, 0, 0, '0', separator.name, {});

      expect(TD.getAttribute('role')).toBe('separator');
      expect(TD.hasAttribute('aria-label')).toBe(false);
      expect(TD.hasAttribute('aria-checked')).toBe(false);
      expect(TD.hasAttribute('aria-disabled')).toBe(false);
      expect(TD.hasAttribute('aria-expanded')).toBe(false);
      expect(TD.hasAttribute('aria-posinset')).toBe(false);
      expect(TD.hasAttribute('aria-setsize')).toBe(false);
    });

    it('should drop the tab stop a reused cell carried from an enabled item', () => {
      const separator = { name: SEPARATOR };
      const item = { key: 'b', name: 'Enabled' };
      const TD = document.createElement('td');
      let current = item;
      const { mainTableHot, menuHot } = createInstances(item, { ariaTags: true });
      const render = createMenuItemRenderer(mainTableHot);

      menuHot.getSourceDataAtRow = () => current;
      render(menuHot, TD, 0, 0, '0', item.name, {});

      expect(TD.getAttribute('tabindex')).toBe('-1');

      current = separator;
      render(menuHot, TD, 0, 0, '0', separator.name, {});

      expect(TD.getAttribute('role')).toBe('separator');
      expect(TD.hasAttribute('tabindex')).toBe(false);
    });

    it('should write no ARIA when `ariaTags` is off', () => {
      const { TD } = renderItem({ name: SEPARATOR }, { ariaTags: false });

      expect(TD.hasAttribute('role')).toBe(false);
      expect(TD.hasAttribute('aria-label')).toBe(false);
      expect(TD.classList.contains('htSeparator')).toBe(true);
    });
  });
  describe('the position of an item (DEV-4172)', () => {
    /**
     * Renders every row of a menu into its own `<td>` and reads the position ARIA back.
     *
     * @param {object[]} items The menu items, one per row.
     * @param {object} [options] The options.
     * @param {number[]} [options.hiddenRows] The rows the menu grid hides.
     * @param {boolean} [options.ariaTags] The main grid's `ariaTags` setting.
     * @returns {Array<[string | null, string | null]>} `[aria-posinset, aria-setsize]` per row.
     */
    function renderPositions(items, { hiddenRows = [], ariaTags = true } = {}) {
      const mainTableHot = {
        rootDocument: document,
        rootElement: document.createElement('div'),
        getSettings: () => ({ ariaTags }),
      };
      const menuHot = createMenuHot(items, hiddenRows);
      const render = createMenuItemRenderer(mainTableHot);

      return items.map((item, row) => {
        const TD = document.createElement('td');

        render(menuHot, TD, row, 0, '0', item.name, {});

        return [TD.getAttribute('aria-posinset'), TD.getAttribute('aria-setsize')];
      });
    }

    it('should number the items in order and leave the separators out of the count', () => {
      const positions = renderPositions([
        { name: 'A' },
        { name: SEPARATOR },
        { name: 'B' },
        { name: 'C' },
        { name: SEPARATOR },
        { name: 'D' },
      ]);

      expect(positions).toEqual([
        ['1', '4'],
        [null, null],
        ['2', '4'],
        ['3', '4'],
        [null, null],
        ['4', '4'],
      ]);
    });

    it('should leave a row the menu grid hides out of the count', () => {
      const positions = renderPositions([
        { name: 'A' },
        { name: 'Hidden' },
        { name: 'B' },
      ], { hiddenRows: [1] });

      expect(positions[0]).toEqual(['1', '2']);
      expect(positions[2]).toEqual(['2', '2']);
    });

    it('should count a disabled item and an item that cannot be selected', () => {
      const positions = renderPositions([
        { name: 'A', disabled: true },
        { name: 'B', disableSelection: true },
        { name: 'C', checked: true },
      ]);

      expect(positions).toEqual([['1', '3'], ['2', '3'], ['3', '3']]);
    });

    it('should write no position when `ariaTags` is off', () => {
      const positions = renderPositions([{ name: 'A' }, { name: 'B' }], { ariaTags: false });

      expect(positions).toEqual([[null, null], [null, null]]);
    });
  });
  describe('the row of an item', () => {
    /**
     * Renders one item into a cell that sits in a table row, the way the menu grid renders it.
     *
     * @param {object} item The menu item definition under test.
     * @param {object} [settings] Settings the main instance should report.
     * @returns {{ TD: HTMLTableCellElement, TR: HTMLTableRowElement }}
     */
    function renderItemInRow(item, settings) {
      const { mainTableHot, menuHot } = createInstances(item, settings);
      const TR = document.createElement('tr');
      const TD = document.createElement('td');

      TR.appendChild(TD);
      createMenuItemRenderer(mainTableHot)(menuHot, TD, 0, 0, '0', item.name, {});

      return { TD, TR };
    }

    it('should take the row out of the accessibility tree, so the item is a child of the menu', () => {
      const { TD, TR } = renderItemInRow({ name: 'Insert row above' }, { ariaTags: true });

      expect(TR.getAttribute('role')).toBe('presentation');
      expect(TD.getAttribute('role')).toBe('menuitem');
    });

    it('should mark the row of a separator as well', () => {
      const { TD, TR } = renderItemInRow({ name: SEPARATOR }, { ariaTags: true });

      expect(TR.getAttribute('role')).toBe('presentation');
      expect(TD.getAttribute('role')).toBe('separator');
    });

    it('should write no role on the row when `ariaTags` is off', () => {
      const { TD, TR } = renderItemInRow({ name: 'Insert row above' }, { ariaTags: false });

      expect(TR.hasAttribute('role')).toBe(false);
      expect(TD.hasAttribute('role')).toBe(false);
    });

    it('should render a cell that sits in no row', () => {
      const { TD } = renderItem({ name: 'Insert row above' }, { ariaTags: true });

      expect(TD.parentElement).toBe(null);
      expect(TD.getAttribute('role')).toBe('menuitem');
    });
  });
});
