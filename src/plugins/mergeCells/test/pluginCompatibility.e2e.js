describe('MergeCells compatibility with other plugins', () => {
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

  describe('Custom Borders', () => {
    it('should be possible to add custom borders to a merged cell at initialization', () => {
      const hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10),
        mergeCells: [{ row: 1, col: 1, rowspan: 2, colspan: 2 }],
        customBorders: [
          {
            range: {
              from: {
                row: 1,
                col: 1
              },
              to: {
                row: 2,
                col: 2
              }
            },
            top: {
              width: 2,
              color: 'blue'
            }
          }
        ]
      });

      const border = hot.getPlugin('customBorders').getBorders([[1, 1, 2, 2]])[0];

      expect(border.row).toEqual(1);
      expect(border.col).toEqual(1);
      expect(border.top.width).toEqual(2);
      expect(border.top.color).toEqual('blue');
    });
  });

  describe('HiddenRows', () => {
    it('should allow unmerge cells if merged cells are partially hidden', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(4, 3),
        hiddenRows: {
          rows: [1]
        },
        contextMenu: ['mergeCells'],
        mergeCells: [
          { row: 0, col: 1, rowspan: 3, colspan: 2 },
        ],
      });

      selectCell(0, 1);
      contextMenu();

      const $contextMenuItems = $('.htContextMenu .ht_master .htItemWrapper');
      const dictionary = Handsontable.languages.getLanguageDictionary('en-US');
      const expectedMenuItems = dictionary[Handsontable.languages.dictionaryKeys.CONTEXTMENU_ITEMS_UNMERGE_CELLS];

      expect($contextMenuItems.text()).toBe(expectedMenuItems);
      expect(getCell(1, 1)).toBeNull();
    });
  });
});
