import { createMenuItemRenderer } from 'handsontable/plugins/contextMenu/menu/menuItemRenderer';
import { isItemChecked, isItemCheckable } from 'handsontable/plugins/contextMenu/menu/utils';

const CHECK_MARK = String.fromCharCode(10003);

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
    menuHot: {
      getSourceDataAtRow: () => item,
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
      expect(wrapper.textContent).toBe('Read only');
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
});
