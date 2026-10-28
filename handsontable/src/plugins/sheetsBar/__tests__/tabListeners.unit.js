import Handsontable from '../../../index';
import { SheetsBarMenus } from '../ui/menus';

const LICENSE_KEY = 'non-commercial-and-evaluation';

/**
 * The tab strip binds its tab listeners once, on the strip, when it is built. A listener is bound to the
 * context of the call that adds it (Angular's zone, for one), so listeners a repaint added to each tab took
 * the context of whatever code made the repaint.
 */
describe('SheetsBar: tab listeners', () => {
  let container;
  let hot;

  beforeAll(() => {
    Object.defineProperty(Element.prototype, 'scrollIntoView', { configurable: true, value: () => {} });
  });

  afterAll(() => {
    delete Element.prototype.scrollIntoView;
  });

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    hot?.destroy();
    hot = null;
    container.remove();
    jest.restoreAllMocks();
  });

  /**
   * Builds a workbook with two sheets.
   *
   * @returns {object} The SheetsBar plugin.
   */
  function buildWorkbook() {
    hot = new Handsontable(container, {
      licenseKey: LICENSE_KEY,
      sheetsBar: {
        sheets: [
          { name: 'First', data: [['a']] },
          { name: 'Second', data: [['b']] },
        ],
      },
    });

    return hot.getPlugin('sheetsBar');
  }

  /**
   * Returns the tab of a sheet.
   *
   * @param {string} name The sheet name.
   * @returns {HTMLElement}
   */
  function tabOf(name) {
    return Array.from(hot.rootWrapperElement.querySelectorAll('.ht-sheets-bar__tab'))
      .find(tab => tab.textContent.includes(name));
  }

  it('adds no listener to a tab when the strip repaints', () => {
    const plugin = buildWorkbook();
    const addEventListener = jest.spyOn(HTMLElement.prototype, 'addEventListener');

    plugin.addSheet();
    plugin.renameSheet(plugin.getSheets()[0].id, 'Renamed');
    plugin.setActiveSheet('Second');

    const tabTargets = addEventListener.mock.instances
      .filter(element => element.classList.contains('ht-sheets-bar__tab'));

    expect(addEventListener).toHaveBeenCalled();
    expect(tabTargets).toEqual([]);
  });

  it('switches to the clicked tab\'s sheet after the strip repainted', () => {
    const plugin = buildWorkbook();

    plugin.addSheet();
    tabOf('Second').dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(plugin.getSheets().find(sheet => sheet.isActive)?.name).toBe('Second');
  });

  it('answers a tab event once after the bar was turned off and on again', () => {
    buildWorkbook();

    const sheetsBar = hot.getSettings().sheetsBar;

    hot.updateSettings({ sheetsBar: false });
    hot.updateSettings({ sheetsBar });

    const opened = jest.spyOn(SheetsBarMenus.prototype, 'openTabMenu').mockImplementation(() => {});

    tabOf('First').dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true }));

    expect(opened).toHaveBeenCalledTimes(1);
  });

  it('removes the strip listeners it added when the bar is turned off', () => {
    buildWorkbook();

    const strip = hot.rootWrapperElement.querySelector('.ht-sheets-bar__tabs');
    const added = jest.spyOn(strip, 'addEventListener');
    const removed = jest.spyOn(strip, 'removeEventListener');

    hot.updateSettings({ sheetsBar: false });

    const removedTabListeners = removed.mock.calls.filter(([type]) => type !== 'scroll');

    expect(added).not.toHaveBeenCalled();
    expect(removedTabListeners.map(([type]) => type).sort())
      .toEqual(['click', 'contextmenu', 'dblclick', 'pointercancel', 'pointerdown', 'pointerup']);
    expect(new Set(removedTabListeners.map(([, listener]) => listener)).size).toBe(5);
  });
});
