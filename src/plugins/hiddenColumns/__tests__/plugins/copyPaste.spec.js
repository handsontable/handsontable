describe('hiddenColumns', () => {
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
        hiddenColumns: {
          columns: [2, 4]
        }
      });

      const copyEvent = getClipboardEventMock('copy');
      const plugin = hot.getPlugin('CopyPaste');

      selectCell(0, 4);

      plugin.setCopyableText();
      plugin.onCopy(copyEvent);

      expect(copyEvent.clipboardData.getData('text/plain')).toEqual('E1');
    });

    it('should allow to copy hidden columns, when "copyPasteEnabled" property is not set', () => {
      const hot = handsontable({
        data: getMultilineData(5, 10),
        hiddenColumns: {
          columns: [2, 4]
        },
        width: 500,
        height: 300,
      });

      const copyEvent = getClipboardEventMock('copy');
      const plugin = hot.getPlugin('CopyPaste');

      selectCell(0, 0, 4, 9);

      plugin.setCopyableText();
      plugin.onCopy(copyEvent);

      /* eslint-disable no-tabs */
      expect(copyEvent.clipboardData.getData('text/plain')).toEqual(
        'A1	B1	"C1\n' +
        'line"	D1	E1	F1	G1	H1	I1	J1\n' +
        'A2	B2	"C2\n' +
        'line\n' +
        'line"	D2	E2	F2	G2	H2	I2	J2\n' +
        'A3	B3	C3	D3	E3	F3	G3	H3	I3	J3\n' +
        'A4	B4	C4	D4	E4	F4	G4	H4	I4	J4\n' +
        'A5	B5	C5	D5	E5	F5	G5	H5	I5	J5'
      );
    });

    it('should allow to copy hidden columns, when "copyPasteEnabled" property is set to true', () => {
      const hot = handsontable({
        data: getMultilineData(5, 10),
        hiddenColumns: {
          columns: [2, 4],
          copyPasteEnabled: true
        },
        width: 500,
        height: 300
      });

      const copyEvent = getClipboardEventMock('copy');
      const plugin = hot.getPlugin('CopyPaste');

      selectCell(0, 0, 4, 9);

      plugin.setCopyableText();
      plugin.onCopy(copyEvent);

      /* eslint-disable no-tabs */
      expect(copyEvent.clipboardData.getData('text/plain')).toEqual(
        'A1	B1	"C1\n' +
        'line"	D1	E1	F1	G1	H1	I1	J1\n' +
        'A2	B2	"C2\n' +
        'line\n' +
        'line"	D2	E2	F2	G2	H2	I2	J2\n' +
        'A3	B3	C3	D3	E3	F3	G3	H3	I3	J3\n' +
        'A4	B4	C4	D4	E4	F4	G4	H4	I4	J4\n' +
        'A5	B5	C5	D5	E5	F5	G5	H5	I5	J5'
      );
    });

    it('should skip hidden columns, while copying data, when "copyPasteEnabled" property is set to false', () => {
      handsontable({
        data: getMultilineData(5, 10),
        hiddenColumns: {
          columns: [2, 4],
          copyPasteEnabled: false
        },
        width: 500,
        height: 300
      });

      const copyEvent = getClipboardEventMock('copy');
      const plugin = getPlugin('CopyPaste');

      selectCell(0, 0, 4, 9);

      plugin.setCopyableText();
      plugin.onCopy(copyEvent);

      /* eslint-disable no-tabs */
      expect(copyEvent.clipboardData.getData('text/plain')).toEqual(
        'A1	B1	D1	F1	G1	H1	I1	J1\n' +
        'A2	B2	D2	F2	G2	H2	I2	J2\n' +
        'A3	B3	D3	F3	G3	H3	I3	J3\n' +
        'A4	B4	D4	F4	G4	H4	I4	J4\n' +
        'A5	B5	D5	F5	G5	H5	I5	J5'
      );
    });

    it('should not skip hidden columns, while pasting data, when "copyPasteEnabled" property is set to true', () => {
      handsontable({
        data: createSpreadsheetData(3, 8),
        hiddenColumns: {
          columns: [2, 4],
          copyPasteEnabled: true
        },
        width: 500,
        height: 300
      });

      selectCell(0, 0);
      getPlugin('CopyPaste').paste('a\tb\tc\td\te\nf\tg\th\ti\tj');

      expect(getData()).toEqual([
        //          ↓        ↓   Hidden columns
        ['a', 'b', 'c', 'd', 'e', 'F1', 'G1', 'H1'],
        ['f', 'g', 'h', 'i', 'j', 'F2', 'G2', 'H2'],
        ['A3', 'B3', 'C3', 'D3', 'E3', 'F3', 'G3', 'H3'],
      ]);
      expect(`
        | A : 0 : 0 :   :   :   |
        | 0 : 0 : 0 :   :   :   |
        |   :   :   :   :   :   |
        `).toBeMatchToSelectionPattern();
    });

    it('should skip hidden columns, while pasting data, when "copyPasteEnabled" property is set to false', () => {
      handsontable({
        data: createSpreadsheetData(3, 8),
        hiddenColumns: {
          columns: [2, 4],
          copyPasteEnabled: false
        },
        width: 500,
        height: 300
      });

      selectCell(0, 0);
      getPlugin('CopyPaste').paste('a\tb\tc\td\te\nf\tg\th\ti\tj');

      expect(getData()).toEqual([
        //          ↓         ↓   Hidden columns
        ['a', 'b', 'C1', 'c', 'E1', 'd', 'e', 'H1'],
        ['f', 'g', 'C2', 'h', 'E2', 'i', 'j', 'H2'],
        ['A3', 'B3', 'C3', 'D3', 'E3', 'F3', 'G3', 'H3'],
      ]);
      expect(`
        | A : 0 : 0 : 0 : 0 :   |
        | 0 : 0 : 0 : 0 : 0 :   |
        |   :   :   :   :   :   |
        `).toBeMatchToSelectionPattern();
    });

    it('should paste data properly when populating data within a selection in specific case #6743', () => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        hiddenColumns: {
          columns: [1],
          copyPasteEnabled: false,
        },
      });

      const copyEvent = getClipboardEvent();
      const plugin = getPlugin('CopyPaste');

      selectCell(0, 0, 0, 0);

      plugin.onCopy(copyEvent);

      selectCell(0, 0, 0, 2);

      plugin.onPaste(copyEvent);

      expect(getData()).toEqual([
        ['A1', 'B1', 'A1', 'D1', 'E1'],
        ['A2', 'B2', 'C2', 'D2', 'E2'],
        ['A3', 'B3', 'C3', 'D3', 'E3'],
        ['A4', 'B4', 'C4', 'D4', 'E4'],
        ['A5', 'B5', 'C5', 'D5', 'E5'],
      ]);

      expect(getSelected()).toEqual([[0, 0, 0, 2]]);
      expect(getSelectedRangeLast().highlight.row).toBe(0);
      expect(getSelectedRangeLast().highlight.col).toBe(0);
      expect(getSelectedRangeLast().from.row).toBe(0);
      expect(getSelectedRangeLast().from.col).toBe(0);
      expect(getSelectedRangeLast().to.row).toBe(0);
      expect(getSelectedRangeLast().to.col).toBe(2);
    });

    it('should keep the same number of columns if all columns are hidden', () => {
      handsontable({
        data: createSpreadsheetData(1, 2),
        colHeaders: true,
        hiddenColumns: {
          columns: [0, 1],
        },
      });

      const copyEvent = getClipboardEvent();
      const copyPastePlugin = getPlugin('copyPaste');

      selectRows(0);
      listen(); // unlike selectCell behaviour, selectRows will not call `listen` under the hood

      copyPastePlugin.onCopy(copyEvent);
      copyPastePlugin.onPaste(copyEvent);

      expect(getData()).toEqual([
        ['A1', 'B1'],
      ]);
    });
  });
});
