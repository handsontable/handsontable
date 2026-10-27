import Handsontable from '../../../index';

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

  it('stops answering tab events once the bar is turned off', () => {
    const plugin = buildWorkbook();
    const strip = hot.rootWrapperElement.querySelector('.ht-sheets-bar__tabs');
    const removeEventListener = jest.spyOn(strip, 'removeEventListener');

    hot.updateSettings({ sheetsBar: false });

    expect(plugin.isEnabled()).toBe(false);
    const tabEvents = ['click', 'contextmenu', 'dblclick', 'pointercancel', 'pointerdown', 'pointerup'];

    expect(removeEventListener.mock.calls.map(([type]) => type)).toEqual(expect.arrayContaining(tabEvents));
  });
});
