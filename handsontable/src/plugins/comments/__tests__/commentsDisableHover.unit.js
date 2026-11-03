import Handsontable from '../../../index';
import DisplaySwitch from '../displaySwitch';

const LICENSE_KEY = 'non-commercial-and-evaluation';

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
