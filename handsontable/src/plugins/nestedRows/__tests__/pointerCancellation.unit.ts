import Handsontable from 'handsontable/base';
import { registerPlugin, NestedRows } from 'handsontable/plugins';
import { injectRealCoreStyles, removeRealCoreStyles } from '../../../../test/helpers/realCoreStyles';
import { markLongPressReplay } from 'handsontable/helpers/dom/longPress';
import { TEST_LICENSE_KEY } from '../../../../test/helpers/licenseKey';

registerPlugin(NestedRows);

/**
 * A press on the nesting button is claimed at once, but the parent toggles when the pointer is released
 * over the same button, so the user can cancel it by moving off before letting go.
 */
describe('NestedRows pointer cancellation', () => {
  let container: HTMLDivElement;
  let hot: Handsontable;

  beforeEach(() => {
    // Rows past the second are outside the jsdom viewport under the Jest core styles stub.
    injectRealCoreStyles();
    container = document.createElement('div');
    document.body.appendChild(container);

    // Two parents with one child each: physical rows A (0), A1 (1), B (2), B1 (3).
    hot = new Handsontable(container, {
      data: [
        { name: 'A', __children: [{ name: 'A1' }] },
        { name: 'B', __children: [{ name: 'B1' }] },
      ],
      rowHeaders: true,
      nestedRows: true,
      licenseKey: TEST_LICENSE_KEY,
    });
  });

  afterEach(() => {
    hot.destroy();
    container.remove();
    removeRealCoreStyles();
  });

  /**
   * The nesting button of a parent row, found again on every call because a render replaces it.
   */
  function button(visualRow: number) {
    return (hot.getCell(visualRow, -1, true) as HTMLElement).querySelector<HTMLElement>('.ht_nestingButton')!;
  }

  function pressHold(element: Element, init: MouseEventInit = {}) {
    const press = new MouseEvent('mousedown', { bubbles: true, cancelable: true, button: 0, ...init });

    element.dispatchEvent(press);

    return press;
  }

  function release(element: Element, init: MouseEventInit = {}) {
    element.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true, button: 0, ...init }));
  }

  const collapsed = () => hot.getPlugin('nestedRows').getCollapsedParents();

  it('should not collapse the parent on the press alone, and collapse it on the release over the button', () => {
    const beforeRowCollapse = jest.fn();

    hot.addHook('beforeRowCollapse', beforeRowCollapse);
    pressHold(button(0));

    expect(collapsed()).toEqual([]);
    expect(beforeRowCollapse).not.toHaveBeenCalled();
    // The press is still claimed: it selects nothing.
    expect(hot.getSelected()).toBeUndefined();

    release(button(0));

    expect(collapsed()).toEqual([0]);
    expect(beforeRowCollapse).toHaveBeenCalledTimes(1);
    expect(hot.getSelected()).toBeUndefined();
  });

  it('should expand a collapsed parent on the release, not on the press', () => {
    hot.getPlugin('nestedRows').collapseParent(0);

    expect(collapsed()).toEqual([0]);

    pressHold(button(0));

    expect(collapsed()).toEqual([0]);

    release(button(0));

    expect(collapsed()).toEqual([]);
  });

  it('should not toggle the parent when the pointer is released over another parent, a cell, or outside the grid', () => {
    pressHold(button(0));
    release(button(2));

    expect(collapsed()).toEqual([]);

    pressHold(button(0));
    release(hot.getCell(0, 0)!);

    expect(collapsed()).toEqual([]);

    pressHold(button(0));
    release(document.body);

    expect(collapsed()).toEqual([]);

    // A cancelled press leaves nothing armed: the next click works.
    pressHold(button(0));
    release(button(0));

    expect(collapsed()).toEqual([0]);
  });

  it('should cancel a held press on Escape', () => {
    pressHold(button(0));
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    release(button(0));

    expect(collapsed()).toEqual([]);
  });

  it('should toggle the parent when the button node is replaced between the press and the release', () => {
    const original = button(0);

    pressHold(original);

    const replacement = original.cloneNode(true) as HTMLElement;

    original.replaceWith(replacement);
    release(replacement);

    expect(collapsed()).toEqual([0]);
  });

  it('should replace a press whose release was lost with the next press', () => {
    // The release of the first press is lost: the second press must act once, on its own release.
    pressHold(button(0));
    pressHold(button(0));

    expect(collapsed()).toEqual([]);

    release(button(0));

    expect(collapsed()).toEqual([0]);

    release(button(0));

    expect(collapsed()).toEqual([0]);
  });

  it('should collapse the parent at once on a tap whose event is not a TouchEvent of this window', () => {
    const target = button(0);
    const tap = Object.assign(new Event('nested-rows-test-frame-tap', { bubbles: true, cancelable: true }), {
      touches: [],
      changedTouches: [],
    });

    target.dispatchEvent(tap);

    expect(tap instanceof TouchEvent).toBe(false);

    hot.runHooks('beforeOnCellMouseDown', tap, hot.getCoords(target.closest('th')!), target.closest('th'),
      { row: false, column: false, cell: false });

    expect(collapsed()).toEqual([0]);
  });

  it('should drop a held press when the plugin is rebuilt', () => {
    pressHold(button(0));
    hot.updateSettings({ nestedRows: false });
    hot.updateSettings({ nestedRows: true });
    release(button(0));

    expect(collapsed()).toEqual([]);
  });

  it('should collapse the parent at once on a tap: Walkontable replays it at `touchend`', () => {
    const target = button(0);
    const tap = new TouchEvent('nested-rows-test-tap', { bubbles: true, cancelable: true });

    target.dispatchEvent(tap);
    hot.runHooks('beforeOnCellMouseDown', tap, hot.getCoords(target.closest('th')!), target.closest('th'),
      { row: false, column: false, cell: false });

    expect(collapsed()).toEqual([0]);
  });

  it('should claim a long press and not toggle the parent: it is replayed while the finger is down', () => {
    const target = button(0);
    const longPress = new TouchEvent('nested-rows-test-long-press', { bubbles: true, cancelable: true });

    target.dispatchEvent(longPress);
    markLongPressReplay(longPress);
    hot.runHooks('beforeOnCellMouseDown', longPress, hot.getCoords(target.closest('th')!), target.closest('th'),
      { row: false, column: false, cell: false });

    expect(collapsed()).toEqual([]);
    expect(longPress.cancelBubble).toBe(true);
  });
});
