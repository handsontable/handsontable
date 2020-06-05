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

  describe('remove columns', () => {
    it('should execute action when single cell is selected', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 5),
        contextMenu: true,
      });

      selectCell(2, 2);
      contextMenu();

      // "Remove column" item
      $('.htContextMenu .ht_master .htCore')
        .find('tbody td')
        .not('.htSeparator')
        .eq(5)
        .simulate('mousedown')
        .simulate('mouseup');

      expect(getDataAtRow(0)).toEqual(['A1', 'B1', 'D1', 'E1']);
    });

    it('should execute action when range of the cells are selected', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 5),
        contextMenu: true,
      });

      selectCell(2, 2, 4, 4);
      contextMenu();

      // "Remove column" item
      $('.htContextMenu .ht_master .htCore')
        .find('tbody td')
        .not('.htSeparator')
        .eq(5)
        .simulate('mousedown')
        .simulate('mouseup');

      expect(getDataAtRow(0)).toEqual(['A1', 'B1']);
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

      $(getCell(7, 4)).simulate('mousedown');
      $(getCell(7, 4)).simulate('mouseover');
      $(getCell(7, 4)).simulate('mouseup');

      contextMenu();

      // "Remove column" item
      $('.htContextMenu .ht_master .htCore')
        .find('tbody td')
        .not('.htSeparator')
        .eq(5)
        .simulate('mousedown')
        .simulate('mouseup');

      expect(getDataAtRow(0)).toEqual(['C1']);
    });

    it('should display a disabled entry for "Remove column", when there\'s nothing selected', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(4, 4),
        contextMenu: true,
        height: 100,
        beforeContextMenuShow() {
          this.deselectCell();
        }
      });

      contextMenu();

      const item = $('.htContextMenu .ht_master .htCore').find('tbody td').not('.htSeparator').eq(5);

      expect(item.hasClass('htDisabled')).toBe(true);
    });

    it('should display a disabled entry for "Remove column", when clicking on a row header', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(4, 4),
        contextMenu: true,
        height: 100,
        colHeaders: true,
        rowHeaders: true
      });

      contextMenu(spec().$container.find('.ht_clone_left tbody tr').eq(0).find('th').eq(0));

      const item = $('.htContextMenu .ht_master .htCore').find('tbody td').not('.htSeparator').eq(5);

      expect(item.hasClass('htDisabled')).toBe(true);
    });

    it('should display a disabled entry for "Remove column", when clicking on a corner header', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(4, 4),
        contextMenu: true,
        height: 100,
        colHeaders: true,
        rowHeaders: true
      });

      contextMenu(spec().$container.find('.ht_clone_top_left_corner thead th').eq(0));

      const item = $('.htContextMenu .ht_master .htCore').find('tbody td').not('.htSeparator').eq(5);

      expect(item.hasClass('htDisabled')).toBe(true);
    });
  });
});
