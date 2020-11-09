describe('HiddenRows', () => {
  const id = 'testContainer';

  function getMultilineData(rows, cols) {
    const data = Handsontable.helper.createSpreadsheetData(rows, cols);

    // Column C
    data[0][2] += '\nline';
    data[1][2] += '\nline\nline';

    return data;
  }

  class DataTransferObject {
    constructor() {
      this.data = {
        'text/plain': '',
        'text/html': ''
      };
    }
    getData(type) {
      return this.data[type];
    }
    setData(type, value) {
      this.data[type] = value;
    }
  }

  function getClipboardEventMock() {
    const event = {};

    event.clipboardData = new DataTransferObject();
    event.preventDefault = () => {};

    return event;
  }

  beforeEach(function() {
    this.$container = $(`<div id="${id}"></div>`).appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  describe('copy-paste functionality', () => {
    it('should allow to copy hidden cell', () => {
      const hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 5),
        hiddenRows: {
          rows: [2, 4]
        }
      });

      const copyEvent = getClipboardEventMock('copy');
      const plugin = hot.getPlugin('CopyPaste');

      selectCell(4, 0);

      plugin.setCopyableText();
      plugin.onCopy(copyEvent);

      expect(copyEvent.clipboardData.getData('text/plain')).toEqual('A5');
    });

    it('should allow to copy hidden rows, when "copyPasteEnabled" property is not set', () => {
      const hot = handsontable({
        data: getMultilineData(10, 5),
        hiddenRows: {
          rows: [2, 4]
        },
        width: 500,
        height: 300,
      });

      const copyEvent = getClipboardEventMock('copy');
      const plugin = hot.getPlugin('CopyPaste');

      selectCell(0, 0, 9, 4);

      plugin.setCopyableText();
      plugin.onCopy(copyEvent);

      /* eslint-disable no-tabs */
      expect(copyEvent.clipboardData.getData('text/plain')).toEqual(
        'A1	B1	"C1\n' +
        'line"	D1	E1\n' +
        'A2	B2	"C2\n' +
        'line\n' +
        'line"	D2	E2\n' +
        'A3	B3	C3	D3	E3\n' +
        'A4	B4	C4	D4	E4\n' +
        'A5	B5	C5	D5	E5\n' +
        'A6	B6	C6	D6	E6\n' +
        'A7	B7	C7	D7	E7\n' +
        'A8	B8	C8	D8	E8\n' +
        'A9	B9	C9	D9	E9\n' +
        'A10	B10	C10	D10	E10'
      );
    });

    it('should allow to copy hidden rows, when "copyPasteEnabled" property is set to true', () => {
      const hot = handsontable({
        data: getMultilineData(10, 5),
        hiddenRows: {
          rows: [2, 4],
          copyPasteEnabled: true
        },
        width: 500,
        height: 300
      });

      const copyEvent = getClipboardEventMock('copy');
      const plugin = hot.getPlugin('CopyPaste');

      selectCell(0, 0, 9, 4);

      plugin.setCopyableText();
      plugin.onCopy(copyEvent);

      /* eslint-disable no-tabs */
      expect(copyEvent.clipboardData.getData('text/plain')).toEqual(
        'A1	B1	"C1\n' +
        'line"	D1	E1\n' +
        'A2	B2	"C2\n' +
        'line\n' +
        'line"	D2	E2\n' +
        'A3	B3	C3	D3	E3\n' +
        'A4	B4	C4	D4	E4\n' +
        'A5	B5	C5	D5	E5\n' +
        'A6	B6	C6	D6	E6\n' +
        'A7	B7	C7	D7	E7\n' +
        'A8	B8	C8	D8	E8\n' +
        'A9	B9	C9	D9	E9\n' +
        'A10	B10	C10	D10	E10'
      );
    });

    it('should skip hidden rows, while copying data, when "copyPasteEnabled" property is set to false', () => {
      handsontable({
        data: getMultilineData(10, 5),
        hiddenRows: {
          rows: [0, 1, 4, 9],
          copyPasteEnabled: false
        },
        width: 500,
        height: 300
      });

      const copyEvent = getClipboardEventMock('copy');
      const plugin = getPlugin('CopyPaste');

      selectCell(0, 0, 9, 4);

      plugin.setCopyableText();
      plugin.onCopy(copyEvent);

      /* eslint-disable no-tabs */
      expect(copyEvent.clipboardData.getData('text/plain')).toEqual(
        'A3	B3	C3	D3	E3\n' +
        'A4	B4	C4	D4	E4\n' +
        'A6	B6	C6	D6	E6\n' +
        'A7	B7	C7	D7	E7\n' +
        'A8	B8	C8	D8	E8\n' +
        'A9	B9	C9	D9	E9'
      );
    });

    it('should not skip hidden rows, while pasting data, when "copyPasteEnabled" property is set to true', () => {
      handsontable({
        data: createSpreadsheetData(8, 3),
        hiddenRows: {
          rows: [2, 4],
          copyPasteEnabled: true
        },
        width: 500,
        height: 300
      });

      selectCell(0, 0);
      getPlugin('CopyPaste').paste('a\tb\nc\td\ne\tf\ng\th\ni\tj');

      expect(getData()).toEqual([
        ['a', 'b', 'C1'],
        ['c', 'd', 'C2'],
        ['e', 'f', 'C3'], // This row was hidden
        ['g', 'h', 'C4'],
        ['i', 'j', 'C5'], // This row was hidden
        ['A6', 'B6', 'C6'],
        ['A7', 'B7', 'C7'],
        ['A8', 'B8', 'C8'],
      ]);
      expect(`
        | A : 0 :   |
        | 0 : 0 :   |
        | 0 : 0 :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        `).toBeMatchToSelectionPattern();
    });

    it('should skip hidden rows, while pasting data, when "copyPasteEnabled" property is set to false', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(8, 3),
        hiddenRows: {
          rows: [2, 4],
          copyPasteEnabled: false
        },
        width: 500,
        height: 300
      });

      selectCell(0, 0);
      getPlugin('CopyPaste').paste('a\tb\nc\td\ne\tf\ng\th\ni\tj');

      expect(getData()).toEqual([
        ['a', 'b', 'C1'],
        ['c', 'd', 'C2'],
        ['A3', 'B3', 'C3'], // This row was hidden
        ['e', 'f', 'C4'],
        ['A5', 'B5', 'C5'], // This row was hidden
        ['g', 'h', 'C6'],
        ['i', 'j', 'C7'],
        ['A8', 'B8', 'C8'],
      ]);
      expect(`
        | A : 0 :   |
        | 0 : 0 :   |
        | 0 : 0 :   |
        | 0 : 0 :   |
        | 0 : 0 :   |
        |   :   :   |
        `).toBeMatchToSelectionPattern();
    });

    it('should paste data properly when populating data within a selection in specific case #6743', () => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        hiddenRows: {
          rows: [1],
          copyPasteEnabled: false,
        },
      });

      const copyEvent = getClipboardEvent();
      const plugin = getPlugin('CopyPaste');

      selectCell(0, 0, 0, 0);

      plugin.onCopy(copyEvent);

      selectCell(0, 0, 2, 0);

      plugin.onPaste(copyEvent);

      expect(getData()).toEqual([
        ['A1', 'B1', 'C1', 'D1', 'E1'],
        ['A2', 'B2', 'C2', 'D2', 'E2'],
        ['A1', 'B3', 'C3', 'D3', 'E3'],
        ['A4', 'B4', 'C4', 'D4', 'E4'],
        ['A5', 'B5', 'C5', 'D5', 'E5'],
      ]);

      expect(getSelected()).toEqual([[0, 0, 2, 0]]);
      expect(getSelectedRangeLast().highlight.row).toBe(0);
      expect(getSelectedRangeLast().highlight.col).toBe(0);
      expect(getSelectedRangeLast().from.row).toBe(0);
      expect(getSelectedRangeLast().from.col).toBe(0);
      expect(getSelectedRangeLast().to.row).toBe(2);
      expect(getSelectedRangeLast().to.col).toBe(0);
    });

    it('should keep same number of rows if all rows are hidden', () => {
      handsontable({
        data: createSpreadsheetData(2, 1),
        colHeaders: true,
        hiddenRows: {
          rows: [0, 1],
        },
      });

      const copyEvent = getClipboardEvent();
      const copyPastePlugin = getPlugin('copyPaste');

      selectColumns(0);
      listen(); // unlike selectCell behaviour, selectColumns will not call `listen` under the hood

      copyPastePlugin.onCopy(copyEvent);
      copyPastePlugin.onPaste(copyEvent);

      expect(getData()).toEqual([
        ['A1'],
        ['A2'],
      ]);
    });
  });
});
