import HyperFormula from 'hyperformula';
import Handsontable from '../../../base';
import { registerLanguageDictionary } from '../../../i18n/registry';
import plPL from '../../../i18n/languages/pl-PL';
import { registerPlugin } from '../../registry';
import { SheetsBar } from '../sheetsBar';
import { ManualRowResize } from '../../manualRowResize/manualRowResize';
import { Comments } from '../../comments/comments';
import { AutoColumnSize } from '../../autoColumnSize/autoColumnSize';
import { ColumnSorting } from '../../columnSorting/columnSorting';
import { Formulas } from '../../formulas/formulas';
import { HiddenRows } from '../../hiddenRows/hiddenRows';
import { TrimRows } from '../../trimRows/trimRows';
import { SheetsBarMenus } from '../ui/menus';
import { Menu } from '../../contextMenu/menu';
import { SheetsBarUI } from '../ui/bar';
import { TabStrip } from '../ui/tabStrip';
import { TabDrag } from '../ui/tabDrag';
import EventManager from '../../../eventManager';

/**
 * Intercepts the tab menu's `SheetsBarMenus#openTabMenu` call for the given sheet and returns
 * the actions object the plugin passed in, so remove/duplicate/rename/moveRight/moveLeft can be
 * exercised directly without opening a real `Menu`.
 *
 * Right-click is the one gesture that opens the menu of any tab: the trigger glyph answers on
 * the active tab alone, and on any other tab a left click means "move there" instead.
 * @param hot
 * @param sheetId
 */
function getTabMenuActions(hot, sheetId) {
  let actions = null;

  jest.spyOn(SheetsBarMenus.prototype, 'openTabMenu').mockImplementation((anchor, options) => {
    actions = options.actions;
  });

  hot.rootWrapperElement
    .querySelector(`[data-sheet-id="${sheetId}"]`)
    .dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true, button: 2 }));

  return actions;
}

const renderedTabStrips = [];
const renderTabStrip = TabStrip.prototype.render;

/**
 * Returns the `TabStrip` instance the plugin under test built. Strips register on every
 * render, so the most recent one is the live one.
 */
function liveTabStrip() {
  return renderedTabStrips[renderedTabStrips.length - 1];
}

TabStrip.prototype.render = function(...args) {
  if (!renderedTabStrips.includes(this)) {
    renderedTabStrips.push(this);
  }

  return renderTabStrip.apply(this, args);
};

/**
 * Builds a standalone `TabStrip` (no `Handsontable` instance) rendered with the given sheet
 * descriptors, so pointer wiring can be exercised in isolation from the plugin.
 * @param sheets
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
  });

  strip.render(sheets);

  return { host, strip };
}

describe('SheetsBar plugin', () => {
  let container;
  let hot;

  beforeAll(() => {
    registerPlugin(SheetsBar);
    registerPlugin(ManualRowResize);
    registerPlugin(Comments);
    registerPlugin(AutoColumnSize);
    registerPlugin(ColumnSorting);
    registerPlugin(Formulas);
    registerPlugin(HiddenRows);
    registerPlugin(TrimRows);
    Object.defineProperty(Element.prototype, 'scrollIntoView', { configurable: true, value: () => {} });
  });

  afterAll(() => {
    delete Element.prototype.scrollIntoView;
    TabStrip.prototype.render = renderTabStrip;
  });

  beforeEach(() => {
    renderedTabStrips.length = 0;
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    hot?.destroy();
    hot = null;
    container.remove();
    jest.restoreAllMocks();
  });

  it('creates a default sheet from grid data when `sheets` is omitted', () => {
    hot = new Handsontable(container, {
      data: [['a', 'b']],
      sheetsBar: true,
      licenseKey: 'non-commercial-and-evaluation',
    });

    const sheets = hot.getPlugin('sheetsBar').getSheets();

    expect(sheets.length).toBe(1);
    expect(sheets[0].name).toBe('Sheet1');
    expect(sheets[0].isActive).toBe(true);
  });

  it('builds the workbook from the `sheets` setting and activates `activeSheet`', () => {
    hot = new Handsontable(container, {
      sheetsBar: {
        sheets: [
          { name: 'One', data: [['1']] },
          { name: 'Two', data: [['2']] },
        ],
        activeSheet: 1,
      },
      licenseKey: 'non-commercial-and-evaluation',
    });

    expect(hot.getPlugin('sheetsBar').getSheets().map(s => s.name)).toEqual(['One', 'Two']);
    expect(hot.getPlugin('sheetsBar').getSheets()[1].isActive).toBe(true);
    expect(hot.getDataAtCell(0, 0)).toBe('2');
  });

  it('setActiveSheet loads the target sheet data and fires the change hooks once', () => {
    const before = jasmine.createSpy('before');
    const after = jasmine.createSpy('after');

    hot = new Handsontable(container, {
      sheetsBar: { sheets: [{ name: 'A', data: [['a']] }, { name: 'B', data: [['b']] }] },
      beforeSheetTabChange: before,
      afterSheetTabChange: after,
      licenseKey: 'non-commercial-and-evaluation',
    });

    expect(hot.getPlugin('sheetsBar').setActiveSheet('B')).toBe(true);
    expect(hot.getDataAtCell(0, 0)).toBe('b');
    expect(before).toHaveBeenCalledTimes(1);
    expect(after).toHaveBeenCalledTimes(1);
  });

  it('beforeSheetTabChange returning false cancels the switch', () => {
    hot = new Handsontable(container, {
      sheetsBar: { sheets: [{ name: 'A', data: [['a']] }, { name: 'B', data: [['b']] }] },
      beforeSheetTabChange: () => false,
      licenseKey: 'non-commercial-and-evaluation',
    });

    expect(hot.getPlugin('sheetsBar').setActiveSheet('B')).toBe(false);
    expect(hot.getDataAtCell(0, 0)).toBe('a');
  });

  it('addSheet fires add hooks exactly once with the source tag', () => {
    const after = jasmine.createSpy('after');

    hot = new Handsontable(container, {
      data: [['x']],
      sheetsBar: true,
      afterSheetTabAdd: after,
      licenseKey: 'non-commercial-and-evaluation',
    });

    hot.getPlugin('sheetsBar').addSheet();

    expect(after).toHaveBeenCalledTimes(1);
    expect(after.calls.mostRecent().args[2]).toBe('SheetsBar.api');
  });

  it('applies per-sheet settings on switch with fallback to grid settings', () => {
    hot = new Handsontable(container, {
      rowHeaders: true,
      sheetsBar: {
        sheets: [
          { name: 'A', data: [['a']] },
          { name: 'B', data: [['b']], settings: { readOnly: true } },
        ],
      },
      licenseKey: 'non-commercial-and-evaluation',
    });

    hot.getPlugin('sheetsBar').setActiveSheet('B');

    expect(hot.getSettings().readOnly).toBe(true);
    expect(hot.getSettings().rowHeaders).toBe(true); // inherited, not wiped
  });

  it('does not carry one sheet\'s settings onto a sheet that does not declare them', () => {
    hot = new Handsontable(container, {
      sheetsBar: {
        sheets: [
          { name: 'Narrow', data: [['a', 'b']], settings: { columns: [{ data: 0 }, { data: 1 }] } },
          { name: 'Wide', data: [['a', 'b', 'c', 'd']] },
        ],
      },
      licenseKey: 'non-commercial-and-evaluation',
    });

    expect(hot.countCols()).toBe(2);

    hot.getPlugin('sheetsBar').setActiveSheet('Wide');

    // `columns` belongs to the first sheet. The second declares none, so the grid-level value
    // applies — otherwise the four columns of data would render through a two-column
    // description that no longer describes anything.
    expect(hot.countCols()).toBe(4);

    hot.getPlugin('sheetsBar').setActiveSheet('Narrow');

    expect(hot.countCols()).toBe(2);
  });

  it('drops the cell meta another sheet\'s columns declared', () => {
    hot = new Handsontable(container, {
      sheetsBar: {
        sheets: [
          {
            name: 'Typed',
            data: [['a']],
            settings: { columns: [{ data: 0, readOnly: true, className: 'from-typed' }] },
          },
          { name: 'Plain', data: [['b']] },
        ],
      },
      licenseKey: 'non-commercial-and-evaluation',
    });

    expect(hot.getCellMeta(0, 0).readOnly).toBe(true);
    expect(hot.getCellMeta(0, 0).className).toBe('from-typed');

    hot.getPlugin('sheetsBar').setActiveSheet('Plain');

    // `updateSettings()` treats `undefined` as "key not provided", so restoring the grid-level
    // value of `columns` has to say `null` — otherwise the previous sheet's column description
    // keeps applying to data it no longer describes.
    expect(hot.getCellMeta(0, 0).readOnly).toBe(false);
    expect(hot.getCellMeta(0, 0).className).toBe(undefined);
  });

  it('toggles a plugin declared on one sheet only, and comes back to it without throwing', () => {
    hot = new Handsontable(container, {
      sheetsBar: {
        sheets: [
          { name: 'Annotated', data: [['a']], settings: { comments: true } },
          { name: 'Plain', data: [['b']] },
        ],
      },
      licenseKey: 'non-commercial-and-evaluation',
    });

    const comments = () => hot.getPlugin('comments');

    expect(comments().enabled).toBe(true);

    // The sheet without `comments` restores the grid-level value, which turns the plugin off.
    hot.getPlugin('sheetsBar').setActiveSheet('Plain');

    expect(comments().enabled).toBe(false);

    // Coming back enables it a second time — the path that used to throw on the plugin's own
    // shortcut context, and the reason the round trip is asserted rather than the first switch.
    expect(() => hot.getPlugin('sheetsBar').setActiveSheet('Annotated')).not.toThrow();
    expect(comments().enabled).toBe(true);

    expect(() => {
      hot.getPlugin('sheetsBar').setActiveSheet('Plain');
      hot.getPlugin('sheetsBar').setActiveSheet('Annotated');
    }).not.toThrow();
  });

  it('measures the columns of an arriving sheet once, however many steps restore its view', () => {
    hot = new Handsontable(container, {
      sheetsBar: {
        sheets: [
          { name: 'A', data: [['a', 'b'], ['c', 'd']] },
          { name: 'B', data: [['e', 'f'], ['g', 'h']] },
        ],
      },
      licenseKey: 'non-commercial-and-evaluation',
    });

    // Give sheet A a view state worth restoring, so the switch back has a selection and a
    // scroll position to re-apply on top of loading the data.
    hot.selectCell(1, 1);
    hot.getPlugin('sheetsBar').setActiveSheet('B');

    const autoColumnSize = hot.getPlugin('autoColumnSize');
    const fullSweeps = jest.spyOn(autoColumnSize, 'calculateAllColumnsWidth');
    const visibleSweeps = jest.spyOn(autoColumnSize, 'calculateVisibleColumnsWidth');

    hot.getPlugin('sheetsBar').setActiveSheet('A');

    // Loading the data, restoring the view state, re-selecting and scrolling each ask for a
    // render of their own, and a render that arrives with `forceFullRender` throws the column
    // width cache away and samples the whole sheet again. Batched into two renders — the sheet
    // and its view state first, the selection and scroll once the sheet is painted at its own
    // sizes — the arriving sheet is measured once in full, and the visible columns once per
    // render. On a large sheet that is the difference between two sweeps of the data and four.
    expect(fullSweeps).toHaveBeenCalledTimes(1);
    expect(visibleSweeps).toHaveBeenCalledTimes(2);
    expect(hot.getSelectedLast()).toEqual([1, 1, 1, 1]);
  });

  it('keeps a moved row order on a sheet after visiting a sorted one', () => {
    hot = new Handsontable(container, {
      columnSorting: true,
      sheetsBar: {
        sheets: [
          { name: 'Sorted', data: [['b'], ['a'], ['c']] },
          { name: 'Moved', data: [['x'], ['y'], ['z']] },
        ],
      },
      licenseKey: 'non-commercial-and-evaluation',
    });
    const sheetsBar = hot.getPlugin('sheetsBar');

    hot.getPlugin('columnSorting').sort({ column: 0, sortOrder: 'asc' });
    sheetsBar.setActiveSheet('Moved');
    hot.rowIndexMapper.moveIndexes([2], 0);

    expect(hot.getDataAtCol(0)).toEqual(['z', 'x', 'y']);

    sheetsBar.setActiveSheet('Sorted');

    expect(hot.getDataAtCol(0)).toEqual(['a', 'b', 'c']);

    sheetsBar.setActiveSheet('Moved');

    expect(hot.getDataAtCol(0)).toEqual(['z', 'x', 'y']);
    expect(hot.getPlugin('columnSorting').getSortConfig()).toEqual([]);
  });

  it('clears a restored sort back to the data order, not to the sorted one', () => {
    hot = new Handsontable(container, {
      columnSorting: true,
      sheetsBar: {
        sheets: [
          { name: 'Sorted', data: [['b'], ['a'], ['c']] },
          { name: 'Other', data: [['x']] },
        ],
      },
      licenseKey: 'non-commercial-and-evaluation',
    });
    const sheetsBar = hot.getPlugin('sheetsBar');

    hot.getPlugin('columnSorting').sort({ column: 0, sortOrder: 'asc' });
    sheetsBar.setActiveSheet('Other');
    sheetsBar.setActiveSheet('Sorted');

    expect(hot.getDataAtCol(0)).toEqual(['a', 'b', 'c']);

    hot.getPlugin('columnSorting').clearSort();

    expect(hot.getDataAtCol(0)).toEqual(['b', 'a', 'c']);
  });

  it('hides the same rows after a round trip when trimming shifts the visual indexes', () => {
    hot = new Handsontable(container, {
      hiddenRows: true,
      trimRows: [0],
      sheetsBar: {
        sheets: [
          { name: 'A', data: [['trimmed'], ['hidden'], ['shown']] },
          { name: 'B', data: [['x']] },
        ],
      },
      licenseKey: 'non-commercial-and-evaluation',
    });
    const sheetsBar = hot.getPlugin('sheetsBar');

    hot.getPlugin('hiddenRows').hideRows([0]);

    expect(hot.getDataAtCell(0, 0)).toBe('hidden');

    sheetsBar.setActiveSheet('B');
    sheetsBar.setActiveSheet('A');

    expect(hot.getPlugin('trimRows').getTrimmedRows()).toEqual([0]);
    expect(hot.getPlugin('hiddenRows').getHiddenRows()).toEqual([0]);
    expect(hot.getDataAtCell(0, 0)).toBe('hidden');
    expect(hot.getDataAtCell(1, 0)).toBe('shown');
  });

  it('leaves the row order alone when the sheet data changed size while it was away', () => {
    const data = [['a'], ['b']];

    hot = new Handsontable(container, {
      sheetsBar: { sheets: [{ name: 'A', data }, { name: 'B', data: [['x']] }] },
      licenseKey: 'non-commercial-and-evaluation',
    });
    const sheetsBar = hot.getPlugin('sheetsBar');

    hot.rowIndexMapper.moveIndexes([1], 0);
    sheetsBar.setActiveSheet('B');
    data.push(['c']);
    sheetsBar.setActiveSheet('A');

    expect(hot.countRows()).toBe(3);
    expect(hot.getDataAtCol(0)).toEqual(['a', 'b', 'c']);
  });

  it('restores the selection and scroll position only once the arriving sheet has rendered', () => {
    hot = new Handsontable(container, {
      sheetsBar: { sheets: [{ name: 'A', data: [['a', 'b'], ['c', 'd']] }, { name: 'B', data: [['x']] }] },
      licenseKey: 'non-commercial-and-evaluation',
    });
    const sheetsBar = hot.getPlugin('sheetsBar');
    const rendersBeforeScroll = [];
    let renders = 0;

    hot.selectCell(1, 1);
    sheetsBar.setActiveSheet('B');
    hot.addHook('afterViewRender', () => {
      renders += 1;
    });
    jest.spyOn(hot, 'scrollViewportTo').mockImplementation(() => {
      rendersBeforeScroll.push(renders);

      return true;
    });

    let suspendedDuringHook = null;

    hot.addHook('afterSheetTabStateRestore', () => {
      suspendedDuringHook = hot.isRenderSuspended();
    });
    sheetsBar.setActiveSheet('A');

    expect(rendersBeforeScroll).toEqual([1]);
    expect(suspendedDuringHook).toBe(false);
    expect(hot.getSelected()).toEqual([[1, 1, 1, 1]]);
  });

  it('keeps one tracked entry per cell property however often it is written', () => {
    hot = new Handsontable(container, {
      sheetsBar: { sheets: [{ name: 'A', data: [['a']] }, { name: 'B', data: [['b']] }] },
      licenseKey: 'non-commercial-and-evaluation',
    });
    let captured = null;

    hot.addHook('afterSheetTabStateCapture', (id, viewState) => {
      captured = viewState;
    });

    for (let i = 0; i < 100; i += 1) {
      hot.setCellMeta(0, 0, 'valid', i % 2 === 0);
    }

    hot.getPlugin('sheetsBar').setActiveSheet('B');

    expect(captured.cellMeta).toEqual([{ row: 0, col: 0, key: 'valid', value: false }]);
  });

  it('starts a reconfigured workbook from the grid settings, not from the old baseline', () => {
    hot = new Handsontable(container, {
      sheetsBar: {
        sheets: [
          { name: 'Narrow', data: [['a', 'b']], settings: { columns: [{ data: 0 }, { data: 1 }] } },
          { name: 'Wide', data: [['a', 'b', 'c', 'd']] },
        ],
      },
      licenseKey: 'non-commercial-and-evaluation',
    });
    const sheetsBar = hot.getPlugin('sheetsBar');

    sheetsBar.setActiveSheet('Wide');
    hot.updateSettings({
      columns: [{ data: 0 }, { data: 1 }, { data: 2 }],
      sheetsBar: { sheets: [{ name: 'X', data: [['x', 'y', 'z']] }, { name: 'Y', data: [['p', 'q', 'r']] }] },
    });

    expect(hot.countCols()).toBe(3);

    sheetsBar.setActiveSheet('Y');

    expect(hot.countCols()).toBe(3);
  });

  it('reports the clamped name to the rename hooks and rejects bad input before them', () => {
    hot = new Handsontable(container, {
      sheetsBar: { sheets: [{ name: 'A', data: [['a']] }] },
      licenseKey: 'non-commercial-and-evaluation',
    });
    const sheetsBar = hot.getPlugin('sheetsBar');
    const before = jest.fn();
    const after = jest.fn();

    hot.addHook('beforeSheetTabRename', before);
    hot.addHook('afterSheetTabRename', after);

    const id = sheetsBar.getSheets()[0].id;
    const longName = 'x'.repeat(60);

    expect(sheetsBar.renameSheet(id, longName)).toBe(true);
    expect(before).toHaveBeenCalledWith(id, 'A', 'x'.repeat(50), 'SheetsBar.api');
    expect(after).toHaveBeenCalledWith(id, 'A', 'x'.repeat(50), 'SheetsBar.api');
    expect(sheetsBar.getSheets()[0].name).toBe('x'.repeat(50));

    before.mockClear();

    expect(sheetsBar.renameSheet(id, undefined)).toBe(false);
    expect(sheetsBar.renameSheet(999, 'B')).toBe(false);
    expect(sheetsBar.duplicateSheet(999)).toBe(null);
    expect(sheetsBar.removeSheet(999)).toBe(false);
    expect(before).not.toHaveBeenCalled();
  });

  it('leaves the bar alone when a sheet\'s settings try to reconfigure it', () => {
    hot = new Handsontable(container, {
      sheetsBar: {
        sheets: [
          { name: 'A', data: [['a']] },
          { name: 'B', data: [['b']], settings: { sheetsBar: { sheets: [{ name: 'Z' }] }, readOnly: true } },
        ],
      },
      licenseKey: 'non-commercial-and-evaluation',
    });
    const sheetsBar = hot.getPlugin('sheetsBar');

    sheetsBar.setActiveSheet('B');

    expect(sheetsBar.getSheets().map(sheet => sheet.name)).toEqual(['A', 'B']);
    expect(hot.getSettings().readOnly).toBe(true);
  });

  it('builds each menu once and refills it on every opening', () => {
    hot = new Handsontable(container, {
      sheetsBar: { sheets: [{ name: 'A', data: [['a']] }, { name: 'B', data: [['b']] }] },
      licenseKey: 'non-commercial-and-evaluation',
    });
    const filledMenus = new Set();

    jest.spyOn(Menu.prototype, 'setMenuItems').mockImplementation(function() {
      filledMenus.add(this);
    });
    jest.spyOn(Menu.prototype, 'open').mockImplementation(() => {});
    jest.spyOn(Menu.prototype, 'setPosition').mockImplementation(() => {});

    const activeTab = hot.rootWrapperElement.querySelector('.ht-sheets-bar__tab--active');

    activeTab.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true, button: 2 }));
    activeTab.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true, button: 2 }));
    hot.rootWrapperElement.querySelector('.ht-sheets-bar__all').click();
    hot.rootWrapperElement.querySelector('.ht-sheets-bar__all').click();

    expect(filledMenus.size).toBe(2);
    expect(Menu.prototype.setMenuItems).toHaveBeenCalledTimes(4);
  });

  it('opens the tab menu with an item selected when the context menu comes from the keyboard', () => {
    hot = new Handsontable(container, {
      sheetsBar: { sheets: [{ name: 'A', data: [['a']] }] },
      licenseKey: 'non-commercial-and-evaluation',
    });
    const opened = jest.spyOn(SheetsBarMenus.prototype, 'openTabMenu').mockImplementation(() => {});

    hot.rootWrapperElement.querySelector('.ht-sheets-bar__tab--active')
      .dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true, button: 0 }));

    expect(opened.mock.calls[0][1].selectFirstItem).toBe(true);
    expect(opened.mock.calls[0][1].sheetName).toBe('A');
  });

  it('registers a focus scope that walks the focus into the bar from either side', () => {
    hot = new Handsontable(container, {
      sheetsBar: { sheets: [{ name: 'A', data: [['a']] }, { name: 'B', data: [['b']] }] },
      licenseKey: 'non-commercial-and-evaluation',
    });
    const bar = hot.rootWrapperElement.querySelector('.ht-sheets-bar');

    hot.getFocusScopeManager().activateScope('sheetsBar', 'tab_from_above');

    expect(document.activeElement).toBe(bar.querySelector('.ht-sheets-bar__add'));

    hot.getFocusScopeManager().deactivateScope('sheetsBar');
    hot.getFocusScopeManager().activateScope('sheetsBar', 'tab_from_below');

    expect(document.activeElement).toBe(bar.querySelectorAll('.ht-sheets-bar__tab')[1]);
    expect(hot.getShortcutManager().getActiveContextName()).toBe('plugin:sheetsBar');

    hot.updateSettings({ sheetsBar: false });

    expect(() => hot.getFocusScopeManager().activateScope('sheetsBar')).toThrow();
  });

  it('drives the tabs from the keyboard through the bar\'s shortcut context', () => {
    hot = new Handsontable(container, {
      sheetsBar: {
        sheets: [{ name: 'A', data: [['a']] }, { name: 'B', data: [['b']] }, { name: 'C', data: [['c']] }],
      },
      licenseKey: 'non-commercial-and-evaluation',
    });
    const opened = jest.spyOn(SheetsBarMenus.prototype, 'openTabMenu').mockImplementation(() => {});
    const press = (key) => {
      const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });

      document.activeElement.dispatchEvent(event);

      return event;
    };
    const tabs = () => hot.rootWrapperElement.querySelectorAll('.ht-sheets-bar__tab');

    hot.listen();
    hot.getFocusScopeManager().activateScope('sheetsBar');
    tabs()[0].focus();

    press('ArrowRight');
    expect(document.activeElement).toBe(tabs()[1]);

    press('End');
    expect(document.activeElement).toBe(tabs()[2]);

    press('ArrowRight');
    expect(document.activeElement).toBe(tabs()[2]);

    press('Home');
    expect(document.activeElement).toBe(tabs()[0]);

    press('ArrowLeft');
    expect(document.activeElement).toBe(tabs()[0]);

    press('ArrowRight');

    const spaceOnInactive = press(' ');

    expect(hot.getDataAtCell(0, 0)).toBe('b');
    expect(spaceOnInactive.defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(tabs()[1]);
    expect(opened).not.toHaveBeenCalled();

    press('Enter');

    expect(opened).toHaveBeenCalledTimes(1);
    expect(opened.mock.calls[0][1].selectFirstItem).toBe(true);
  });

  it('mirrors the arrow keys under RTL', () => {
    hot = new Handsontable(container, {
      layoutDirection: 'rtl',
      sheetsBar: { sheets: [{ name: 'A', data: [['a']] }, { name: 'B', data: [['b']] }] },
      licenseKey: 'non-commercial-and-evaluation',
    });
    const tabs = hot.rootWrapperElement.querySelectorAll('.ht-sheets-bar__tab');

    hot.listen();
    hot.getFocusScopeManager().activateScope('sheetsBar');
    tabs[0].focus();
    document.activeElement.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));

    expect(document.activeElement).toBe(tabs[1]);
  });

  it('keeps the focus on a paging arrow that has just run out of strip', () => {
    hot = new Handsontable(container, {
      sheetsBar: { sheets: [{ name: 'A', data: [['a']] }, { name: 'B', data: [['b']] }] },
      licenseKey: 'non-commercial-and-evaluation',
    });
    const bar = hot.rootWrapperElement.querySelector('.ht-sheets-bar');
    const strip = bar.querySelector('.ht-sheets-bar__tabs');
    const next = bar.querySelector('.ht-sheets-bar__page-next');

    Object.defineProperty(strip, 'clientWidth', { configurable: true, value: 200 });
    Object.defineProperty(strip, 'scrollWidth', { configurable: true, value: 400 });
    strip.scrollLeft = 0;
    strip.dispatchEvent(new Event('scroll'));
    next.focus();
    next.click();
    strip.dispatchEvent(new Event('scroll'));

    expect(next.getAttribute('aria-disabled')).toBe('true');
    expect(document.activeElement).toBe(next);

    next.click();

    expect(strip.scrollLeft).toBe(200);
  });

  it('hands the focus to the neighbouring tab when the focused sheet is removed', () => {
    hot = new Handsontable(container, {
      sheetsBar: {
        sheets: [{ name: 'A', data: [['a']] }, { name: 'B', data: [['b']] }, { name: 'C', data: [['c']] }],
      },
      licenseKey: 'non-commercial-and-evaluation',
    });
    const sheetsBar = hot.getPlugin('sheetsBar');
    const tabs = () => hot.rootWrapperElement.querySelectorAll('.ht-sheets-bar__tab');

    tabs()[2].focus();
    sheetsBar.removeSheet(sheetsBar.getSheets()[2].id);

    expect(document.activeElement).toBe(tabs()[1]);

    tabs()[0].focus();
    sheetsBar.removeSheet(sheetsBar.getSheets()[0].id);

    expect(document.activeElement).toBe(tabs()[0]);
    expect(document.activeElement.textContent).toBe('B');
  });

  it('announces a switch made from the bar, not one made through the API', () => {
    hot = new Handsontable(container, {
      sheetsBar: { sheets: [{ name: 'A', data: [['a']] }, { name: 'B', data: [['b']] }] },
      licenseKey: 'non-commercial-and-evaluation',
    });
    const announce = jest.spyOn(SheetsBarUI.prototype, 'announce');

    hot.getPlugin('sheetsBar').setActiveSheet('B');

    expect(announce).not.toHaveBeenCalled();

    hot.rootWrapperElement.querySelectorAll('.ht-sheets-bar__tab')[0].click();

    expect(announce).toHaveBeenCalledWith('Sheet A activated');
  });

  it('announces a rename the model refused', () => {
    hot = new Handsontable(container, {
      sheetsBar: { sheets: [{ name: 'A', data: [['a']] }, { name: 'B', data: [['b']] }] },
      licenseKey: 'non-commercial-and-evaluation',
    });
    const announce = jest.spyOn(SheetsBarUI.prototype, 'announce');
    const tab = hot.rootWrapperElement.querySelector('.ht-sheets-bar__tab--active');

    tab.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));

    const input = tab.querySelector('.ht-sheets-bar__tab-rename');

    expect(tab.getAttribute('role')).toBe(null);

    input.value = 'B';
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));

    expect(hot.getPlugin('sheetsBar').getSheets()[0].name).toBe('A');
    expect(announce).toHaveBeenCalledWith('Sheet name not changed: B is already in use');
    expect(hot.rootWrapperElement.querySelector('.ht-sheets-bar__tab--active').getAttribute('role')).toBe('button');
  });

  it('leaves Enter and Escape to the IME while a character is being composed', () => {
    hot = new Handsontable(container, {
      sheetsBar: { sheets: [{ name: 'A', data: [['a']] }] },
      licenseKey: 'non-commercial-and-evaluation',
    });
    const tab = hot.rootWrapperElement.querySelector('.ht-sheets-bar__tab--active');

    tab.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));

    const input = tab.querySelector('.ht-sheets-bar__tab-rename');

    input.value = 'にほ';
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', isComposing: true, bubbles: true }));

    expect(tab.querySelector('.ht-sheets-bar__tab-rename')).toBe(input);

    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));

    expect(hot.getPlugin('sheetsBar').getSheets()[0].name).toBe('にほ');
  });

  it('counts the rename length in characters a reader sees', () => {
    hot = new Handsontable(container, {
      sheetsBar: { sheets: [{ name: 'A', data: [['a']] }] },
      licenseKey: 'non-commercial-and-evaluation',
    });
    const tab = hot.rootWrapperElement.querySelector('.ht-sheets-bar__tab--active');

    tab.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));

    const input = tab.querySelector('.ht-sheets-bar__tab-rename');
    const family = '👨‍👩‍👧‍👦';

    expect(input.hasAttribute('maxlength')).toBe(false);

    input.value = family.repeat(51);
    input.dispatchEvent(new Event('input', { bubbles: true }));

    expect(input.value).toBe(family.repeat(50));
  });

  it('lists the sheets as checkable menu items with the active one checked', () => {
    hot = new Handsontable(container, {
      sheetsBar: { sheets: [{ name: 'A', data: [['a']] }, { name: 'B', data: [['b']] }] },
      licenseKey: 'non-commercial-and-evaluation',
    });

    hot.rootWrapperElement.querySelector('.ht-sheets-bar__all').click();

    const rows = document.querySelectorAll('.htSheetsBarMenu td');

    expect(rows.length).toBe(2);
    expect(rows[0].getAttribute('role')).toBe('menuitemcheckbox');
    expect(rows[0].getAttribute('aria-checked')).toBe('true');
    expect(rows[0].getAttribute('aria-label')).toBe('A');
    expect(rows[1].getAttribute('aria-checked')).toBe('false');
    expect(rows[0].querySelector('.htItemWrapper').dir).toBe('auto');
  });

  it('advertises the menu on the active tab only, and nothing when ariaTags is off', () => {
    hot = new Handsontable(container, {
      sheetsBar: { sheets: [{ name: 'A', data: [['a']] }, { name: 'B', data: [['b']] }] },
      licenseKey: 'non-commercial-and-evaluation',
    });
    let tabs = hot.rootWrapperElement.querySelectorAll('.ht-sheets-bar__tab');

    expect(tabs[0].getAttribute('aria-haspopup')).toBe('menu');
    expect(tabs[1].getAttribute('aria-haspopup')).toBe(null);
    expect(tabs[1].getAttribute('aria-expanded')).toBe(null);
    expect(tabs[0].querySelector('.ht-sheets-bar__tab-label').dir).toBe('auto');

    hot.updateSettings({ ariaTags: false, sheetsBar: { sheets: [{ name: 'A', data: [['a']] }] } });
    tabs = hot.rootWrapperElement.querySelectorAll('.ht-sheets-bar__tab');

    expect(tabs[0].getAttribute('role')).toBe(null);
    expect(tabs[0].getAttribute('aria-current')).toBe(null);
    expect(tabs[0].tabIndex).toBe(0);
    expect(hot.rootWrapperElement.querySelector('.ht-sheets-bar__tabs').getAttribute('role')).toBe(null);
    expect(hot.rootWrapperElement.querySelector('.ht-sheets-bar__add').getAttribute('aria-label')).toBe('Add sheet');
  });

  it('registers every formula-bound sheet in the shared engine before it is visited', () => {
    const engine = HyperFormula.buildEmpty({ licenseKey: 'internal-use-in-handsontable' });

    hot = new Handsontable(container, {
      sheetsBar: {
        sheets: [
          {
            name: 'Budget',
            data: [[100, '=A1*Rates!A1']],
            settings: { formulas: { engine, sheetName: 'Budget' } },
          },
          {
            name: 'Rates',
            data: [[0.23]],
            settings: { formulas: { engine, sheetName: 'Rates' } },
          },
        ],
      },
      licenseKey: 'non-commercial-and-evaluation',
    });

    expect(engine.getSheetNames()).toEqual(['Budget', 'Rates']);
    expect(hot.getDataAtCell(0, 1)).toBe(23);
  });

  it('binds a runtime-added sheet to the workbook\'s shared engine under its own name', () => {
    const engine = HyperFormula.buildEmpty({ licenseKey: 'internal-use-in-handsontable' });

    hot = new Handsontable(container, {
      sheetsBar: {
        sheets: [
          {
            name: 'Budget',
            data: [[100]],
            settings: { formulas: { engine, sheetName: 'Budget' } },
          },
        ],
      },
      licenseKey: 'non-commercial-and-evaluation',
    });
    const sheetsBar = hot.getPlugin('sheetsBar');

    const added = sheetsBar.addSheet('Fees', [[0.23, '=Budget!A1*A1']]);

    expect(added).not.toBe(null);
    expect(engine.getSheetNames()).toEqual(['Budget', 'Fees']);

    sheetsBar.setActiveSheet('Fees');

    expect(hot.getDataAtCell(0, 1)).toBe(23);
  });

  it('renames the engine sheet with the tab and rewrites the references to it', () => {
    const engine = HyperFormula.buildEmpty({ licenseKey: 'internal-use-in-handsontable' });

    hot = new Handsontable(container, {
      sheetsBar: {
        sheets: [
          {
            name: 'Budget',
            data: [[100, '=A1*Rates!A1']],
            settings: { formulas: { engine, sheetName: 'Budget' } },
          },
          {
            name: 'Rates',
            data: [[0.23]],
            settings: { formulas: { engine, sheetName: 'Rates' } },
          },
        ],
      },
      licenseKey: 'non-commercial-and-evaluation',
    });
    const sheetsBar = hot.getPlugin('sheetsBar');
    const ratesId = sheetsBar.getSheets()[1].id;

    expect(sheetsBar.renameSheet(ratesId, 'Fees')).toBe(true);
    expect(engine.getSheetNames()).toEqual(['Budget', 'Fees']);
    expect(hot.getDataAtCell(0, 1)).toBe(23);
    expect(hot.getSourceDataAtCell(0, 1)).toBe('=A1*Fees!A1');

    sheetsBar.setActiveSheet('Fees');
    hot.setDataAtCell(0, 0, 0.5);
    sheetsBar.setActiveSheet('Budget');

    expect(hot.getDataAtCell(0, 1)).toBe(50);
  });

  it('binds a duplicated sheet to an engine sheet of its own', () => {
    const engine = HyperFormula.buildEmpty({ licenseKey: 'internal-use-in-handsontable' });

    hot = new Handsontable(container, {
      sheetsBar: {
        sheets: [
          {
            name: 'Rates',
            data: [[0.23]],
            settings: { formulas: { engine, sheetName: 'Rates' } },
          },
          { name: 'Other', data: [['x']] },
        ],
      },
      licenseKey: 'non-commercial-and-evaluation',
    });
    const sheetsBar = hot.getPlugin('sheetsBar');
    const copy = sheetsBar.duplicateSheet(sheetsBar.getSheets()[0].id);

    expect(copy.name).toBe('Rates (2)');
    expect(engine.getSheetNames()).toEqual(['Rates', 'Rates (2)']);

    sheetsBar.setActiveSheet(copy.id);
    hot.setDataAtCell(0, 0, 0.5);

    expect(engine.getSheetSerialized(engine.getSheetId('Rates'))[0][0]).toBe(0.23);
    expect(engine.getSheetSerialized(engine.getSheetId('Rates (2)'))[0][0]).toBe(0.5);
  });

  it('warns when a sheetName rides on the HyperFormula class instead of an instance', () => {
    const warned = jest.spyOn(console, 'warn').mockImplementation(() => {});

    hot = new Handsontable(container, {
      sheetsBar: {
        sheets: [
          {
            name: 'Budget',
            data: [[1]],
            settings: { formulas: { engine: HyperFormula, sheetName: 'Budget' } },
          },
        ],
      },
      licenseKey: 'non-commercial-and-evaluation',
    });

    expect(warned.mock.calls.some(call => String(call[0]).includes('shared engine instance'))).toBe(true);
  });

  it('re-feeds the engine when a rebuilt workbook reuses its sheet names', () => {
    const engine = HyperFormula.buildEmpty({ licenseKey: 'internal-use-in-handsontable' });
    const build = rate => new Handsontable(document.body.appendChild(document.createElement('div')), {
      licenseKey: 'non-commercial-and-evaluation',
      sheetsBar: {
        sheets: [
          {
            name: 'Budget',
            data: [[100, '=A1*Rates!A1']],
            settings: { formulas: { engine, sheetName: 'Budget' } },
          },
          {
            name: 'Rates',
            data: [[rate]],
            settings: { formulas: { engine, sheetName: 'Rates' } },
          },
        ],
      },
    });
    const first = build(0.23);

    expect(first.getDataAtCell(0, 1)).toBe(23);
    first.destroy();

    const second = build(0.5);

    expect(second.getDataAtCell(0, 1)).toBe(50);
    second.destroy();
  });

  it('removes a deleted sheet from the engine and frees its name', () => {
    const engine = HyperFormula.buildEmpty({ licenseKey: 'internal-use-in-handsontable' });

    hot = new Handsontable(container, {
      sheetsBar: {
        sheets: [
          { name: 'Rates', data: [[0.23]], settings: { formulas: { engine, sheetName: 'Rates' } } },
          { name: 'Old', data: [[1]], settings: { formulas: { engine, sheetName: 'Old' } } },
          { name: 'Other', data: [['x']] },
        ],
      },
      licenseKey: 'non-commercial-and-evaluation',
    });
    const sheetsBar = hot.getPlugin('sheetsBar');

    expect(sheetsBar.removeSheet(sheetsBar.getSheets()[1].id)).toBe(true);
    expect(engine.getSheetNames()).toEqual(['Rates']);

    expect(sheetsBar.renameSheet(sheetsBar.getSheets()[0].id, 'Old')).toBe(true);
    expect(engine.getSheetNames()).toEqual(['Old']);
  });

  it('retranslates the control labels when the language changes', () => {
    registerLanguageDictionary(plPL);

    hot = new Handsontable(container, {
      sheetsBar: true,
      licenseKey: 'non-commercial-and-evaluation',
    });
    const addButton = hot.rootWrapperElement.querySelector('.ht-sheets-bar__add');

    expect(addButton.getAttribute('aria-label')).toBe('Add sheet');

    hot.updateSettings({ language: 'pl-PL' });

    expect(hot.rootWrapperElement.querySelector('.ht-sheets-bar__add').getAttribute('aria-label'))
      .toBe('Dodaj arkusz');
  });

  it('does not carry a runtime freeze onto a sheet that was never visited', () => {
    hot = new Handsontable(container, {
      sheetsBar: {
        sheets: [
          { name: 'A', data: [['a', 'b', 'c']] },
          { name: 'B', data: [['x', 'y', 'z']] },
        ],
      },
      licenseKey: 'non-commercial-and-evaluation',
    });
    const sheetsBar = hot.getPlugin('sheetsBar');

    hot.updateSettings({ fixedColumnsStart: 2 });
    sheetsBar.setActiveSheet('B');

    expect(hot.getSettings().fixedColumnsStart).toBe(0);

    sheetsBar.setActiveSheet('A');

    expect(hot.getSettings().fixedColumnsStart).toBe(2);
  });

  it('keeps the freeze a never-visited sheet declares in its own settings', () => {
    hot = new Handsontable(container, {
      sheetsBar: {
        sheets: [
          { name: 'A', data: [['a', 'b', 'c']] },
          { name: 'B', data: [['x', 'y', 'z']], settings: { fixedColumnsStart: 1 } },
        ],
      },
      licenseKey: 'non-commercial-and-evaluation',
    });

    hot.getPlugin('sheetsBar').setActiveSheet('B');

    expect(hot.getSettings().fixedColumnsStart).toBe(1);
  });

  it('renders the bar on the edge the position setting names, and moves with it', () => {
    hot = new Handsontable(container, {
      data: [['a']],
      sheetsBar: { position: 'top' },
      licenseKey: 'non-commercial-and-evaluation',
    });
    const slotOf = () => hot.rootWrapperElement.querySelector('.ht-sheets-bar').parentElement.className;

    expect(slotOf()).toContain('ht-slot-top');

    hot.updateSettings({ sheetsBar: { position: 'bottom' } });

    expect(slotOf()).toContain('ht-slot-bottom');

    hot.updateSettings({ sheetsBar: true });

    expect(slotOf()).toContain('ht-slot-bottom');
  });

  it('restores a sheet without throwing when manual row resizing is on', () => {
    hot = new Handsontable(container, {
      manualRowResize: true,
      sheetsBar: { sheets: [{ name: 'A', data: [['a']] }, { name: 'B', data: [['b']] }] },
      licenseKey: 'non-commercial-and-evaluation',
    });

    hot.getPlugin('manualRowResize').setManualSize(0, 60);

    expect(() => hot.getPlugin('sheetsBar').setActiveSheet('B')).not.toThrow();
    expect(() => hot.getPlugin('sheetsBar').setActiveSheet('A')).not.toThrow();
  });

  it('applies the initially active sheet\'s settings during construction, before `activeSheet` is switched', () => {
    hot = new Handsontable(container, {
      sheetsBar: {
        sheets: [
          { name: 'A', data: [['a']], settings: { readOnly: true } },
          { name: 'B', data: [['b']] },
        ],
      },
      licenseKey: 'non-commercial-and-evaluation',
    });

    expect(hot.getSettings().readOnly).toBe(true);
    expect(hot.getDataAtCell(0, 0)).toBe('a');
  });

  it('renders the bar into the bottom slot with controls', () => {
    hot = new Handsontable(container, {
      data: [['x']],
      sheetsBar: true,
      licenseKey: 'non-commercial-and-evaluation',
    });

    const bar = hot.rootWrapperElement.querySelector('.ht-sheets-bar');

    expect(bar).not.toBe(null);
    expect(bar.closest('.ht-slot-bottom')).not.toBe(null);
    expect(bar.querySelector('.ht-sheets-bar__add')).not.toBe(null);
    expect(bar.querySelector('.ht-sheets-bar__all')).not.toBe(null);
  });

  it('renders into a custom uiContainer and skips the slot', () => {
    const uiHost = document.createElement('div');

    document.body.appendChild(uiHost);
    hot = new Handsontable(container, {
      data: [['x']],
      sheetsBar: { uiContainer: uiHost },
      licenseKey: 'non-commercial-and-evaluation',
    });

    expect(uiHost.querySelector('.ht-sheets-bar')).not.toBe(null);
    expect(hot.rootWrapperElement.querySelector('.ht-slot-bottom .ht-sheets-bar')).toBe(null);
    uiHost.remove();
  });

  it('hides controls when `controls: false`', () => {
    hot = new Handsontable(container, {
      data: [['x']],
      sheetsBar: { controls: false },
      licenseKey: 'non-commercial-and-evaluation',
    });

    const bar = hot.rootWrapperElement.querySelector('.ht-sheets-bar');

    expect(bar.querySelector('.ht-sheets-bar__controls').hidden).toBe(true);
  });

  it('renders one tab per sheet, marks the active one, and switches on click', () => {
    hot = new Handsontable(container, {
      sheetsBar: { sheets: [{ name: 'A', data: [['a']] }, { name: 'B', data: [['b']] }] },
      licenseKey: 'non-commercial-and-evaluation',
    });

    const tabs = hot.rootWrapperElement.querySelectorAll('.ht-sheets-bar__tab');

    expect(tabs.length).toBe(2);
    // The tab is the control, so it is the tab that carries the state.
    expect(tabs[0].getAttribute('aria-current')).toBe('true');
    expect(tabs[1].getAttribute('aria-current')).toBe(null);

    tabs[1].querySelector('.ht-sheets-bar__tab-label').click();

    expect(hot.getDataAtCell(0, 0)).toBe('b');
    expect(
      hot.rootWrapperElement
        .querySelectorAll('.ht-sheets-bar__tab')[1]
        .getAttribute('aria-current'),
    ).toBe('true');
  });

  it('activates the sheet when clicking the tab surface outside the label button', () => {
    hot = new Handsontable(container, {
      sheetsBar: { sheets: [{ name: 'A', data: [['a']] }, { name: 'B', data: [['b']] }] },
      licenseKey: 'non-commercial-and-evaluation',
    });

    hot.rootWrapperElement.querySelectorAll('.ht-sheets-bar__tab')[1].click();

    expect(hot.getDataAtCell(0, 0)).toBe('b');
  });

  it('leaves the sheet alone when the menu trigger of the active tab is clicked', () => {
    hot = new Handsontable(container, {
      sheetsBar: { sheets: [{ name: 'A', data: [['a']] }, { name: 'B', data: [['b']] }] },
      licenseKey: 'non-commercial-and-evaluation',
    });

    hot.rootWrapperElement
      .querySelectorAll('.ht-sheets-bar__tab')[0]
      .querySelector('.ht-sheets-bar__tab-chevron')
      .click();

    expect(hot.getDataAtCell(0, 0)).toBe('a');
  });

  it('only moves to the sheet when the menu trigger of another tab is clicked', () => {
    hot = new Handsontable(container, {
      sheetsBar: { sheets: [{ name: 'A', data: [['a']] }, { name: 'B', data: [['b']] }] },
      licenseKey: 'non-commercial-and-evaluation',
    });

    const opened = jest.spyOn(SheetsBarMenus.prototype, 'openTabMenu').mockImplementation(() => {});

    // A menu acts on a sheet, so the first click brings you to it and opens nothing. The
    // second click — by then on the active tab — is the one that opens the menu.
    hot.rootWrapperElement
      .querySelectorAll('.ht-sheets-bar__tab')[1]
      .querySelector('.ht-sheets-bar__tab-chevron')
      .click();

    expect(hot.getDataAtCell(0, 0)).toBe('b');
    expect(opened).not.toHaveBeenCalled();

    hot.rootWrapperElement
      .querySelectorAll('.ht-sheets-bar__tab')[1]
      .querySelector('.ht-sheets-bar__tab-chevron')
      .click();

    expect(opened).toHaveBeenCalledTimes(1);
  });

  it('starts rename when double-clicking the tab surface outside the label button', () => {
    hot = new Handsontable(container, {
      sheetsBar: { sheets: [{ name: 'A', data: [['a']] }] },
      licenseKey: 'non-commercial-and-evaluation',
    });

    hot.rootWrapperElement
      .querySelector('.ht-sheets-bar__tab')
      .dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));

    expect(hot.rootWrapperElement.querySelector('.ht-sheets-bar__tab-rename')).not.toBe(null);
  });

  it('opens the tab menu on right-click, anchored to the tab it belongs to', () => {
    hot = new Handsontable(container, {
      sheetsBar: { sheets: [{ name: 'A', data: [['a']] }, { name: 'B', data: [['b']] }] },
      licenseKey: 'non-commercial-and-evaluation',
    });

    const opened = jest.spyOn(SheetsBarMenus.prototype, 'openTabMenu').mockImplementation(() => {});
    const tab = hot.rootWrapperElement.querySelectorAll('.ht-sheets-bar__tab')[1];
    const event = new MouseEvent('contextmenu', { bubbles: true, cancelable: true, button: 2 });

    tab.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(true);
    expect(opened).toHaveBeenCalledTimes(1);
    // Right-clicking another sheet moves there first, which repaints the strip — the anchor is
    // the rebuilt tab, not the detached one the gesture started on. The tab is the anchor
    // because it is the control: it takes the focus back when the menu closes.
    expect(hot.getDataAtCell(0, 0)).toBe('b');
    expect(opened.mock.calls[0][0]).toBe(hot.rootWrapperElement.querySelectorAll('.ht-sheets-bar__tab')[1]);
    expect(opened.mock.calls[0][1].positionTarget).toBe(
      hot.rootWrapperElement
        .querySelectorAll('.ht-sheets-bar__tab')[1]
        .querySelector('.ht-sheets-bar__tab-chevron'),
    );
    // Summoned by pointer, so the menu must not preselect an item.
    expect(opened.mock.calls[0][1].selectFirstItem).toBe(false);
  });

  it('writes a sheet name into the menu item wrapper as text, never as markup', () => {
    const hostile = '<img src=x onerror=alert(1)>';

    hot = new Handsontable(container, {
      sheetsBar: { sheets: [{ name: hostile, data: [['a']] }] },
      licenseKey: 'non-commercial-and-evaluation',
    });

    let items = null;

    jest.spyOn(Menu.prototype, 'setMenuItems').mockImplementation((menuItems) => {
      items = menuItems;
    });
    jest.spyOn(Menu.prototype, 'open').mockImplementation(() => {});

    hot.rootWrapperElement.querySelector('.ht-sheets-bar__all').click();

    const wrapper = document.createElement('div');
    const returned = items[0].renderer(null, wrapper);

    // The name fills the wrapper the menu already built, as text — a sheet name can carry
    // anything a persisted workbook put there, and the shared Menu would otherwise set it
    // through `innerHTML`.
    expect(returned).toBe(wrapper);
    // The row of the active sheet also carries the mark, whose own character sits before the
    // name — the name itself still arrives as text and builds no elements.
    expect(wrapper.textContent.endsWith(hostile)).toBe(true);
    expect(wrapper.querySelector('img')).toBe(null);
    expect(wrapper.querySelectorAll('*')).toHaveLength(1);
    expect(wrapper.querySelector('.selected')).not.toBe(null);
  });

  it('switches to the sheet the add button just created', () => {
    hot = new Handsontable(container, {
      sheetsBar: { sheets: [{ name: 'A', data: [['a']] }] },
      licenseKey: 'non-commercial-and-evaluation',
    });

    hot.rootWrapperElement.querySelector('.ht-sheets-bar__add').click();

    const sheets = hot.getPlugin('sheetsBar').getSheets();

    expect(sheets).toHaveLength(2);
    expect(sheets[1].isActive).toBe(true);
    expect(hot.rootWrapperElement.querySelector('.ht-sheets-bar__tab--active .ht-sheets-bar__tab-label').textContent)
      .toBe(sheets[1].name);
  });

  it('leaves the active sheet alone when a sheet is added through the API', () => {
    hot = new Handsontable(container, {
      sheetsBar: { sheets: [{ name: 'A', data: [['a']] }] },
      licenseKey: 'non-commercial-and-evaluation',
    });

    // A script building a workbook must not drag the grid through every sheet it creates.
    hot.getPlugin('sheetsBar').addSheet('Added');

    const sheets = hot.getPlugin('sheetsBar').getSheets();

    expect(sheets.map(sheet => sheet.name)).toEqual(['A', 'Added']);
    expect(sheets[0].isActive).toBe(true);
  });

  it('renders a duplicated tab next to its original, not at the end of the strip', () => {
    hot = new Handsontable(container, {
      sheetsBar: {
        sheets: [{ name: 'A', data: [['a']] }, { name: 'B', data: [['b']] }, { name: 'C', data: [['c']] }],
      },
      licenseKey: 'non-commercial-and-evaluation',
    });

    const middleId = hot.getPlugin('sheetsBar').getSheets()[1].id;

    getTabMenuActions(hot, middleId).duplicate(middleId);

    const names = Array.from(hot.rootWrapperElement.querySelectorAll('.ht-sheets-bar__tab-label'))
      .map(label => label.textContent);

    expect(names).toEqual(['A', 'B', 'B (2)', 'C']);
  });

  it('offers both move items as disabled when a lone sheet has nowhere to go', () => {
    hot = new Handsontable(container, {
      sheetsBar: { sheets: [{ name: 'Only', data: [['a']] }] },
      licenseKey: 'non-commercial-and-evaluation',
    });

    const opened = jest.spyOn(SheetsBarMenus.prototype, 'openTabMenu').mockImplementation(() => {});

    hot.rootWrapperElement.querySelector('.ht-sheets-bar__tab-chevron').click();

    expect(opened.mock.calls[0][1].canMoveLeft).toBe(false);
    expect(opened.mock.calls[0][1].canMoveRight).toBe(false);
  });

  it('disables only the move that would run off the end of the strip', () => {
    hot = new Handsontable(container, {
      sheetsBar: {
        sheets: [{ name: 'A', data: [['a']] }, { name: 'B', data: [['b']] }, { name: 'C', data: [['c']] }],
      },
      licenseKey: 'non-commercial-and-evaluation',
    });

    const opened = jest.spyOn(SheetsBarMenus.prototype, 'openTabMenu').mockImplementation(() => {});

    // Right-click: the one gesture that opens the menu of a tab you are not currently on.
    hot.rootWrapperElement.querySelectorAll('.ht-sheets-bar__tab').forEach((tab) => {
      tab.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true }));
    });

    expect(opened.mock.calls.map(call => [call[1].canMoveLeft, call[1].canMoveRight])).toEqual([
      [false, true],
      [true, true],
      [true, false],
    ]);
  });

  it('mirrors the move affordances under RTL, so they match the moves themselves', () => {
    hot = new Handsontable(container, {
      layoutDirection: 'rtl',
      sheetsBar: {
        sheets: [{ name: 'A', data: [['a']] }, { name: 'B', data: [['b']] }, { name: 'C', data: [['c']] }],
      },
      licenseKey: 'non-commercial-and-evaluation',
    });

    const opened = jest.spyOn(SheetsBarMenus.prototype, 'openTabMenu').mockImplementation(() => {});
    const tabs = hot.rootWrapperElement.querySelectorAll('.ht-sheets-bar__tab');

    tabs.forEach((tab) => {
      tab.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true }));
    });

    // Under RTL the sheet at index 0 is the rightmost tab, so "move right" is the one with
    // nowhere to go — the mirror image of the LTR case, and the direction `#moveSheet()`
    // already mirrors.
    expect(opened.mock.calls.map(call => [call[1].canMoveLeft, call[1].canMoveRight])).toEqual([
      [true, false],
      [true, true],
      [false, true],
    ]);
  });

  it('leaves the rename input its own context menu', () => {
    hot = new Handsontable(container, {
      sheetsBar: { sheets: [{ name: 'A', data: [['a']] }] },
      licenseKey: 'non-commercial-and-evaluation',
    });

    hot.rootWrapperElement
      .querySelector('.ht-sheets-bar__tab')
      .dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));

    const opened = jest.spyOn(SheetsBarMenus.prototype, 'openTabMenu').mockImplementation(() => {});
    const event = new MouseEvent('contextmenu', { bubbles: true, cancelable: true, button: 2 });

    hot.rootWrapperElement.querySelector('.ht-sheets-bar__tab-rename').dispatchEvent(event);

    expect(event.defaultPrevented).toBe(false);
    expect(opened).not.toHaveBeenCalled();
  });

  it('hides the tab menu trigger while the tab is being renamed', () => {
    hot = new Handsontable(container, {
      sheetsBar: { sheets: [{ name: 'A', data: [['a']] }] },
      licenseKey: 'non-commercial-and-evaluation',
    });

    const tab = hot.rootWrapperElement.querySelector('.ht-sheets-bar__tab');

    expect(tab.classList.contains('ht-sheets-bar__tab--renaming')).toBe(false);

    tab.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));

    expect(tab.classList.contains('ht-sheets-bar__tab--renaming')).toBe(true);
    expect(tab.querySelector('.ht-sheets-bar__tab-chevron')).not.toBe(null);
  });

  it('restores the tab menu trigger once the rename ends', () => {
    hot = new Handsontable(container, {
      sheetsBar: { sheets: [{ name: 'A', data: [['a']] }] },
      licenseKey: 'non-commercial-and-evaluation',
    });

    hot.rootWrapperElement
      .querySelector('.ht-sheets-bar__tab')
      .dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));

    const input = hot.rootWrapperElement.querySelector('.ht-sheets-bar__tab-rename');

    input.value = 'Renamed';
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));

    const tab = hot.rootWrapperElement.querySelector('.ht-sheets-bar__tab');

    expect(tab.classList.contains('ht-sheets-bar__tab--renaming')).toBe(false);
    expect(hot.rootWrapperElement.querySelector('.ht-sheets-bar__tab-rename-mirror')).toBe(null);
  });

  it('sizes the rename input from a mirror that tracks what is typed', () => {
    hot = new Handsontable(container, {
      sheetsBar: { sheets: [{ name: 'A', data: [['a']] }] },
      licenseKey: 'non-commercial-and-evaluation',
    });

    hot.rootWrapperElement
      .querySelector('.ht-sheets-bar__tab')
      .dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));

    const input = hot.rootWrapperElement.querySelector('.ht-sheets-bar__tab-rename');
    const mirror = hot.rootWrapperElement.querySelector('.ht-sheets-bar__tab-rename-mirror');

    // jsdom has no layout, so every measurement reads 0 — the width that a real browser
    // produces is covered by the Playwright spec. What is verifiable here is that the input
    // is sized from the mirror at all, and that the mirror follows the typed value.
    expect(mirror).not.toBe(null);
    expect(mirror.textContent).toBe('A');
    expect(input.style.width).toMatch(/^\d+(\.\d+)?px$/);

    input.value = 'A much longer sheet name';
    input.dispatchEvent(new Event('input', { bubbles: true }));

    expect(mirror.textContent).toBe('A much longer sheet name');
  });

  it('keeps the rename input alive when it is clicked or double-clicked', () => {
    hot = new Handsontable(container, {
      sheetsBar: { sheets: [{ name: 'A', data: [['a']] }] },
      licenseKey: 'non-commercial-and-evaluation',
    });

    hot.rootWrapperElement
      .querySelector('.ht-sheets-bar__tab-label')
      .dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));

    const input = hot.rootWrapperElement.querySelector('.ht-sheets-bar__tab-rename');

    input.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    input.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));

    expect(hot.rootWrapperElement.querySelector('.ht-sheets-bar__tab-rename')).toBe(input);
  });

  it('re-renders tabs after addSheet', () => {
    hot = new Handsontable(container, {
      data: [['x']],
      sheetsBar: true,
      licenseKey: 'non-commercial-and-evaluation',
    });

    hot.getPlugin('sheetsBar').addSheet();

    expect(hot.rootWrapperElement.querySelectorAll('.ht-sheets-bar__tab').length).toBe(2);
  });

  it('rename through the tab strip commits into the model and fires hooks once', () => {
    const after = jasmine.createSpy('after');

    hot = new Handsontable(container, {
      sheetsBar: { sheets: [{ name: 'A', data: [['a']] }, { name: 'B', data: [['b']] }] },
      afterSheetTabRename: after,
      licenseKey: 'non-commercial-and-evaluation',
    });

    const label = hot.rootWrapperElement.querySelector('.ht-sheets-bar__tab-label');

    label.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));

    const input = hot.rootWrapperElement.querySelector('.ht-sheets-bar__tab-rename');

    input.value = 'Budget';
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));

    expect(after).toHaveBeenCalledTimes(1);
    expect(hot.getPlugin('sheetsBar').getSheets()[0].name).toBe('Budget');
  });

  it('rejecting rename via beforeSheetTabRename keeps the old name', () => {
    hot = new Handsontable(container, {
      sheetsBar: { sheets: [{ name: 'A', data: [['a']] }] },
      beforeSheetTabRename: () => false,
      licenseKey: 'non-commercial-and-evaluation',
    });

    const label = hot.rootWrapperElement.querySelector('.ht-sheets-bar__tab-label');

    label.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));

    const input = hot.rootWrapperElement.querySelector('.ht-sheets-bar__tab-rename');

    input.value = 'X';
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));

    expect(hot.getPlugin('sheetsBar').getSheets()[0].name).toBe('A');
  });

  it('rename is a no-op when the name is unchanged (no hooks fired)', () => {
    const before = jasmine.createSpy('before');
    const after = jasmine.createSpy('after');

    hot = new Handsontable(container, {
      sheetsBar: { sheets: [{ name: 'A', data: [['a']] }] },
      beforeSheetTabRename: before,
      afterSheetTabRename: after,
      licenseKey: 'non-commercial-and-evaluation',
    });

    const label = hot.rootWrapperElement.querySelector('.ht-sheets-bar__tab-label');

    label.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));

    const input = hot.rootWrapperElement.querySelector('.ht-sheets-bar__tab-rename');

    input.value = 'A';
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));

    expect(before).not.toHaveBeenCalled();
    expect(after).not.toHaveBeenCalled();
    expect(hot.rootWrapperElement.querySelector('.ht-sheets-bar__tab-label').textContent).toBe('A');
  });

  it('rename is rejected when the name collides with another sheet, keeping the old name', () => {
    hot = new Handsontable(container, {
      sheetsBar: { sheets: [{ name: 'A', data: [['a']] }, { name: 'B', data: [['b']] }] },
      licenseKey: 'non-commercial-and-evaluation',
    });

    const label = hot.rootWrapperElement.querySelector('.ht-sheets-bar__tab-label');

    label.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));

    const input = hot.rootWrapperElement.querySelector('.ht-sheets-bar__tab-rename');

    input.value = 'B';
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));

    expect(hot.getPlugin('sheetsBar').getSheets()[0].name).toBe('A');
  });

  it('#removeSheet refuses to remove the only remaining sheet', () => {
    const after = jasmine.createSpy('after');

    hot = new Handsontable(container, {
      sheetsBar: { sheets: [{ name: 'A', data: [['a']] }] },
      afterSheetTabRemove: after,
      licenseKey: 'non-commercial-and-evaluation',
    });

    const id = hot.getPlugin('sheetsBar').getSheets()[0].id;
    const actions = getTabMenuActions(hot, id);

    actions.remove(id);

    expect(after).not.toHaveBeenCalled();
    expect(hot.getPlugin('sheetsBar').getSheets().length).toBe(1);
  });

  it('#removeSheet removes the active sheet and switches the grid to the model-picked neighbor', () => {
    const after = jasmine.createSpy('after');

    hot = new Handsontable(container, {
      sheetsBar: { sheets: [{ name: 'A', data: [['a']] }, { name: 'B', data: [['b']] }] },
      afterSheetTabRemove: after,
      licenseKey: 'non-commercial-and-evaluation',
    });

    const activeId = hot.getPlugin('sheetsBar').getSheets()[0].id;
    const actions = getTabMenuActions(hot, activeId);

    actions.remove(activeId);

    expect(after).toHaveBeenCalledTimes(1);
    expect(hot.getPlugin('sheetsBar').getSheets().map(s => s.name)).toEqual(['B']);
    expect(hot.getDataAtCell(0, 0)).toBe('b');
  });

  it('#removeSheet aborts, without touching the model or the grid, when the neighbor switch is cancelled', () => {
    const afterRemoved = jasmine.createSpy('afterRemoved');

    hot = new Handsontable(container, {
      sheetsBar: { sheets: [{ name: 'A', data: [['a']] }, { name: 'B', data: [['b']] }] },
      beforeSheetTabChange: () => false,
      afterSheetTabRemove: afterRemoved,
      licenseKey: 'non-commercial-and-evaluation',
    });

    const activeId = hot.getPlugin('sheetsBar').getSheets()[0].id;
    const actions = getTabMenuActions(hot, activeId);

    actions.remove(activeId);

    expect(afterRemoved).not.toHaveBeenCalled();
    expect(hot.getPlugin('sheetsBar').getSheets().map(s => s.name)).toEqual(['A', 'B']);
    expect(hot.getDataAtCell(0, 0)).toBe('a');
  });

  it('a beforeSheetTabRemove listener cancels the removal of a non-active sheet', () => {
    const afterRemoved = jasmine.createSpy('afterRemoved');

    hot = new Handsontable(container, {
      sheetsBar: { sheets: [{ name: 'A', data: [['a']] }, { name: 'B', data: [['b']] }] },
      beforeSheetTabRemove: () => false,
      afterSheetTabRemove: afterRemoved,
      licenseKey: 'non-commercial-and-evaluation',
    });

    const targetId = hot.getPlugin('sheetsBar').getSheets()[1].id;
    const actions = getTabMenuActions(hot, targetId);

    actions.remove(targetId);

    expect(afterRemoved).not.toHaveBeenCalled();
    expect(hot.getPlugin('sheetsBar').getSheets().map(s => s.name)).toEqual(['A', 'B']);
  });

  it('moving a tab right reorders the sheets and fires the move hook once', () => {
    const afterMoved = jasmine.createSpy('afterMoved');

    hot = new Handsontable(container, {
      sheetsBar: { sheets: [{ name: 'A', data: [['a']] }, { name: 'B', data: [['b']] }] },
      afterSheetTabMove: afterMoved,
      licenseKey: 'non-commercial-and-evaluation',
    });

    const firstId = hot.getPlugin('sheetsBar').getSheets()[0].id;
    const actions = getTabMenuActions(hot, firstId);

    actions.moveRight(firstId);

    expect(afterMoved).toHaveBeenCalledTimes(1);
    expect(hot.getPlugin('sheetsBar').getSheets().map(s => s.name)).toEqual(['B', 'A']);
  });

  it('moving the last tab right is a no-op (out of range, no hook fired)', () => {
    const afterMoved = jasmine.createSpy('afterMoved');

    hot = new Handsontable(container, {
      sheetsBar: { sheets: [{ name: 'A', data: [['a']] }, { name: 'B', data: [['b']] }] },
      afterSheetTabMove: afterMoved,
      licenseKey: 'non-commercial-and-evaluation',
    });

    const lastId = hot.getPlugin('sheetsBar').getSheets()[1].id;
    const actions = getTabMenuActions(hot, lastId);

    actions.moveRight(lastId);

    expect(afterMoved).not.toHaveBeenCalled();
    expect(hot.getPlugin('sheetsBar').getSheets().map(s => s.name)).toEqual(['A', 'B']);
  });

  it('moving the first tab left is a no-op (out of range, no hook fired)', () => {
    const afterMoved = jasmine.createSpy('afterMoved');

    hot = new Handsontable(container, {
      sheetsBar: { sheets: [{ name: 'A', data: [['a']] }, { name: 'B', data: [['b']] }] },
      afterSheetTabMove: afterMoved,
      licenseKey: 'non-commercial-and-evaluation',
    });

    const firstId = hot.getPlugin('sheetsBar').getSheets()[0].id;
    const actions = getTabMenuActions(hot, firstId);

    actions.moveLeft(firstId);

    expect(afterMoved).not.toHaveBeenCalled();
    expect(hot.getPlugin('sheetsBar').getSheets().map(s => s.name)).toEqual(['A', 'B']);
  });

  it('a beforeSheetTabMove listener cancels the move', () => {
    const afterMoved = jasmine.createSpy('afterMoved');

    hot = new Handsontable(container, {
      sheetsBar: { sheets: [{ name: 'A', data: [['a']] }, { name: 'B', data: [['b']] }] },
      beforeSheetTabMove: () => false,
      afterSheetTabMove: afterMoved,
      licenseKey: 'non-commercial-and-evaluation',
    });

    const firstId = hot.getPlugin('sheetsBar').getSheets()[0].id;
    const actions = getTabMenuActions(hot, firstId);

    actions.moveRight(firstId);

    expect(afterMoved).not.toHaveBeenCalled();
    expect(hot.getPlugin('sheetsBar').getSheets().map(s => s.name)).toEqual(['A', 'B']);
  });

  it('moves a sheet to an absolute index and reports it through the hooks', () => {
    const before = jest.fn();
    const after = jest.fn();

    hot = new Handsontable(container, {
      sheetsBar: {
        sheets: [{ name: 'A', data: [['a']] }, { name: 'B', data: [['b']] }, { name: 'C', data: [['c']] }],
      },
      beforeSheetTabMove: before,
      afterSheetTabMove: after,
      licenseKey: 'non-commercial-and-evaluation',
    });

    const plugin = hot.getPlugin('sheetsBar');
    const movedId = plugin.getSheets()[0].id;

    plugin.moveSheetToIndex(movedId, 2);

    expect(plugin.getSheets().map(sheet => sheet.name)).toEqual(['B', 'C', 'A']);
    // The public entry point reports the API source, matching `addSheet`; the drag passes
    // `SheetsBar.ui` explicitly.
    expect(before).toHaveBeenCalledWith(movedId, 2, 'SheetsBar.api');
    expect(after).toHaveBeenCalledWith(movedId, 2, 'SheetsBar.api');
  });

  it('leaves the order untouched when a beforeSheetTabMove listener cancels', () => {
    hot = new Handsontable(container, {
      sheetsBar: { sheets: [{ name: 'A', data: [['a']] }, { name: 'B', data: [['b']] }] },
      beforeSheetTabMove: () => false,
      licenseKey: 'non-commercial-and-evaluation',
    });

    const plugin = hot.getPlugin('sheetsBar');

    expect(plugin.moveSheetToIndex(plugin.getSheets()[0].id, 1)).toBe(false);
    expect(plugin.getSheets().map(sheet => sheet.name)).toEqual(['A', 'B']);
  });

  it('rejects an index that is out of range or unchanged', () => {
    hot = new Handsontable(container, {
      sheetsBar: { sheets: [{ name: 'A', data: [['a']] }, { name: 'B', data: [['b']] }] },
      licenseKey: 'non-commercial-and-evaluation',
    });

    const plugin = hot.getPlugin('sheetsBar');
    const id = plugin.getSheets()[0].id;

    expect(plugin.moveSheetToIndex(id, 0)).toBe(false);
    expect(plugin.moveSheetToIndex(id, 5)).toBe(false);
    expect(plugin.moveSheetToIndex(id, -1)).toBe(false);
  });

  it('commits a tab drag through the plugin move path', () => {
    hot = new Handsontable(container, {
      sheetsBar: {
        sheets: [{ name: 'A', data: [['a']] }, { name: 'B', data: [['b']] }, { name: 'C', data: [['c']] }],
      },
      licenseKey: 'non-commercial-and-evaluation',
    });

    const plugin = hot.getPlugin('sheetsBar');
    const movedId = plugin.getSheets()[0].id;
    const tabStrip = liveTabStrip();

    // The controller reports a landing index; this is the wiring under test, not the gesture.
    tabStrip.runLocalHooks('tabDragCommit', movedId, 2);

    expect(plugin.getSheets().map(sheet => sheet.name)).toEqual(['B', 'C', 'A']);
  });

  it('repaints the strip from the model when a beforeSheetTabMove listener cancels a drag', () => {
    hot = new Handsontable(container, {
      sheetsBar: {
        sheets: [{ name: 'A', data: [['a']] }, { name: 'B', data: [['b']] }, { name: 'C', data: [['c']] }],
      },
      beforeSheetTabMove: () => false,
      licenseKey: 'non-commercial-and-evaluation',
    });

    const plugin = hot.getPlugin('sheetsBar');
    const movedId = plugin.getSheets()[0].id;
    const stripHost = hot.rootWrapperElement.querySelector('.ht-sheets-bar__tabs');
    const tabStrip = liveTabStrip();

    // Reproduces what `TabDrag` leaves behind mid-gesture: the dragged tab's DOM node is
    // already relocated (the same `insertBefore` it uses), while the model is untouched until
    // the commit. The DOM alone would read `['B', 'C', 'A']` at this point.
    stripHost.insertBefore(stripHost.firstElementChild, null);

    tabStrip.runLocalHooks('tabDragCommit', movedId, 2);

    const renderedNames = Array.from(hot.rootWrapperElement.querySelectorAll('.ht-sheets-bar__tab-label'))
      .map(label => label.textContent);

    // The defect this guards was a DOM/model split: the model rejects the move, but without a
    // repaint the DOM tab the drag had already relocated stayed where the gesture left it.
    // Asserting only `getSheets()` would miss that split entirely.
    expect(renderedNames).toEqual(['A', 'B', 'C']);
    expect(plugin.getSheets().map(sheet => sheet.name)).toEqual(['A', 'B', 'C']);
  });

  it('starts a drag on pointerdown on a tab label', () => {
    const startSpy = jest.spyOn(TabDrag.prototype, 'start');
    const { host, strip } = buildTabStrip([{ id: 1, name: 'A', isActive: true }]);
    const tab = host.querySelector('[data-sheet-id="1"]');
    const label = tab.querySelector('.ht-sheets-bar__tab-label');
    const event = new MouseEvent('pointerdown', { bubbles: true, button: 0 });

    label.dispatchEvent(event);

    expect(startSpy).toHaveBeenCalledWith(event, tab, 1);

    strip.destroy();
    host.remove();
  });

  it('starts a drag on pointerdown on the tab-menu trigger', () => {
    const startSpy = jest.spyOn(TabDrag.prototype, 'start');
    const { host, strip } = buildTabStrip([{ id: 1, name: 'A', isActive: true }]);
    const tab = host.querySelector('[data-sheet-id="1"]');
    const chevron = host.querySelector('.ht-sheets-bar__tab-chevron');
    const event = new MouseEvent('pointerdown', { bubbles: true, button: 0 });

    // The trigger is part of the tab surface rather than a control of its own, so the whole
    // tab is draggable — a press that never passes the threshold still opens the menu.
    chevron.dispatchEvent(event);

    expect(startSpy).toHaveBeenCalledWith(event, tab, 1);

    strip.destroy();
    host.remove();
  });

  it('does not start a drag on pointerdown inside the open rename input', () => {
    const startSpy = jest.spyOn(TabDrag.prototype, 'start');
    const { host, strip } = buildTabStrip([{ id: 1, name: 'A', isActive: true }]);

    strip.startRename(1);

    const input = host.querySelector('.ht-sheets-bar__tab-rename');

    input.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true, button: 0 }));

    expect(startSpy).not.toHaveBeenCalled();

    strip.destroy();
    host.remove();
  });

  it('does not start a drag on a non-primary pointerdown button', () => {
    const startSpy = jest.spyOn(TabDrag.prototype, 'start');
    const { host, strip } = buildTabStrip([{ id: 1, name: 'A', isActive: true }]);
    const label = host.querySelector('.ht-sheets-bar__tab-label');

    label.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true, button: 2 }));

    expect(startSpy).not.toHaveBeenCalled();

    strip.destroy();
    host.remove();
  });

  it('destroys the drag controller when the tab strip is destroyed', () => {
    const destroySpy = jest.spyOn(TabDrag.prototype, 'destroy');
    const { host, strip } = buildTabStrip([{ id: 1, name: 'A', isActive: true }]);

    strip.destroy();

    expect(destroySpy).toHaveBeenCalledTimes(1);

    host.remove();
  });

  it('aborts an in-progress drag before render() rebuilds the strip, on a later pointermove', () => {
    const sheets = [
      { id: 1, name: 'A', isActive: true },
      { id: 2, name: 'B', isActive: false },
      { id: 3, name: 'C', isActive: false },
    ];
    const { host, strip } = buildTabStrip(sheets);
    const originalTab = host.querySelector('[data-sheet-id="1"]');
    const label = originalTab.querySelector('.ht-sheets-bar__tab-label');

    originalTab.setPointerCapture = jest.fn();

    label.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true, button: 0, clientX: 50 }));

    // A repaint (a rename commit, or a model change from elsewhere) lands mid-gesture, before
    // the pointer has moved past the drag threshold.
    strip.render(sheets);

    expect(() => {
      host.ownerDocument.dispatchEvent(new MouseEvent('pointermove', { bubbles: true, clientX: 90 }));
    }).not.toThrow();

    expect(host.children.length).toBe(3);
    expect(Array.from(host.children)).not.toContain(originalTab);

    strip.destroy();
    host.remove();
  });

  it('aborts an in-progress drag before render() rebuilds the strip, on a later Escape', () => {
    const sheets = [
      { id: 1, name: 'A', isActive: true },
      { id: 2, name: 'B', isActive: false },
      { id: 3, name: 'C', isActive: false },
    ];
    const { host, strip } = buildTabStrip(sheets);
    const originalTab = host.querySelector('[data-sheet-id="1"]');
    const label = originalTab.querySelector('.ht-sheets-bar__tab-label');

    originalTab.setPointerCapture = jest.fn();
    originalTab.releasePointerCapture = jest.fn();

    label.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true, button: 0, clientX: 50 }));
    host.ownerDocument.dispatchEvent(new MouseEvent('pointermove', { bubbles: true, clientX: 90 }));

    expect(originalTab.classList.contains('ht-sheets-bar__tab--dragging')).toBe(true);

    // A repaint lands mid-gesture, after the pointer has already crossed the threshold.
    strip.render(sheets);

    expect(() => {
      host.ownerDocument.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    }).not.toThrow();

    expect(host.children.length).toBe(3);
    expect(Array.from(host.children)).not.toContain(originalTab);

    strip.destroy();
    host.remove();
  });

  it('duplicating a sheet appends a copy with a derived unique name and fires add hooks once', () => {
    const afterAdded = jasmine.createSpy('afterAdded');

    hot = new Handsontable(container, {
      sheetsBar: { sheets: [{ name: 'A', data: [['a']] }] },
      afterSheetTabAdd: afterAdded,
      licenseKey: 'non-commercial-and-evaluation',
    });

    const id = hot.getPlugin('sheetsBar').getSheets()[0].id;
    const actions = getTabMenuActions(hot, id);

    actions.duplicate(id);

    expect(afterAdded).toHaveBeenCalledTimes(1);
    expect(hot.getPlugin('sheetsBar').getSheets().map(s => s.name)).toEqual(['A', 'A (2)']);
  });

  it('duplicating the active sheet copies its unsaved edits', () => {
    hot = new Handsontable(container, {
      sheetsBar: { sheets: [{ name: 'A', data: [['a']] }] },
      licenseKey: 'non-commercial-and-evaluation',
    });

    const plugin = hot.getPlugin('sheetsBar');
    const id = plugin.getSheets()[0].id;

    hot.setDataAtCell(0, 0, 'edited');
    getTabMenuActions(hot, id).duplicate(id);
    plugin.setActiveSheet('A (2)');

    expect(hot.getDataAtCell(0, 0)).toBe('edited');
  });

  it('a beforeSheetTabAdd listener cancels the duplicate', () => {
    const afterAdded = jasmine.createSpy('afterAdded');

    hot = new Handsontable(container, {
      sheetsBar: { sheets: [{ name: 'A', data: [['a']] }] },
      beforeSheetTabAdd: () => false,
      afterSheetTabAdd: afterAdded,
      licenseKey: 'non-commercial-and-evaluation',
    });

    const id = hot.getPlugin('sheetsBar').getSheets()[0].id;
    const actions = getTabMenuActions(hot, id);

    actions.duplicate(id);

    expect(afterAdded).not.toHaveBeenCalled();
    expect(hot.getPlugin('sheetsBar').getSheets().length).toBe(1);
  });

  it('shows paging arrows only when the strip overflows', () => {
    hot = new Handsontable(container, {
      data: [['x']],
      sheetsBar: true,
      licenseKey: 'non-commercial-and-evaluation',
    });

    const bar = hot.rootWrapperElement.querySelector('.ht-sheets-bar');
    const strip = bar.querySelector('.ht-sheets-bar__tabs');
    const paging = bar.querySelector('.ht-sheets-bar__paging');

    Object.defineProperty(strip, 'clientWidth', { configurable: true, value: 500 });
    Object.defineProperty(strip, 'scrollWidth', { configurable: true, value: 400 });
    strip.dispatchEvent(new Event('scroll'));
    expect(paging.hidden).toBe(true);

    Object.defineProperty(strip, 'scrollWidth', { configurable: true, value: 900 });
    strip.dispatchEvent(new Event('scroll'));
    expect(paging.hidden).toBe(false);
  });

  it('never shows arrows when paging is disabled', () => {
    hot = new Handsontable(container, {
      data: [['x']],
      sheetsBar: { paging: false },
      licenseKey: 'non-commercial-and-evaluation',
    });

    const bar = hot.rootWrapperElement.querySelector('.ht-sheets-bar');
    const strip = bar.querySelector('.ht-sheets-bar__tabs');

    Object.defineProperty(strip, 'clientWidth', { configurable: true, value: 100 });
    Object.defineProperty(strip, 'scrollWidth', { configurable: true, value: 900 });
    strip.dispatchEvent(new Event('scroll'));

    expect(bar.querySelector('.ht-sheets-bar__paging').hidden).toBe(true);
  });

  it('the paging arrows are labeled for assistive technology', () => {
    hot = new Handsontable(container, {
      data: [['x']],
      sheetsBar: true,
      licenseKey: 'non-commercial-and-evaluation',
    });

    const bar = hot.rootWrapperElement.querySelector('.ht-sheets-bar');

    expect(bar.querySelector('.ht-sheets-bar__page-prev').getAttribute('aria-label')).toBe('Scroll sheets backward');
    expect(bar.querySelector('.ht-sheets-bar__page-next').getAttribute('aria-label')).toBe('Scroll sheets forward');
  });

  it('clicking the paging arrows scrolls the strip forward/backward', () => {
    hot = new Handsontable(container, {
      data: [['x']],
      sheetsBar: true,
      licenseKey: 'non-commercial-and-evaluation',
    });

    const bar = hot.rootWrapperElement.querySelector('.ht-sheets-bar');
    const strip = bar.querySelector('.ht-sheets-bar__tabs');

    Object.defineProperty(strip, 'clientWidth', { configurable: true, value: 200 });
    Object.defineProperty(strip, 'scrollWidth', { configurable: true, value: 600 });
    strip.scrollLeft = 0;
    strip.dispatchEvent(new Event('scroll'));

    expect(bar.querySelector('.ht-sheets-bar__page-prev').getAttribute('aria-disabled')).toBe('true');
    expect(bar.querySelector('.ht-sheets-bar__page-next').getAttribute('aria-disabled')).toBe('false');

    bar.querySelector('.ht-sheets-bar__page-next').click();
    expect(strip.scrollLeft).toBe(200);

    // jsdom does not fire `scroll` when the offset is assigned, so the arrows are re-evaluated
    // by hand where a browser would do it for us.
    strip.dispatchEvent(new Event('scroll'));

    bar.querySelector('.ht-sheets-bar__page-prev').click();
    expect(strip.scrollLeft).toBe(0);
  });

  it('mirrors the paging arrow scroll direction under RTL', () => {
    hot = new Handsontable(container, {
      data: [['x']],
      sheetsBar: true,
      layoutDirection: 'rtl',
      licenseKey: 'non-commercial-and-evaluation',
    });

    const bar = hot.rootWrapperElement.querySelector('.ht-sheets-bar');
    const strip = bar.querySelector('.ht-sheets-bar__tabs');

    Object.defineProperty(strip, 'clientWidth', { configurable: true, value: 200 });
    Object.defineProperty(strip, 'scrollWidth', { configurable: true, value: 600 });
    strip.scrollLeft = 0;
    strip.dispatchEvent(new Event('scroll'));

    bar.querySelector('.ht-sheets-bar__page-next').click();
    expect(strip.scrollLeft).toBe(-200);
  });

  it('mirrors moveRight/moveLeft under RTL so moveRight moves a tab toward index 0', () => {
    hot = new Handsontable(container, {
      sheetsBar: { sheets: [{ name: 'A', data: [['a']] }, { name: 'B', data: [['b']] }] },
      layoutDirection: 'rtl',
      licenseKey: 'non-commercial-and-evaluation',
    });

    const sheets = hot.getPlugin('sheetsBar').getSheets();
    const actions = getTabMenuActions(hot, sheets[1].id);

    actions.moveRight(sheets[1].id);

    expect(hot.getPlugin('sheetsBar').getSheets().map(s => s.name)).toEqual(['B', 'A']);
  });

  it('keeps edits made to the default sheet across a switch round-trip', () => {
    hot = new Handsontable(container, {
      data: [['a', 'b']],
      sheetsBar: true,
      licenseKey: 'non-commercial-and-evaluation',
    });

    const plugin = hot.getPlugin('sheetsBar');

    hot.setDataAtCell(0, 0, 'edited');
    plugin.addSheet();

    const [first, second] = plugin.getSheets();

    plugin.setActiveSheet(second.id);

    expect(hot.getDataAtCell(0, 0)).toBe(null);

    plugin.setActiveSheet(first.id);

    expect(hot.getDataAtCell(0, 0)).toBe('edited');
  });

  it('keeps edits made to a declared sheet across a switch round-trip', () => {
    hot = new Handsontable(container, {
      sheetsBar: { sheets: [{ name: 'A', data: [['a']] }, { name: 'B', data: [['b']] }] },
      licenseKey: 'non-commercial-and-evaluation',
    });

    const plugin = hot.getPlugin('sheetsBar');

    hot.setDataAtCell(0, 0, 'edited');
    plugin.setActiveSheet('B');
    plugin.setActiveSheet('A');

    expect(hot.getDataAtCell(0, 0)).toBe('edited');
  });

  it('renders sheet names in the all-sheets menu as text, never as markup', () => {
    hot = new Handsontable(container, {
      sheetsBar: {
        sheets: [{ name: '<img src=x onerror="window.sheetsBarXss = true">', data: [['a']] }],
      },
      licenseKey: 'non-commercial-and-evaluation',
    });

    hot.rootWrapperElement.querySelector('.ht-sheets-bar__all').click();

    const menu = hot.rootPortalElement.querySelector('.htSheetsBarMenu');

    expect(menu).not.toBe(null);
    expect(menu.querySelector('img')).toBe(null);
    expect(menu.textContent).toContain('<img src=x');
    expect(window.sheetsBarXss).toBe(undefined);
  });

  it('keeps switching usable after a switch threw part-way through', () => {
    hot = new Handsontable(container, {
      sheetsBar: {
        sheets: [
          { name: 'A', data: [['a']] },
          { name: 'B', data: [['b']] },
          { name: 'C', data: [['c']] },
        ],
      },
      licenseKey: 'non-commercial-and-evaluation',
    });

    const plugin = hot.getPlugin('sheetsBar');

    jest.spyOn(hot, 'loadData').mockImplementationOnce(() => {
      throw new Error('switch failed');
    });

    expect(() => plugin.setActiveSheet('B')).toThrow();
    expect(plugin.setActiveSheet('C')).toBe(true);
    expect(hot.getDataAtCell(0, 0)).toBe('c');
  });

  it('does not replay cell meta tracked before a workbook rebuild', () => {
    hot = new Handsontable(container, {
      data: [['a']],
      sheetsBar: true,
      licenseKey: 'non-commercial-and-evaluation',
    });

    hot.setCellMeta(0, 0, 'readOnly', true);
    hot.updateSettings({
      sheetsBar: { sheets: [{ name: 'X', data: [['x']] }, { name: 'Y', data: [['y']] }] },
    });

    const plugin = hot.getPlugin('sheetsBar');

    plugin.setActiveSheet('Y');
    plugin.setActiveSheet('X');

    expect(hot.getCellMeta(0, 0).readOnly).not.toBe(true);
  });

  it('renders icon-only control buttons labelled for assistive technology', () => {
    hot = new Handsontable(container, {
      data: [['x']],
      sheetsBar: true,
      licenseKey: 'non-commercial-and-evaluation',
    });

    const bar = hot.rootWrapperElement.querySelector('.ht-sheets-bar');
    const iconButtons = ['add', 'all', 'page-prev', 'page-next'];

    iconButtons.forEach((name) => {
      const button = bar.querySelector(`.ht-sheets-bar__${name}`);

      expect(button.textContent).toBe('');
      expect(button.getAttribute('aria-label')).not.toBe('');
    });
  });

  it('exposes menu popup semantics on the all-sheets button and on the tab itself', () => {
    hot = new Handsontable(container, {
      sheetsBar: { sheets: [{ name: 'Alpha', data: [['a']] }] },
      licenseKey: 'non-commercial-and-evaluation',
    });

    const bar = hot.rootWrapperElement.querySelector('.ht-sheets-bar');
    const allButton = bar.querySelector('.ht-sheets-bar__all');
    const tab = bar.querySelector('.ht-sheets-bar__tab');

    expect(allButton.getAttribute('aria-haspopup')).toBe('menu');
    expect(allButton.getAttribute('aria-expanded')).toBe('false');

    // The tab is the control: it takes the focus, carries the popup semantics, and is named by
    // the sheet name it contains. The trigger glyph is decoration hidden from assistive tech.
    expect(tab.getAttribute('role')).toBe('button');
    expect(tab.tabIndex).toBe(0);
    expect(tab.getAttribute('aria-haspopup')).toBe('menu');
    expect(tab.getAttribute('aria-expanded')).toBe('false');
    expect(tab.textContent).toContain('Alpha');
    expect(bar.querySelector('.ht-sheets-bar__tab-chevron').getAttribute('aria-hidden')).toBe('true');
    expect(bar.querySelector('.ht-sheets-bar__tabs').getAttribute('aria-label')).not.toBe(null);

    allButton.click();

    expect(allButton.getAttribute('aria-expanded')).toBe('true');

    hot.getPlugin('sheetsBar').disablePlugin();
  });

  it('labels the rename input and restores focus to the tab on Enter and Escape', () => {
    hot = new Handsontable(container, {
      sheetsBar: { sheets: [{ name: 'Alpha', data: [['a']] }] },
      licenseKey: 'non-commercial-and-evaluation',
    });

    const bar = hot.rootWrapperElement.querySelector('.ht-sheets-bar');

    bar.querySelector('.ht-sheets-bar__tab-label')
      .dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));

    const input = bar.querySelector('.ht-sheets-bar__tab-rename');

    expect(input.getAttribute('aria-label')).toBe('Sheet name');

    input.value = 'Beta';
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));

    const label = bar.querySelector('.ht-sheets-bar__tab-label');

    expect(label.textContent).toBe('Beta');
    expect(hot.rootDocument.activeElement).toBe(bar.querySelector('.ht-sheets-bar__tab'));

    label.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
    bar.querySelector('.ht-sheets-bar__tab-rename')
      .dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));

    const labelAfterCancel = bar.querySelector('.ht-sheets-bar__tab-label');

    expect(labelAfterCancel.textContent).toBe('Beta');
    expect(hot.rootDocument.activeElement).toBe(bar.querySelector('.ht-sheets-bar__tab'));
  });

  it('keeps a runtime-added sheet when updateSettings re-emits the same sheetsBar value', () => {
    hot = new Handsontable(container, {
      data: [['a']],
      sheetsBar: true,
      licenseKey: 'non-commercial-and-evaluation',
    });

    hot.getPlugin('sheetsBar').addSheet('Extra');
    hot.updateSettings({ sheetsBar: true });

    expect(hot.getPlugin('sheetsBar').getSheets().map(s => s.name)).toEqual(['Sheet1', 'Extra']);
  });

  it('keeps a runtime-added sheet when updateSettings re-emits an equivalent settings object', () => {
    const sheets = [{ name: 'A', data: [['a']] }, { name: 'B', data: [['b']] }];

    hot = new Handsontable(container, {
      sheetsBar: { sheets },
      licenseKey: 'non-commercial-and-evaluation',
    });

    hot.getPlugin('sheetsBar').addSheet('Extra');
    hot.updateSettings({ sheetsBar: { sheets: [...sheets] } });

    expect(hot.getPlugin('sheetsBar').getSheets().map(s => s.name)).toEqual(['A', 'B', 'Extra']);
  });

  it('keeps a runtime-added sheet when a re-emit rebuilds the per-sheet settings literals', () => {
    const dataA = [['a']];
    const dataB = [['b']];

    hot = new Handsontable(container, {
      sheetsBar: {
        sheets: [
          { name: 'A', data: dataA, settings: { readOnly: true, colWidths: [120] } },
          { name: 'B', data: dataB },
        ],
      },
      licenseKey: 'non-commercial-and-evaluation',
    });

    hot.getPlugin('sheetsBar').addSheet('Extra');
    hot.updateSettings({
      sheetsBar: {
        sheets: [
          { name: 'A', data: dataA, settings: { readOnly: true, colWidths: [120] } },
          { name: 'B', data: dataB },
        ],
      },
    });

    expect(hot.getPlugin('sheetsBar').getSheets().map(s => s.name)).toEqual(['A', 'B', 'Extra']);
  });

  it('rebuilds the workbook when a re-emitted sheet declares different settings', () => {
    const dataA = [['a']];

    hot = new Handsontable(container, {
      sheetsBar: { sheets: [{ name: 'A', data: dataA, settings: { readOnly: true } }] },
      licenseKey: 'non-commercial-and-evaluation',
    });

    hot.getPlugin('sheetsBar').addSheet('Extra');
    hot.updateSettings({
      sheetsBar: { sheets: [{ name: 'A', data: dataA, settings: { readOnly: false } }] },
    });

    expect(hot.getPlugin('sheetsBar').getSheets().map(s => s.name)).toEqual(['A']);
  });

  it('rebuilds the workbook when the sheetsBar setting genuinely changes', () => {
    hot = new Handsontable(container, {
      data: [['a']],
      sheetsBar: true,
      licenseKey: 'non-commercial-and-evaluation',
    });

    hot.getPlugin('sheetsBar').addSheet('Extra');
    hot.updateSettings({ sheetsBar: { sheets: [{ name: 'Only', data: [['o']] }] } });

    expect(hot.getPlugin('sheetsBar').getSheets().map(s => s.name)).toEqual(['Only']);
  });

  it('warns about a malformed option and keeps the default value', () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    hot = new Handsontable(container, {
      data: [['a']],
      sheetsBar: { sheets: 'nope', paging: 'yes' },
      licenseKey: 'non-commercial-and-evaluation',
    });

    const warnings = warnSpy.mock.calls.map(args => String(args[0]));

    expect(warnings.some(message => message.includes('"sheets" option is not valid'))).toBe(true);
    expect(warnings.some(message => message.includes('"paging" option is not valid'))).toBe(true);
    expect(hot.getPlugin('sheetsBar').getSetting('paging')).toBe(true);
  });

  it('tolerates a second SheetsBarUI destroy call', () => {
    const uiHost = document.createElement('div');

    document.body.appendChild(uiHost);

    const ui = new SheetsBarUI({
      rootDocument: document,
      uiContainer: uiHost,
      isRtl: false,
      themeName: undefined,
      phraseTranslator: () => '',
      a11yAnnouncer: () => {},
    });

    ui.destroy();

    expect(() => ui.destroy()).not.toThrow();
    uiHost.remove();
  });
});
