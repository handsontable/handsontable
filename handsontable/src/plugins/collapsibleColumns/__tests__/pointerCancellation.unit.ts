import Handsontable from 'handsontable/base';
import {
  registerPlugin,
  CollapsibleColumns,
  NestedHeaders,
} from 'handsontable/plugins';
import { markLongPressReplay } from 'handsontable/helpers/dom/longPress';
import { TEST_LICENSE_KEY } from '../../../../test/helpers/licenseKey';

registerPlugin(CollapsibleColumns);
registerPlugin(NestedHeaders);

/**
 * A press on the indicator is claimed at once, but the group toggles when the pointer is released over
 * the same indicator, so the user can cancel it by moving off before letting go.
 */
describe('CollapsibleColumns pointer cancellation', () => {
  let container: HTMLDivElement;
  let hot: Handsontable;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);

    hot = new Handsontable(container, {
      data: [[1, 2, 3, 4]],
      colHeaders: true,
      nestedHeaders: [
        [{ label: 'G1', colspan: 2 }, { label: 'G2', colspan: 2 }],
        ['A', 'B', 'C', 'D'],
      ],
      collapsibleColumns: true,
      licenseKey: TEST_LICENSE_KEY,
    });
  });

  afterEach(() => {
    hot.destroy();
    container.remove();
  });

  /**
   * The indicator of a group, found again on every call because a render replaces it.
   */
  function indicator(group: number) {
    return container.querySelectorAll<HTMLElement>('.ht_master .collapsibleIndicator')[group];
  }

  function pressHold(element: Element, init: MouseEventInit = {}) {
    const press = new MouseEvent('mousedown', { bubbles: true, cancelable: true, button: 0, ...init });

    element.dispatchEvent(press);

    return press;
  }

  function release(element: Element, init: MouseEventInit = {}) {
    element.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true, button: 0, ...init }));
  }

  const collapsed = () => hot.getPlugin('collapsibleColumns').getCollapsedColumns();

  it('should not collapse the group on the press alone, and collapse it on the release over the indicator', () => {
    const beforeColumnCollapse = jest.fn();

    hot.addHook('beforeColumnCollapse', beforeColumnCollapse);
    pressHold(indicator(0));

    expect(collapsed()).toEqual([]);
    expect(beforeColumnCollapse).not.toHaveBeenCalled();
    // The press is still claimed: it selects nothing.
    expect(hot.getSelected()).toBeUndefined();

    release(indicator(0));

    expect(collapsed()).toEqual([1]);
    expect(beforeColumnCollapse).toHaveBeenCalledTimes(1);
    expect(hot.getSelected()).toBeUndefined();
  });

  it('should expand a collapsed group on the release, not on the press', () => {
    hot.getPlugin('collapsibleColumns').collapseSection({ row: -2, col: 0 });

    expect(collapsed()).toEqual([1]);

    pressHold(indicator(0));

    expect(collapsed()).toEqual([1]);

    release(indicator(0));

    expect(collapsed()).toEqual([]);
  });

  it('should not toggle the group when the pointer is released over another header, a cell, or outside the grid', () => {
    pressHold(indicator(0));
    release(hot.getCell(-1, 1, true)!);

    expect(collapsed()).toEqual([]);

    pressHold(indicator(0));
    release(hot.getCell(0, 0)!);

    expect(collapsed()).toEqual([]);

    pressHold(indicator(0));
    release(document.body);

    expect(collapsed()).toEqual([]);

    // A cancelled press leaves nothing armed: the next click works.
    pressHold(indicator(0));
    release(indicator(0));

    expect(collapsed()).toEqual([1]);
  });

  it('should cancel a held press on Escape', () => {
    pressHold(indicator(0));
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    release(indicator(0));

    expect(collapsed()).toEqual([]);
  });

  it('should toggle the group when the indicator node is replaced between the press and the release', () => {
    const original = indicator(0);

    pressHold(original);

    const replacement = original.cloneNode(true) as HTMLElement;

    original.replaceWith(replacement);
    release(replacement);

    expect(collapsed()).toEqual([1]);
  });

  it('should not let a second press take the synthetic mouseup for the release of the first one', () => {
    // The release of the first press is lost: the second press must not act, nor be acted on twice.
    pressHold(indicator(0));
    pressHold(indicator(0));

    expect(collapsed()).toEqual([]);

    release(indicator(0));

    expect(collapsed()).toEqual([1]);

    release(indicator(0));

    expect(collapsed()).toEqual([1]);
  });

  it('should collapse the group at once on a tap whose event is not a TouchEvent of this window', () => {
    const target = indicator(0);
    const tap = Object.assign(new Event('collapsible-columns-test-frame-tap', { bubbles: true, cancelable: true }), {
      touches: [],
      changedTouches: [],
    });

    target.dispatchEvent(tap);

    expect(tap instanceof TouchEvent).toBe(false);

    hot.runHooks('beforeOnCellMouseDown', tap, hot.getCoords(target.closest('th')!), target.closest('th'),
      { row: false, column: false, cell: false });

    expect(collapsed()).toEqual([1]);
  });

  it('should drop a held press when the plugin is disabled', () => {
    pressHold(indicator(0));
    hot.updateSettings({ collapsibleColumns: false });
    hot.updateSettings({ collapsibleColumns: true });
    release(indicator(0));

    expect(collapsed()).toEqual([]);
  });

  it('should collapse the group at once on a tap: Walkontable replays it at `touchend`', () => {
    const target = indicator(0);
    const tap = new TouchEvent('collapsible-columns-test-tap', { bubbles: true, cancelable: true });

    target.dispatchEvent(tap);
    hot.runHooks('beforeOnCellMouseDown', tap, hot.getCoords(target.closest('th')!), target.closest('th'),
      { row: false, column: false, cell: false });

    expect(collapsed()).toEqual([1]);
  });

  it('should claim a long press and not toggle the group: it is replayed while the finger is down', () => {
    const target = indicator(0);
    const longPress = new TouchEvent('collapsible-columns-test-long-press', { bubbles: true, cancelable: true });

    target.dispatchEvent(longPress);
    markLongPressReplay(longPress);
    hot.runHooks('beforeOnCellMouseDown', longPress, hot.getCoords(target.closest('th')!), target.closest('th'),
      { row: false, column: false, cell: false });

    expect(collapsed()).toEqual([]);
    expect((longPress as unknown as { isImmediatePropagationEnabled: boolean }).isImmediatePropagationEnabled)
      .toBe(false);
  });
});
