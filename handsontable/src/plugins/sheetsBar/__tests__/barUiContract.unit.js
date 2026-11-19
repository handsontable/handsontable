import Handsontable from '../../../base';
import { registerPlugin } from '../../registry';
import { SheetsBar } from '../sheetsBar';
import { TabStrip } from '../ui/tabStrip';
import { syncIcon } from '../../../themes/engine/icons';
import EventManager from '../../../eventManager';
import { TEST_LICENSE_KEY } from '../../../../test/helpers/licenseKey';

const TWO_SHEETS = [{ name: 'Alpha', data: [['a']] }, { name: 'Beta', data: [['b']] }];

/**
 * Builds a standalone tab strip, with no grid behind it.
 *
 * @param {object[]} sheets The tab descriptors.
 * @returns {{ host: HTMLElement, strip: TabStrip }}
 */
function buildTabStrip(sheets) {
  const host = document.createElement('div');

  document.body.appendChild(host);

  const strip = new TabStrip({
    host,
    dragRoot: host,
    eventManager: new EventManager({}),
    translate: key => key,
    ariaTags: true,
    isRtl: false,
    syncIcon: (container, slotClass, name, options) =>
      syncIcon({ rootDocument: document, themeManager: null }, container, slotClass, name, options),
    rootWindow: window,
    labelIdPrefix: 'contract-sheet-tab-label',
  });

  strip.render(sheets);

  return { host, strip };
}

describe('SheetsBar UI contract', () => {
  let container;
  let hot;

  beforeAll(() => {
    registerPlugin(SheetsBar);
  });

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    hot?.destroy();
    hot = null;
    container.remove();
  });

  /**
   * Builds a grid with two sheets and any extra bar settings.
   *
   * @param {object} [barSettings] Extra `sheetsBar` settings.
   * @returns {object}
   */
  function createGrid(barSettings = {}) {
    hot = new Handsontable(container, {
      sheetsBar: { sheets: TWO_SHEETS.map(sheet => ({ ...sheet })), ...barSettings },
      licenseKey: TEST_LICENSE_KEY,
    });

    return hot;
  }

  /**
   * Returns the bar's tabs.
   *
   * @returns {HTMLElement[]}
   */
  function tabs() {
    return Array.from(hot.rootWrapperElement.querySelectorAll('.ht-sheets-bar__tab'));
  }

  describe('ARIA', () => {
    it('groups the tabs under the "Sheets" label', () => {
      createGrid();

      const strip = hot.rootWrapperElement.querySelector('.ht-sheets-bar__tabs');

      expect(strip.getAttribute('role')).toBe('group');
      expect(strip.getAttribute('aria-label')).toBe('Sheets');
    });

    it('hides the check mark of the active sheet in the all-sheets menu from assistive technology', () => {
      createGrid();

      hot.rootWrapperElement.querySelector('.ht-sheets-bar__all').click();

      const marks = document.querySelectorAll('.htSheetsBarMenu td .selected');

      expect(marks.length).toBe(1);
      expect(marks[0].getAttribute('aria-hidden')).toBe('true');
    });

    it('names the tab menu after the sheet it acts on', () => {
      createGrid();

      tabs()[0].querySelector('.ht-sheets-bar__tab-chevron').click();

      const menu = Array.from(document.querySelectorAll('.htSheetsBarMenu'))
        .find(element => element.getAttribute('aria-label')?.startsWith('Sheet actions'));

      expect(menu.getAttribute('aria-label')).toBe('Sheet actions: Alpha');
    });
  });

  describe('keyboard', () => {
    it('leaves Enter to the IME while the browser reports an unfinished character (keyCode 229)', () => {
      createGrid();

      const tab = tabs()[0];

      tab.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));

      const input = tab.querySelector('.ht-sheets-bar__tab-rename');

      input.value = 'にほ';
      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', keyCode: 229, bubbles: true }));

      expect(tab.querySelector('.ht-sheets-bar__tab-rename')).toBe(input);
      expect(hot.getPlugin('sheetsBar').getSheets()[0].name).toBe('Alpha');
    });

    it('opens the tab menu with Enter without running its first item on the same keystroke', () => {
      createGrid();

      const startRename = jest.spyOn(TabStrip.prototype, 'startRename');
      const chevron = tabs()[0].querySelector('.ht-sheets-bar__tab-chevron');

      chevron.click();
      document.activeElement.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));

      expect(tabs()[0].getAttribute('aria-expanded')).toBe('false');

      hot.listen();
      hot.getFocusScopeManager().activateScope('sheetsBar');
      tabs()[0].focus();
      document.activeElement.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }),
      );

      expect(startRename).not.toHaveBeenCalled();
      expect(tabs()[0].querySelector('.ht-sheets-bar__tab-rename')).toBe(null);
      expect(tabs()[0].getAttribute('aria-expanded')).toBe('true');
    });

    it('leaves the hidden controls out of the bar\'s Tab stops', () => {
      createGrid({ controls: false });

      hot.listen();
      hot.getFocusScopeManager().activateScope('sheetsBar', 'tab_from_above');

      expect(document.activeElement).toBe(tabs()[0]);
    });
  });

  describe('drag threshold', () => {
    /**
     * Presses the first tab at x = 50 and moves the pointer by `distance` pixels.
     *
     * @param {number} distance The horizontal move.
     * @returns {boolean} Whether the tab is being dragged.
     */
    function pressAndMove(distance) {
      const sheets = [{ id: 1, name: 'A', isActive: true }, { id: 2, name: 'B', isActive: false }];
      const { host, strip } = buildTabStrip(sheets);
      const tab = host.querySelector('[data-sheet-id="1"]');

      tab.setPointerCapture = jest.fn();
      tab.releasePointerCapture = jest.fn();
      tab.querySelector('.ht-sheets-bar__tab-label')
        .dispatchEvent(new MouseEvent('pointerdown', { bubbles: true, button: 0, clientX: 50 }));
      host.ownerDocument.dispatchEvent(new MouseEvent('pointermove', { bubbles: true, clientX: 50 + distance }));

      const dragging = tab.classList.contains('ht-sheets-bar__tab--dragging');

      host.ownerDocument.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      strip.destroy();
      host.remove();

      return dragging;
    }

    it('starts a drag once the pointer moves 4 pixels', () => {
      expect(pressAndMove(4)).toBe(true);
      expect(pressAndMove(10)).toBe(true);
    });

    it('keeps a press that moved less than 4 pixels a click', () => {
      expect(pressAndMove(3)).toBe(false);
    });
  });
});
