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
    it('should add as many header levels as the \'colHeaders\' property suggests', () => {
      const hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10),
        colHeaders: true,
        nestedHeaders: [
          ['a', 'b', 'c', 'd'],
          ['a', 'b', 'c', 'd']
        ]
      });

      expect(hot.view._wt.wtTable.THEAD.querySelectorAll('tr').length).toEqual(2);
    });

    it('should adjust headers widths', () => {
      const hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10),
        colHeaders: true,
        nestedHeaders: [
          ['a', { label: 'b', colspan: 2 }, 'c', 'd'],
          ['a', 'Long column header', 'c', 'd']
        ]
      });

      const headers = hot.view._wt.wtTable.THEAD.querySelectorAll('tr:first-of-type th');

      expect(hot.getColWidth(1)).toBeGreaterThan(50);
      expect(headers[1].offsetWidth).toBeGreaterThan(100);
    });
  });

  describe('cooperation with drop-down menu element', () => {
    it('should close drop-down menu after click on header which sorts a column', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 11),
        colHeaders: true,
        rowHeaders: true,
        columnSorting: true,
        dropdownMenu: true,
        nestedHeaders: [
          ['A', { label: 'B', colspan: 8 }, 'C'],
        ],
      });

      const $firstHeader = spec().$container.find('.ht_master table.htCore thead th span.columnSorting');

      dropdownMenu(0);

      $firstHeader.simulate('mousedown');
      $firstHeader.simulate('mouseup');
      $firstHeader.simulate('click');

      expect(getPlugin('dropdownMenu').menu.container.style.display).not.toBe('block');
    });
  });
});
