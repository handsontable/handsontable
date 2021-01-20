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
        data: Handsontable.helper.createSpreadsheetData(30, 30),
        hiddenColumns: {
          columns: [0, 1, 2, 3, 4, 5],
        },
        width: 250,
        height: 250,
        colWidths: 50,
      });

      selectCell(0, 6);

      const $mainHolder = spec().$container.find('.ht_master .wtHolder');
      const startScrollLeft = $mainHolder.scrollLeft();

      keyDownUp('enter');

      await sleep(200);

      expect($mainHolder.scrollLeft()).toBe(startScrollLeft);
    });
  });

  describe('Data change by typing with hiddenColumns', () => {
    it('should correctly render the changed values subjected to validation when there is a hidden column next to it', async() => {
      const hot = handsontable({
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

      hot.selectCell(0, 1);
      keyDownUp('enter'); // open the editor
      await sleep(200);

      document.activeElement.value = 'aa'; // type incorect value
      keyDownUp('enter'); // confirm change the value
      await sleep(200);
      keyDownUp('esc'); // close the editor
      await sleep(200);

      expect(hot.getDataAtCell(0, 1)).toBe(2);
      expect(hot.getCell(0, 1).textContent).toBe('2');
    });
  });
});
