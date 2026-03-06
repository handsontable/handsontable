describe('HiddenColumns', () => {
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
        data: createSpreadsheetData(30, 30),
        hiddenColumns: {
          columns: [0, 1, 2, 3, 4, 5],
        },
        width: 250,
        height: 250,
        colWidths: 50,
      });

      await selectCell(0, 6);

      const $mainHolder = spec().$container.find('.ht_master .wtHolder');
      const startScrollLeft = $mainHolder.scrollLeft();

      await keyDownUp('enter');
      await sleep(200);

      expect($mainHolder.scrollLeft()).toBe(startScrollLeft);
    });

    it('should populate value from an editor properly when there are some hidden columns & row header was selected', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        colHeaders: true,
        rowHeaders: true,
        hiddenColumns: {
          columns: [0, 1],
          indicators: true
        }
      });

      const firstHeader = spec().$container.find('.ht_clone_inline_start tr:eq(1) th:eq(0)');

      await simulateClick(firstHeader, 'LMB');

      await keyDownUp('F2');
      await keyDownUp(['control/meta', 'enter']);

      expect(getData()).toEqual([
        ['C1', 'C1', 'C1', 'C1', 'C1'],
        ['A2', 'B2', 'C2', 'D2', 'E2'],
        ['A3', 'B3', 'C3', 'D3', 'E3'],
        ['A4', 'B4', 'C4', 'D4', 'E4'],
        ['A5', 'B5', 'C5', 'D5', 'E5'],
      ]);
    });

    it('should populate value from an editor properly when there are some hidden columns & corner was selected', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        colHeaders: true,
        rowHeaders: true,
        hiddenColumns: {
          columns: [0, 1],
          indicators: true
        }
      });

      const corner = $('.ht_clone_top_inline_start_corner .htCore').find('thead').find('th').eq(0);

      await simulateClick(corner, 'LMB');

      await keyDownUp('F2');
      await keyDownUp(['control/meta', 'enter']);

      expect(getData()).toEqual([
        ['C1', 'C1', 'C1', 'C1', 'C1'],
        ['C1', 'C1', 'C1', 'C1', 'C1'],
        ['C1', 'C1', 'C1', 'C1', 'C1'],
        ['C1', 'C1', 'C1', 'C1', 'C1'],
        ['C1', 'C1', 'C1', 'C1', 'C1'],
      ]);
    });
  });

  describe('Data change by typing with hiddenColumns', () => {
    it('should correctly render the changed values subjected to validation when there is a hidden column next to it', async() => {
      handsontable({
        data: [[1, 2, 'Smith']],
        hiddenColumns: {
          columns: [0], // hide the first column
        },
        columns: [
          {}, // the first empty column
          { // the second numeric column
            type: 'numeric',
            allowInvalid: false,
          },
          {}, // the last column without validation
        ]
      });

      await selectCell(0, 1);
      await keyDownUp('enter'); // open the editor
      await sleep(200);

      document.activeElement.value = 'aa'; // type incorect value

      await keyDownUp('enter'); // confirm change the value
      await sleep(200);
      await keyDownUp('escape'); // close the editor
      await sleep(200);

      expect(getDataAtCell(0, 1)).toBe(2);
      expect(getCell(0, 1).textContent).toBe('2');
    });
  });
});
