import Handsontable from '../../../index';
import { injectRealCoreStyles, removeRealCoreStyles } from '../../../../test/helpers/realCoreStyles';

const LICENSE_KEY = 'non-commercial-and-evaluation';
const NESTED_HEADERS = [[{ label: 'G', colspan: 3 }, 'd'], ['a', 'b', 'c', 'd']];

/**
 * A sheet's plugin state survives a round trip through a sheet without that plugin: the collapse
 * buttons and a collapsed group of a sheet declaring `nestedHeaders`, and the ticked rows of a sheet
 * declaring `rowSelection`, with their checkboxes drawn again.
 */
describe('SheetsBar: plugin state of a sheet after a round trip through a plain sheet', () => {
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
    removeRealCoreStyles();
  });

  describe('a sheet with its own nested headers and a grid-level `collapsibleColumns`', () => {
    /**
     * Builds the workbook: a sheet with a three-column collapsible group, and a plain sheet.
     *
     * @returns {object} The SheetsBar plugin.
     */
    function createWorkbook() {
      hot = new Handsontable(container, {
        colHeaders: true,
        collapsibleColumns: true,
        sheetsBar: {
          sheets: [
            {
              name: 'Grouped',
              data: Handsontable.helper.createSpreadsheetData(3, 4),
              settings: { nestedHeaders: NESTED_HEADERS },
            },
            { name: 'Plain', data: Handsontable.helper.createSpreadsheetData(3, 4) },
          ],
        },
        licenseKey: LICENSE_KEY,
      });

      return hot.getPlugin('sheetsBar');
    }

    /**
     * Reads the group's state: its header settings, the hidden columns, and the drawn indicator.
     *
     * @returns {object}
     */
    function groupState() {
      const header = hot.getPlugin('nestedHeaders').getStateManager().getHeaderSettings(0, 0);
      const indicator = container.querySelector('.ht_clone_top .collapsibleIndicator')
        ?? container.querySelector('.collapsibleIndicator');

      return {
        collapsible: header?.collapsible === true,
        collapsed: header?.isCollapsed === true,
        hiddenColumns: [0, 1, 2, 3].filter(column => hot.columnIndexMapper.isHidden(column)),
        indicator: indicator ? indicator.classList.contains('collapsed') : null,
      };
    }

    it('keeps the group collapsible and collapsed after a round trip', () => {
      const sheetsBar = createWorkbook();

      hot.getPlugin('collapsibleColumns').collapseSection({ row: -2, col: 0 });

      const before = groupState();

      expect(before).toEqual({ collapsible: true, collapsed: true, hiddenColumns: [1, 2], indicator: true });

      sheetsBar.setActiveSheet('Plain');

      expect(container.querySelector('.collapsibleIndicator')).toBeNull();
      expect([0, 1, 2, 3].filter(column => hot.columnIndexMapper.isHidden(column))).toEqual([]);

      sheetsBar.setActiveSheet('Grouped');

      expect(groupState()).toEqual(before);
    });

    it('keeps an expanded group expanded and collapsible after a round trip', () => {
      const sheetsBar = createWorkbook();

      sheetsBar.setActiveSheet('Plain');
      sheetsBar.setActiveSheet('Grouped');

      expect(groupState()).toEqual({ collapsible: true, collapsed: false, hiddenColumns: [], indicator: false });
    });
  });

  describe('a sheet with its own `rowSelection`', () => {
    /**
     * Reads every rendered row header cell of the master table, per row.
     *
     * @returns {object[]}
     */
    function rowHeaders() {
      return Array.from(container.querySelectorAll('.ht_master tbody tr')).map((row) => {
        const headers = Array.from(row.querySelectorAll('th'));
        const checkboxHeader = headers.find(th => th.querySelector('.htRowSelectionRowHeaderContainer'));
        const checkbox = checkboxHeader?.querySelector('input[type="checkbox"]');

        return {
          headers: headers.length,
          checked: checkbox ? checkbox.checked : null,
          staleNumber: checkboxHeader ? checkboxHeader.querySelector('.rowHeader') !== null : null,
        };
      });
    }

    it('keeps the ticked rows and draws their checkboxes again after a round trip', () => {
      injectRealCoreStyles();

      hot = new Handsontable(container, {
        rowHeaders: true,
        colHeaders: true,
        height: 400,
        sheetsBar: {
          sheets: [
            { name: 'Rows', data: Handsontable.helper.createSpreadsheetData(5, 3), settings: { rowSelection: true } },
            { name: 'Plain', data: Handsontable.helper.createSpreadsheetData(5, 3) },
          ],
        },
        licenseKey: LICENSE_KEY,
      });

      const sheetsBar = hot.getPlugin('sheetsBar');

      hot.getPlugin('rowSelection').selectRows([1, 2]);

      const before = rowHeaders();

      expect(before.slice(0, 3)).toEqual([
        { headers: 2, checked: false, staleNumber: false },
        { headers: 2, checked: true, staleNumber: false },
        { headers: 2, checked: true, staleNumber: false },
      ]);

      sheetsBar.setActiveSheet('Plain');

      expect(container.querySelector('.htRowSelectionRowHeaderContainer')).toBeNull();
      expect(rowHeaders()[0]).toEqual({ headers: 1, checked: null, staleNumber: null });

      sheetsBar.setActiveSheet('Rows');

      expect(hot.getPlugin('rowSelection').getSelectedRows()).toEqual([1, 2]);
      expect(rowHeaders()).toEqual(before);
    });
  });
});
