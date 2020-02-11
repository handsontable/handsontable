describe('ContextMenu', () => {
  const id = 'testContainer';

  beforeEach(function() {
    this.$container = $(`<div id="${id}"></div>`).appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  describe('remove rows', () => {
    it('should execute action when single cell is selected', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 5),
        contextMenu: true,
      });

      selectCell(2, 2);
      contextMenu();

      // "Remove row" item
      $('.htContextMenu .ht_master .htCore')
        .find('tbody td')
        .not('.htSeparator')
        .eq(4)
        .simulate('mousedown')
        .simulate('mouseup');

      expect(getDataAtCol(0)).toEqual(['A1', 'A2', 'A4', 'A5']);
    });

    it('should execute action when range of the cells are selected', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 5),
        contextMenu: true,
      });

      selectCell(2, 2, 4, 4);
      contextMenu();

      // "Remove row" item
      $('.htContextMenu .ht_master .htCore')
        .find('tbody td')
        .not('.htSeparator')
        .eq(4)
        .simulate('mousedown')
        .simulate('mouseup');

      expect(getDataAtCol(0)).toEqual(['A1', 'A2']);
    });

    it('should execute action when multiple cells are selected', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(8, 5),
        contextMenu: true,
      });

      $(getCell(0, 0)).simulate('mousedown');
      $(getCell(1, 0)).simulate('mouseover');
      $(getCell(1, 0)).simulate('mouseup');

      keyDown('ctrl');

      $(getCell(2, 1)).simulate('mousedown');
      $(getCell(2, 1)).simulate('mouseover');
      $(getCell(2, 1)).simulate('mouseup');

      $(getCell(0, 3)).simulate('mousedown');
      $(getCell(5, 3)).simulate('mouseover');
      $(getCell(5, 3)).simulate('mouseup');

      $(getCell(5, 0)).simulate('mousedown');
      $(getCell(5, 4)).simulate('mouseover');
      $(getCell(5, 4)).simulate('mouseup');

      $(getCell(7, 4)).simulate('mousedown');
      $(getCell(7, 4)).simulate('mouseover');
      $(getCell(7, 4)).simulate('mouseup');

      contextMenu();

      // "Remove row" item
      $('.htContextMenu .ht_master .htCore')
        .find('tbody td')
        .not('.htSeparator')
        .eq(4)
        .simulate('mousedown')
        .simulate('mouseup');

      expect(getDataAtCol(0)).toEqual(['A7']);
    });

    it('should not shift invalid row when removing a single row', async() => {
      const hot = handsontable({
        data: [
          ['aaa', 2],
          ['bbb', 3],
          ['ccc', 4],
          ['ddd', 'string'],
          ['eee', 6],
        ],
        contextMenu: true,
        columns(column) {
          if (column === 1) {
            return {
              column,
              type: 'numeric'
            };
          }

          return {};
        }
      });

      hot.validateCells();

      await sleep(150);

      selectCell(1, 1);
      contextMenu();

      // "Remove row" item
      $('.htContextMenu .ht_master .htCore')
        .find('tbody td')
        .not('.htSeparator')
        .eq(4)
        .simulate('mousedown')
        .simulate('mouseup');

      expect($(hot.getCell(2, 1)).hasClass('htInvalid')).toBeTruthy();
    });
  });
});
