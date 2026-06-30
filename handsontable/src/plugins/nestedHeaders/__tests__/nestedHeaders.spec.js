describe('NestedHeaders', () => {
  const id = 'testContainer';

  beforeEach(function() {
    this.$container = $(`<div id="${id}"></div>`).appendTo('body');

    // Matchers configuration.
    this.matchersConfig = {
      toMatchHTML: {
        keepAttributes: ['class', 'colspan']
      }
    };
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  describe('basic functionality', () => {
    it('should add as many header levels as the \'colHeaders\' property suggests', async() => {
      handsontable({
        data: createSpreadsheetData(10, 10),
        colHeaders: true,
        nestedHeaders: [
          ['a', 'b', 'c', 'd'],
          ['a', 'b', 'c', 'd']
        ]
      });

      expect(tableView()._wt.wtTable.THEAD.querySelectorAll('tr').length).toEqual(2);
    });

    it('should adjust headers widths', async() => {
      handsontable({
        data: createSpreadsheetData(10, 10),
        colHeaders: true,
        nestedHeaders: [
          ['a', { label: 'b', colspan: 2 }, 'c', 'd'],
          ['a', 'Long column header', 'c', 'd']
        ]
      });

      const headers = tableView()._wt.wtTable.THEAD.querySelectorAll('tr:first-of-type th');

      expect(getColWidth(1)).toBeGreaterThan(50);
      expect(headers[1].offsetWidth).toBeGreaterThan(100);
    });

    it('should respect colWidths and not expand columns to fit nested header labels when autoColumnSize is false', async() => {
      handsontable({
        data: createSpreadsheetData(10, 10),
        colHeaders: true,
        autoColumnSize: false,
        colWidths: 50,
        nestedHeaders: [
          ['a', { label: 'This is a very long group header label', colspan: 2 }, 'c', 'd'],
          ['a', 'b', 'c', 'd', 'e']
        ]
      });

      expect(getColWidth(0)).toBe(50);
      expect(getColWidth(1)).toBe(50);
      expect(getColWidth(2)).toBe(50);
      expect(getColWidth(3)).toBe(50);
    });

    it('should re-expand columns to content width after `updateSettings({ colWidths: undefined })` when `nestedHeaders` is enabled (#7604)', async() => {
      const longContent = 'this is a very long cell content that should expand the column';

      handsontable({
        data: [
          [longContent, 'b', 'c', 'd', 'e'],
          ['a', 'b', 'c', 'd', 'e'],
        ],
        colHeaders: true,
        colWidths: 100,
        nestedHeaders: [
          [{ label: 'h', colspan: 2 }, 'c', 'd', 'e'],
          ['a', 'b', 'c', 'd', 'e'],
        ],
      });

      expect(getColWidth(0)).toBe(100);

      await updateSettings({ colWidths: undefined });

      expect(getColWidth(0)).toBeGreaterThan(200);
    });

    it('should not override a programmatically narrowed column width when `nestedHeaders` and `manualColumnResize` are enabled', async() => {
      handsontable({
        data: [
          ['this is a very long cell content', 'b', 'c', 'd', 'e'],
          ['a', 'b', 'c', 'd', 'e'],
        ],
        colHeaders: true,
        manualColumnResize: [30, 50, 50, 50, 50],
        nestedHeaders: [
          [{ label: 'h', colspan: 2 }, 'c', 'd', 'e'],
          ['a', 'b', 'c', 'd', 'e'],
        ],
      });

      expect(getColWidth(0)).toBe(30);
    });
  });

  describe('cooperation with drop-down menu element', () => {
    it('should close drop-down menu after click on header which sorts a column', async() => {
      handsontable({
        data: createSpreadsheetData(5, 11),
        colHeaders: true,
        rowHeaders: true,
        columnSorting: true,
        dropdownMenu: true,
        nestedHeaders: [
          ['A', { label: 'B', colspan: 8 }, 'C'],
        ],
      });

      const $firstHeader = spec().$container.find('.ht_master table.htCore thead th span.columnSorting');

      await dropdownMenu(0);

      $firstHeader.simulate('mousedown');
      $firstHeader.simulate('mouseup');
      $firstHeader.simulate('click');

      expect(getPlugin('dropdownMenu').menu.container.style.display).not.toBe('block');
    });

    it('should not throw after sorting when current highlight is disabled', async() => {
      handsontable({
        data: createSpreadsheetData(5, 11),
        colHeaders: true,
        rowHeaders: true,
        columnSorting: true,
        navigableHeaders: true,
        disableVisualSelection: 'current',
        nestedHeaders: [
          ['A', { label: 'B', colspan: 8 }, 'C'],
        ],
      });

      const $headerWithSortAction = spec().$container.find(
        '.ht_master table.htCore thead tr:last-of-type th:nth-of-type(2) span.columnSorting'
      );

      $headerWithSortAction.simulate('mousedown');
      $headerWithSortAction.simulate('mouseup');
      $headerWithSortAction.simulate('click');

      expect(getPlugin('columnSorting').isSorted()).toBe(true);
    });
  });
});
