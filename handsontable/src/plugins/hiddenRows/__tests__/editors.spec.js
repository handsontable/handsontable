describe('HiddenRows', () => {
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

  describe('editors', () => {
    it('should properly detect if editor is in a viewport', async() => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(30, 30),
        hiddenRows: {
          rows: [0, 1, 2, 3, 4, 5],
        },
        width: 250,
        height: 250,
        rowHeights: 50,
      });

      selectCell(6, 0);

      const $mainHolder = spec().$container.find('.ht_master .wtHolder');
      const startScrollTop = $mainHolder.scrollTop();

      keyDownUp('enter');

      await sleep(200);

      expect($mainHolder.scrollTop()).toBe(startScrollTop);
    });

    it('should populate value from an editor properly when there are some hidden rows & column header was selected', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 5),
        colHeaders: true,
        rowHeaders: true,
        hiddenRows: {
          rows: [0, 1],
          indicators: true
        }
      });

      const firstHeader = spec().$container.find('.ht_clone_top tr:eq(0) th:eq(1)');

      simulateClick(firstHeader, 'LMB');

      keyDownUp('enter');
      keyDownUp('ctrl+enter');

      expect(getData()).toEqual([
        ['A3', 'B1', 'C1', 'D1', 'E1'],
        ['A3', 'B2', 'C2', 'D2', 'E2'],
        ['A3', 'B3', 'C3', 'D3', 'E3'],
        ['A3', 'B4', 'C4', 'D4', 'E4'],
        ['A3', 'B5', 'C5', 'D5', 'E5'],
      ]);
    });

    it('should populate value from an editor properly when there are some hidden rows & corner was selected', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 5),
        colHeaders: true,
        rowHeaders: true,
        hiddenRows: {
          rows: [0, 1],
          indicators: true
        }
      });

      const corner = $('.ht_clone_top_left_corner .htCore').find('thead').find('th').eq(0);

      simulateClick(corner, 'LMB');

      keyDownUp('enter');
      keyDownUp('ctrl+enter');

      expect(getData()).toEqual([
        ['A3', 'A3', 'A3', 'A3', 'A3'],
        ['A3', 'A3', 'A3', 'A3', 'A3'],
        ['A3', 'A3', 'A3', 'A3', 'A3'],
        ['A3', 'A3', 'A3', 'A3', 'A3'],
        ['A3', 'A3', 'A3', 'A3', 'A3'],
      ]);
    });
  });
});
