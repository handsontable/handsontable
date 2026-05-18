describe('settings', () => {
  describe('trimWhitespace', () => {
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

    describe('in table settings layer', () => {
      it('should trimmed out the whitespace after cell edit, if trimWhitespace is set to `true`', async() => {
        handsontable({
          data: createSpreadsheetData(3, 9),
          trimWhitespace: true
        });

        await selectCell(0, 2);
        await keyDownUp('enter');

        getActiveEditor().TEXTAREA.value = '       test    of    whitespace      ';

        await keyDownUp('enter');

        expect(getDataAtCell(0, 2)).toBe('test    of    whitespace');
      });

      it('should not trimmed out the whitespace after cell edit, if trimWhitespace is set to `false`', async() => {
        handsontable({
          data: createSpreadsheetData(3, 9),
          trimWhitespace: false
        });

        await selectCell(0, 2);
        await keyDownUp('enter');

        getActiveEditor().TEXTAREA.value = '       test    of    whitespace      ';

        await keyDownUp('enter');

        expect(getDataAtCell(0, 2)).toBe('       test    of    whitespace      ');
      });

      it('should trimmed out the whitespace through cell renderers, if trimWhitespace is set to `true`', async() => {
        handsontable({
          data: [
            ['       test    of    whitespace      ', '       test    of    whitespace      ']
          ],
          trimWhitespace: true
        });

        expect(getCell(0, 0).innerText).toBe('test    of    whitespace');
      });

      it('should not trimmed out the whitespace through cell renderers, if trimWhitespace is set to `false`', async() => {
        handsontable({
          data: [
            ['       test    of    whitespace      ', '       test    of    whitespace      ']
          ],
          trimWhitespace: false
        });

        expect(getCell(0, 0).innerText).toBe('       test    of    whitespace      ');
      });
    });

    describe('in column settings layer', () => {
      it('should trimmed out the whitespace after cell edit, if trimWhitespace is set to `true`', async() => {
        handsontable({
          data: createSpreadsheetData(3, 9),
          trimWhitespace: false,
          columns: [
            {},
            { trimWhitespace: true }
          ]
        });

        await selectCell(0, 1);
        await keyDownUp('enter');

        getActiveEditor().TEXTAREA.value = '       test    of    whitespace      ';

        await keyDownUp('enter');

        expect(getDataAtCell(0, 1)).toBe('test    of    whitespace');
      });

      it('should not trimmed out the whitespace after cell edit, if trimWhitespace is set to `false`', async() => {
        handsontable({
          data: createSpreadsheetData(3, 9),
          trimWhitespace: true,
          columns: [
            {},
            { trimWhitespace: false }
          ]
        });

        await selectCell(0, 1);
        await keyDownUp('enter');

        getActiveEditor().TEXTAREA.value = '       test    of    whitespace      ';

        await keyDownUp('enter');

        expect(getDataAtCell(0, 1)).toBe('       test    of    whitespace      ');
      });

      it('should trimmed out the whitespace through cell renderers, if trimWhitespace is set to `true`', async() => {
        handsontable({
          data: [
            ['       test    of    whitespace      ', '       test    of    whitespace      ']
          ],
          trimWhitespace: false,
          columns: [
            {},
            { trimWhitespace: true }
          ]
        });

        expect(getCell(0, 1).innerText).toBe('test    of    whitespace');
      });

      it('should not trimmed out the whitespace through cell renderers, if trimWhitespace is set to `false`', async() => {
        handsontable({
          data: [
            ['       test    of    whitespace      ', '       test    of    whitespace      ']
          ],
          trimWhitespace: true,
          columns: [
            {},
            { trimWhitespace: false }
          ]
        });

        expect(getCell(0, 1).innerText).toBe('       test    of    whitespace      ');
      });
    });

    describe('in cell settings layer', () => {
      it('should trimmed out the whitespace after cell edit, if trimWhitespace is set to `true`', async() => {
        handsontable({
          data: createSpreadsheetData(3, 9),
          trimWhitespace: false,
          cells(row, col) {
            if (col === 1) {
              return { trimWhitespace: true };
            }
          }
        });

        await selectCell(0, 1);
        await keyDownUp('enter');

        getActiveEditor().TEXTAREA.value = '       test    of    whitespace      ';

        await keyDownUp('enter');

        expect(getDataAtCell(0, 1)).toBe('test    of    whitespace');
      });

      it('should not trimmed out the whitespace after cell edit, if trimWhitespace is set to `false`', async() => {
        handsontable({
          data: createSpreadsheetData(3, 9),
          trimWhitespace: true,
          cells(row, col) {
            if (col === 1) {
              return { trimWhitespace: false };
            }
          }
        });

        await selectCell(0, 1);
        await keyDownUp('enter');

        getActiveEditor().TEXTAREA.value = '       test    of    whitespace      ';

        await keyDownUp('enter');

        expect(getDataAtCell(0, 1)).toBe('       test    of    whitespace      ');
      });

      it('should trimmed out the whitespace through cell renderers, if trimWhitespace is set to `true`', async() => {
        handsontable({
          data: [
            ['       test    of    whitespace      ', '       test    of    whitespace      ']
          ],
          trimWhitespace: false,
          cells(row, col) {
            if (col === 1) {
              return { trimWhitespace: true };
            }
          }
        });

        expect(getCell(0, 1).innerText).toBe('test    of    whitespace');
      });

      it('should not trimmed out the whitespace through cell renderers, if trimWhitespace is set to `false`', async() => {
        handsontable({
          data: [
            ['       test    of    whitespace      ', '       test    of    whitespace      ']
          ],
          trimWhitespace: true,
          cells(row, col) {
            if (col === 1) {
              return { trimWhitespace: false };
            }
          }
        });

        expect(getCell(0, 1).innerText).toBe('       test    of    whitespace      ');
      });
    });
  });
});
