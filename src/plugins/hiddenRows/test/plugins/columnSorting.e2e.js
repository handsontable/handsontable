describe('HiddenRows', () => {
  const id = 'testContainer';

  beforeEach(function() {
    this.$container = $(`<div id="${id}"></div>`).appendTo('body');

    this.sortByClickOnColumnHeader = (columnIndex) => {
      const hot = this.$container.data('handsontable');
      const $columnHeader = $(hot.view.wt.wtTable.getColumnHeader(columnIndex));
      const $spanInsideHeader = $columnHeader.find('.columnSorting');

      if ($spanInsideHeader.length === 0) {
        throw Error('Please check the test scenario. The header doesn\'t exist.');
      }

      $spanInsideHeader.simulate('mousedown');
      $spanInsideHeader.simulate('mouseup');
      $spanInsideHeader.simulate('click');
    };
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  describe('ColumnSorting', () => {
    it('should properly change selection after click on sort header', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 1),
        colHeaders: true,
        columnSorting: true,
        hiddenRows: {
          rows: [0],
        }
      });

      spec().sortByClickOnColumnHeader(0);
      spec().sortByClickOnColumnHeader(0);

      expect(getSelected()).toEqual([[-1, 0, 4, 0]]);
      expect(`
      | * |
      |===|
      | A |
      | 0 |
      | 0 |
      | 0 |
      `).toBeMatchToSelectionPattern();
    });
  });
});
