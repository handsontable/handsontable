describe('CopyPaste', () => {
  const id = 'testContainer';

  beforeEach(function() {
    this.$container = $(`<div id="${id}"></div>`).appendTo('body');
    // Installing spy stabilizes the tests. Without that on CI and real browser there are some
    // differences in results.
    spyOn(document, 'execCommand');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  describe('`beforePaste` hook', () => {
    it('should be possible to prevent pasting by splicing the pasted data to an empty array', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        colHeaders: true,
        copyPaste: true,
        beforePaste(pastedData) {
          pastedData.splice(0, pastedData.length);
        },
      });

      const plugin = getPlugin('CopyPaste');

      await selectCell(1, 1);

      plugin.paste('a\na\na\na\na\na\na\na\na\na');

      expect(getDataAtCol(1)).toEqual(['B1', 'B2', 'B3', 'B4', 'B5']);
    });

    it('should be possible to modify the pasted data in beforePaste hook (scalar values)', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        colHeaders: true,
        copyPaste: true,
        beforePaste(pastedData) {
          for (let r = 0; r < pastedData.length; r++) {
            for (let c = 0; c < pastedData[r].length; c++) {
              pastedData[r][c] = 'test';
            }
          }
        },
      });

      const plugin = getPlugin('CopyPaste');

      await selectCell(1, 1);

      plugin.paste('a\na\na\na');

      expect(getDataAtCol(1)).toEqual(['B1', 'test', 'test', 'test', 'test']);
    });

    it('should be possible to modify the pasted data in beforePaste hook (object values)', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5).map(row => row.map(() => ({ name: 'test', code: '0' }))),
        renderer(hot, td, row, col, prop, value) {
          td.textContent = `${value.name}: ${value.code}`;
        },
        colHeaders: true,
        copyPaste: true,
        beforePaste(pastedData) {
          for (let r = 0; r < pastedData.length; r++) {
            for (let c = 0; c < pastedData[r].length; c++) {
              pastedData[r][c] = { name: 'test', code: 'test' };
            }
          }
        },
      });

      const plugin = getPlugin('CopyPaste');

      await selectCell(1, 1);

      plugin.paste('a\na\na\na');

      expect(getDataAtCol(1)).toEqual([
        { name: 'test', code: '0' },
        { name: 'test', code: 'test' },
        { name: 'test', code: 'test' },
        { name: 'test', code: 'test' },
        { name: 'test', code: 'test' },
      ]);
    });
  });
});
