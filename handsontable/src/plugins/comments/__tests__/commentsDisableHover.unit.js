import Handsontable from '../../../index';
import DisplaySwitch from '../displaySwitch';
import { TEST_LICENSE_KEY } from '../../../../test/helpers/licenseKey';

const LICENSE_KEY = TEST_LICENSE_KEY;

/**
 * Moves the pointer onto an element the way a browser reports it to the Comments plugin.
 *
 * @param {HTMLElement} element The element under the pointer.
 */
function hover(element) {
  element.dispatchEvent(new MouseEvent('mouseover', { bubbles: true, clientX: 5, clientY: 5 }));
}

describe('Comments hover armed before the plugin is turned off', () => {
  let container;
  let hot;

  beforeAll(() => {
    Object.defineProperty(document, 'elementFromPoint', { configurable: true, value: () => null });
  });

  afterAll(() => {
    delete document.elementFromPoint;
  });

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    jest.useRealTimers();
    hot?.destroy();
    hot = null;
    container.remove();
  });

  it('does not open the comment editor once the plugin is off', () => {
    hot = new Handsontable(container, {
      data: [['a', 'b'], ['c', 'd']],
      comments: { displayDelay: 300 },
      cell: [{ row: 0, col: 0, comment: { value: 'Hello' } }],
      licenseKey: LICENSE_KEY,
    });
    const plugin = hot.getPlugin('comments');
    const showAtCell = jest.spyOn(plugin, 'showAtCell');

    jest.useFakeTimers();
    hover(hot.getCell(0, 0));
    jest.advanceTimersByTime(50);

    hot.updateSettings({ comments: false });
    jest.advanceTimersByTime(600);

    expect(plugin.enabled).toBe(false);
    expect(showAtCell).not.toHaveBeenCalled();
  });

  it('still opens the comment editor after the delay while the plugin stays on', () => {
    hot = new Handsontable(container, {
      data: [['a', 'b'], ['c', 'd']],
      comments: { displayDelay: 300 },
      cell: [{ row: 0, col: 0, comment: { value: 'Hello' } }],
      licenseKey: LICENSE_KEY,
    });
    const showAtCell = jest.spyOn(hot.getPlugin('comments'), 'showAtCell');

    jest.useFakeTimers();
    hover(hot.getCell(0, 0));
    jest.advanceTimersByTime(600);

    expect(showAtCell).toHaveBeenCalledWith(0, 0);
  });

  it('does not open the comment editor on a sheet with the plugin off reached during the delay', () => {
    hot = new Handsontable(container, {
      sheetsBar: {
        sheets: [
          {
            name: 'A',
            data: [['a', 'b'], ['c', 'd']],
            settings: { comments: { displayDelay: 300 }, cell: [{ row: 0, col: 0, comment: { value: 'Hello' } }] },
          },
          { name: 'B', data: [['x']], settings: { comments: false } },
        ],
      },
      licenseKey: LICENSE_KEY,
    });
    const plugin = hot.getPlugin('comments');
    const showAtCell = jest.spyOn(plugin, 'showAtCell');

    jest.useFakeTimers();
    hover(hot.getCell(0, 0));
    jest.advanceTimersByTime(50);

    hot.getPlugin('sheetsBar').setActiveSheet('B');
    jest.advanceTimersByTime(600);

    expect(plugin.enabled).toBe(false);
    expect(showAtCell).not.toHaveBeenCalled();
  });
});

describe('DisplaySwitch#cancel', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it('drops a pending show', () => {
    const displaySwitch = new DisplaySwitch(300);
    const onShow = jest.fn();

    jest.useFakeTimers();
    displaySwitch.addLocalHook('show', onShow);
    displaySwitch.show({ from: { row: 0, col: 0 } });
    displaySwitch.cancel();
    jest.advanceTimersByTime(600);

    expect(onShow).not.toHaveBeenCalled();
  });

  it('drops a pending hide', () => {
    const displaySwitch = new DisplaySwitch(300);
    const onHide = jest.fn();

    jest.useFakeTimers();
    displaySwitch.addLocalHook('hide', onHide);
    displaySwitch.hide();
    displaySwitch.cancel();
    jest.advanceTimersByTime(600);

    expect(onHide).not.toHaveBeenCalled();
    expect(displaySwitch.hidingTimer).toBeNull();
  });

  it('does not carry a canceled show over to a rebuild with another delay', () => {
    const displaySwitch = new DisplaySwitch(300);
    const onShow = jest.fn();

    jest.useFakeTimers();
    displaySwitch.addLocalHook('show', onShow);
    displaySwitch.show({ from: { row: 0, col: 0 } });
    displaySwitch.cancel();
    displaySwitch.updateDelay(100);
    jest.advanceTimersByTime(600);

    expect(onShow).not.toHaveBeenCalled();
  });

  it('drops a pending show on destroy', () => {
    const displaySwitch = new DisplaySwitch(300);

    jest.useFakeTimers();
    displaySwitch.show({ from: { row: 0, col: 0 } });
    displaySwitch.hide();
    displaySwitch.destroy();

    expect(jest.getTimerCount()).toBe(0);
  });
});

describe('Comments hover armed before the grid\'s data changes', () => {
  let container;
  let hot;

  beforeAll(() => {
    Object.defineProperty(document, 'elementFromPoint', { configurable: true, value: () => null });
  });

  afterAll(() => {
    delete document.elementFromPoint;
  });

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    jest.useRealTimers();
    hot?.destroy();
    hot = null;
    container.remove();
  });

  /**
   * Builds a grid with a comment on cell (0, 0) shown 300 ms after the pointer rests on it.
   *
   * @param {Array} data The grid's data.
   * @returns {object} The Comments plugin.
   */
  function build(data) {
    hot = new Handsontable(container, {
      data,
      comments: { displayDelay: 300 },
      cell: [{ row: 0, col: 0, comment: { value: 'Hello' } }],
      licenseKey: LICENSE_KEY,
    });

    return hot.getPlugin('comments');
  }

  it('still shows the comment when a wrapper sends the same data again during the delay', () => {
    const data = [['a', 'b'], ['c', 'd']];
    const plugin = build(data);
    const showAtCell = jest.spyOn(plugin, 'showAtCell');

    jest.useFakeTimers();
    hover(hot.getCell(0, 0));
    jest.advanceTimersByTime(50);
    hot.updateSettings({ data });
    jest.advanceTimersByTime(600);

    expect(showAtCell).toHaveBeenCalledWith(0, 0);
  });

  it('still shows the comment when `updateData()` replaces the rows during the delay', () => {
    const plugin = build([['a', 'b'], ['c', 'd']]);
    const showAtCell = jest.spyOn(plugin, 'showAtCell');

    jest.useFakeTimers();
    hover(hot.getCell(0, 0));
    jest.advanceTimersByTime(50);
    hot.updateData([['e', 'f'], ['g', 'h']]);
    jest.advanceTimersByTime(600);

    expect(showAtCell).toHaveBeenCalledWith(0, 0);
  });

  it('still hides the open comment when a wrapper sends the same data again during the hide delay', () => {
    const data = [['a', 'b'], ['c', 'd']];
    const plugin = build(data);

    plugin.showAtCell(0, 0);

    expect(plugin.getEditorInputElement().parentElement.style.display).toBe('block');

    jest.useFakeTimers();
    hover(hot.getCell(1, 1));
    jest.advanceTimersByTime(50);
    hot.updateSettings({ data });
    jest.advanceTimersByTime(600);

    expect(plugin.getEditorInputElement().parentElement.style.display).not.toBe('block');
  });

  it('drops the show when `loadData()` leaves the hovered cell without a comment', () => {
    hot = new Handsontable(container, {
      data: [['a', 'b'], ['c', 'd']],
      comments: { displayDelay: 300 },
      licenseKey: LICENSE_KEY,
    });

    const plugin = hot.getPlugin('comments');
    const showAtCell = jest.spyOn(plugin, 'showAtCell');

    plugin.setCommentAtCell(0, 0, 'Hello');

    jest.useFakeTimers();
    hover(hot.getCell(0, 0));
    jest.advanceTimersByTime(50);
    hot.loadData([['e', 'f'], ['g', 'h']]);
    jest.advanceTimersByTime(600);

    expect(plugin.getCommentAtCell(0, 0)).toBeUndefined();
    expect(showAtCell).not.toHaveBeenCalled();
  });

  it('still shows the comment when `loadData()` keeps a comment on the hovered cell', () => {
    const data = [['a', 'b'], ['c', 'd']];

    hot = new Handsontable(container, {
      data,
      comments: { displayDelay: 300 },
      cells: (row, col) => (row === 0 && col === 0 ? { comment: { value: 'Hello' } } : {}),
      licenseKey: LICENSE_KEY,
    });

    const plugin = hot.getPlugin('comments');
    const showAtCell = jest.spyOn(plugin, 'showAtCell');

    jest.useFakeTimers();
    hover(hot.getCell(0, 0));
    jest.advanceTimersByTime(50);
    hot.loadData(data);
    jest.advanceTimersByTime(600);

    expect(showAtCell).toHaveBeenCalledWith(0, 0);
  });

  it('still hides the open comment when `loadData()` runs during the hide delay', () => {
    const plugin = build([['a', 'b'], ['c', 'd']]);

    plugin.showAtCell(0, 0);

    expect(plugin.getEditorInputElement().parentElement.style.display).toBe('block');

    jest.useFakeTimers();
    hover(hot.getCell(1, 1));
    jest.advanceTimersByTime(50);
    hot.loadData([['e', 'f'], ['g', 'h']]);
    jest.advanceTimersByTime(600);

    expect(plugin.getEditorInputElement().parentElement.style.display).not.toBe('block');
  });
});

