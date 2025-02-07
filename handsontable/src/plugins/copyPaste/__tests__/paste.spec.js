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

  const arrayOfArrays = function() {
    return [
      ['', 'Kia', 'Nissan', 'Toyota', 'Honda'],
      ['2008', 10, 11, 12, 13],
      ['2009', 20, 11, 14, 13],
      ['2010', 30, 15, 12, 13]
    ];
  };

  describe('paste', () => {
    it('should not create new rows or columns when allowInsertRow and allowInsertColumn equal false', async() => {
      handsontable({
        data: arrayOfArrays(),
        copyPaste: {
          pasteMode: 'shift_down',
        },
        allowInsertRow: false,
        allowInsertColumn: false
      });

      selectCell(3, 4); // selectAll
      triggerPaste('Kia\tNissan\tToyota');

      await sleep(60);

      const expected = arrayOfArrays();

      expected[3][4] = 'Kia';
      expect(getData()).toEqual(expected);
    });

    it('should shift data down instead of overwrite when paste (when allowInsertRow = false)', async() => {
      handsontable({
        data: arrayOfArrays(),
        copyPaste: {
          pasteMode: 'shift_down',
        },
        allowInsertRow: false
      });

      selectCell(1, 0); // selectAll
      triggerPaste('Kia\tNissan\tToyota');

      await sleep(60);

      expect(getData().length).toEqual(4);
      expect(getData(0, 0, 2, 4)).toEqual([
        ['', 'Kia', 'Nissan', 'Toyota', 'Honda'],
        ['Kia', 'Nissan', 'Toyota', 12, 13],
        ['2008', 10, 11, 14, 13]
      ]);
    });

    it('should shift data down instead of overwrite when paste (minSpareRows > 0)', async() => {
      handsontable({
        data: arrayOfArrays(),
        copyPaste: {
          pasteMode: 'shift_down'
        },
        minSpareRows: 1
      });

      selectCell(1, 0); // selectAll
      triggerPaste('Kia\tNissan\tToyota');

      await sleep(60);

      expect(getData().length).toEqual(6);
      expect(getData(0, 0, 2, 4)).toEqual([
        ['', 'Kia', 'Nissan', 'Toyota', 'Honda'],
        ['Kia', 'Nissan', 'Toyota', 12, 13],
        ['2008', 10, 11, 14, 13]
      ]);
    });

    it('should shift right insert instead of overwrite when paste', async() => {
      handsontable({
        data: arrayOfArrays(),
        copyPaste: {
          pasteMode: 'shift_right'
        },
        allowInsertColumn: false
      });

      selectCell(1, 0); // selectAll
      triggerPaste('Kia\tNissan\tToyota');

      await sleep(60);

      expect(getData()[0].length).toEqual(5);
      expect(getDataAtRow(1)).toEqual(['Kia', 'Nissan', 'Toyota', '2008', 10]);
    });

    it('should shift right insert instead of overwrite when paste (minSpareCols > 0)', async() => {
      handsontable({
        data: arrayOfArrays(),
        copyPaste: {
          pasteMode: 'shift_right'
        },
        minSpareCols: 1
      });

      selectCell(1, 0); // selectAll
      triggerPaste('Kia\tNissan\tToyota');

      await sleep(60);
      expect(getData()[0].length).toEqual(9);
      expect(getDataAtRow(1)).toEqual(['Kia', 'Nissan', 'Toyota', '2008', 10, 11, 12, 13, null]);
    });

    it('should not throw an error when changes are null in `once` hook', async() => {
      let errors = 0;

      try {
        handsontable({
          data: arrayOfArrays(),
          afterChange(changes, source) {
            if (source === 'loadData') {
              return;
            }

            loadData(arrayOfArrays());
          }
        });

        selectCell(1, 0); // selectAll
        triggerPaste('Kia\tNissan\tToyota');

      } catch (e) {
        errors += 1;
      }

      await sleep(60);

      expect(errors).toEqual(0);
    });

    it('should not throw an error while pasting when headers are selected by corner click', () => {
      const hot = handsontable({
        data: arrayOfArrays(),
        rowHeaders: true,
        colHeaders: true,
      });

      selectAll();
      hot.listen();

      expect(() => {
        triggerPaste('Kia\tNissan\tToyota');
      }).not.toThrowError();
    });

    it('should not paste any data, if no cell is selected', async() => {
      const copiedData1 = 'foo';
      const copiedData2 = 'bar';

      handsontable({
        data: Handsontable.helper.createSpreadsheetData(3, 1)
      });

      expect(spec().$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('A1');
      expect(spec().$container.find('tbody tr:eq(1) td:eq(0)').text()).toEqual('A2');
      expect(spec().$container.find('tbody tr:eq(2) td:eq(0)').text()).toEqual('A3');
      expect(getSelected()).toBeUndefined();

      triggerPaste(copiedData1);

      await sleep(100);
      expect(spec().$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('A1');
      expect(spec().$container.find('tbody tr:eq(1) td:eq(0)').text()).toEqual('A2');
      expect(spec().$container.find('tbody tr:eq(2) td:eq(0)').text()).toEqual('A3');

      await sleep(100);
      selectCell(1, 0, 2, 0);
      triggerPaste(copiedData2);

      await sleep(100);
      expect(spec().$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('A1');
      expect(spec().$container.find('tbody tr:eq(1) td:eq(0)').text()).toEqual(copiedData2);
      expect(spec().$container.find('tbody tr:eq(2) td:eq(0)').text()).toEqual(copiedData2);
    });

    it('should not paste any data, if no cell is selected (select/deselect cell using mouse)', async() => {
      const copiedData = 'foo';

      handsontable({
        data: Handsontable.helper.createSpreadsheetData(3, 1)
      });

      expect(spec().$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('A1');
      expect(spec().$container.find('tbody tr:eq(1) td:eq(0)').text()).toEqual('A2');
      expect(spec().$container.find('tbody tr:eq(2) td:eq(0)').text()).toEqual('A3');

      spec().$container.find('tbody tr:eq(1) td:eq(0)').simulate('mousedown');
      spec().$container.find('tbody tr:eq(1) td:eq(0)').simulate('mouseup');

      expect(getSelected()).toEqual([[1, 0, 1, 0]]);

      $('html').simulate('mousedown').simulate('mouseup');

      expect(getSelected()).toBeUndefined();

      triggerPaste(copiedData);

      await sleep(100);

      expect(spec().$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('A1');
      expect(spec().$container.find('tbody tr:eq(1) td:eq(0)').text()).toEqual('A2');
      expect(spec().$container.find('tbody tr:eq(2) td:eq(0)').text()).toEqual('A3');
    });

    it('should call beforePaste and afterPaste during pasting operation', async() => {
      const beforePasteSpy = jasmine.createSpy('beforePaste');
      const afterPasteSpy = jasmine.createSpy('afterPaste');

      handsontable({
        data: Handsontable.helper.createSpreadsheetData(2, 2),
        beforePaste: beforePasteSpy,
        afterPaste: afterPasteSpy
      });

      selectCell(0, 0);
      keyDownUp(['control/meta', 'v']);
      triggerPaste('Kia');

      await sleep(60);

      expect(beforePasteSpy.calls.count()).toEqual(1);
      expect(beforePasteSpy).toHaveBeenCalledWith(
        [['Kia']], [{ startRow: 0, startCol: 0, endRow: 0, endCol: 0 }]);

      expect(afterPasteSpy.calls.count()).toEqual(1);
      expect(afterPasteSpy).toHaveBeenCalledWith(
        [['Kia']], [{ startRow: 0, startCol: 0, endRow: 0, endCol: 0 }]);
    });

    it('should be possible to block pasting', async() => {
      const afterPasteSpy = jasmine.createSpy('afterPaste');

      handsontable({
        data: Handsontable.helper.createSpreadsheetData(2, 2),
        beforePaste() {
          return false;
        },
        afterPaste: afterPasteSpy
      });

      selectCell(0, 0);
      keyDownUp(['control/meta', 'v']);
      triggerPaste('Kia');

      await sleep(60);

      expect(afterPasteSpy.calls.count()).toEqual(0);
    });

    it('should be possible modification of changes', async() => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(2, 2),
        beforePaste(changes) {
          changes.splice(0, 1);
        }
      });

      selectCell(0, 0);
      keyDownUp(['control/meta', 'v']);
      triggerPaste('Kia\nToyota');

      await sleep(60);

      expect(spec().$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('Toyota');
      expect(spec().$container.find('tbody tr:eq(1) td:eq(0)').text()).toEqual('A2');
    });

    it('should be possible to paste copied data from the same instance', async() => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 5),
      });

      expect(getDataAtCell(3, 1, 3, 1)).toEqual('B4');

      const copyEvent = getClipboardEvent();
      const plugin = getPlugin('CopyPaste');

      selectCell(0, 0, 1, 4);

      plugin.onCopy(copyEvent);

      selectCell(4, 1);

      plugin.onPaste(copyEvent);

      expect(getDataAtCell(4, 1)).toEqual('A1');
      expect(countCols()).toEqual(6);
      expect(countRows()).toEqual(6);
    });

    it('should properly paste empty cells', async() => {
      handsontable({
        data: [
          ['A', ''],
          ['B', ''],
          ['C', ''],
          ['D', ''],
        ],
      });

      const copyEvent = getClipboardEvent();
      const plugin = getPlugin('CopyPaste');

      selectCell(0, 1, 2, 1);

      plugin.onCopy(copyEvent);

      selectCell(2, 0);

      plugin.onPaste(copyEvent);

      expect(getDataAtCol(0)).toEqual(['A', 'B', '', '', '']);
    });

    it('should properly paste data with special chars', async() => {
      handsontable({
        data: [
          ['{""""}', ''],
          ['{""""}{""""}', ''],
          ['{""""}{""""}{""""}', ''],
        ],
      });

      const copyEvent = getClipboardEvent();
      const plugin = getPlugin('CopyPaste');

      selectCell(0, 0, 2, 0);

      plugin.onCopy(copyEvent);

      selectCell(0, 1);

      plugin.onPaste(copyEvent);

      expect(getDataAtCol(1)).toEqual(['{""""}', '{""""}{""""}', '{""""}{""""}{""""}']);
    });

    it('should properly parse newline in text/plain on Windows', () => {
      const afterChangeSpy = jasmine.createSpy('afterChange');

      handsontable({
        afterChange: afterChangeSpy,
      });

      selectCell(0, 0);

      triggerPaste('Kia\r\nNissan\r\nToyota');

      expect(afterChangeSpy).toHaveBeenCalledWith([
        [0, 0, null, 'Kia'],
        [1, 0, null, 'Nissan'],
        [2, 0, null, 'Toyota']
      ], 'CopyPaste.paste');
    });

    it('should properly paste data with multiline text', async() => {
      handsontable();

      const clipboardEvent = getClipboardEvent();
      const plugin = getPlugin('CopyPaste');

      clipboardEvent.clipboardData.setData('text/html', [
        '<table><tbody><tr><td>very<br>',
        'long<br>',
        '<br>',
        'text</td></tr></tbody></table>'
      ].join('\r\n'));

      selectCell(0, 0);

      plugin.onPaste(clipboardEvent);

      expect(getDataAtCell(0, 0)).toEqual('very\r\nlong\r\n\r\ntext');
    });

    it('should properly paste data with excel-style multiline text', async() => {
      handsontable();

      const clipboardEvent = getClipboardEvent();
      const plugin = getPlugin('CopyPaste');

      clipboardEvent.clipboardData.setData('text/html', [
        '<meta name=Generator content="Excel">',
        '<table><tbody><tr><td>Line\r\n',
        '  1<br>\r\n',
        '    Line 2<br>\r\n',
        '    <br>\r\n',
        '    Line 3<br>\r\n',
        '    Line 4<br>\r\n',
        '    <br>\r\n',
        '    <br>\r\n',
        '    Line 5</td></tr></tbody></table>',
      ].join(''));

      selectCell(0, 0);

      plugin.onPaste(clipboardEvent);

      expect(getDataAtCell(0, 0)).toEqual('Line 1\r\nLine 2\r\n\r\nLine 3\r\nLine 4\r\n\r\n\r\nLine 5');
    });

    it('should properly paste data with merged cells', async() => {
      handsontable();

      const clipboardEvent = getClipboardEvent();
      const plugin = getPlugin('CopyPaste');

      clipboardEvent.clipboardData.setData('text/html', [
        '<table><tbody><tr><td colspan="2" rowspan="2">A1</td><td>C1</td></tr><tr><td>C2</td></tr></tbody></table>'
      ].join('\r\n'));

      selectCell(0, 0);

      plugin.onPaste(clipboardEvent);

      expect(getDataAtCell(0, 0)).toEqual('A1');
      expect(getDataAtCell(0, 1)).toEqual(null);
      expect(getDataAtCell(0, 2)).toEqual('C1');
      expect(getDataAtCell(1, 0)).toEqual(null);
      expect(getDataAtCell(1, 1)).toEqual(null);
      expect(getDataAtCell(1, 2)).toEqual('C2');
    });

    it('should properly paste data with overlapped cells', async() => {
      handsontable();

      const clipboardEvent = getClipboardEvent();
      const plugin = getPlugin('CopyPaste');

      clipboardEvent.clipboardData.setData('text/html', [
        '<table><tbody><tr><td colspan="2" rowspan="2">A1</td><td>C1</td></tr><tr><td>C2</td></tr></tbody></table>'
      ].join('\r\n'));

      selectCell(0, 0);

      plugin.onPaste(clipboardEvent);

      expect(getDataAtCell(0, 0)).toEqual('A1');
      expect(getDataAtCell(0, 1)).toEqual(null);
      expect(getDataAtCell(0, 2)).toEqual('C1');
      expect(getDataAtCell(1, 0)).toEqual(null);
      expect(getDataAtCell(1, 1)).toEqual(null);
      expect(getDataAtCell(1, 2)).toEqual('C2');
    });

    it('should populate data just within selection - there was bug #5961', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10),
        rowHeaders: true,
        colHeaders: true,
        hiddenRows: {
          copyPasteEnabled: false,
          rows: [1, 2]
        },
        hiddenColumns: {
          copyPasteEnabled: false,
          columns: [4, 5]
        },
      });

      const copyEvent = getClipboardEvent();
      const plugin = getPlugin('CopyPaste');

      selectCell(0, 0, 9, 0);

      plugin.onCopy(copyEvent);

      selectColumns(1, 9);

      plugin.onPaste(copyEvent);

      expect(getData()).toEqual([
        ['A1', 'A1', 'A1', 'A1', 'E1', 'F1', 'A1', 'A1', 'A1', 'A1'],
        ['A2', 'B2', 'C2', 'D2', 'E2', 'F2', 'G2', 'H2', 'I2', 'J2'],
        ['A3', 'B3', 'C3', 'D3', 'E3', 'F3', 'G3', 'H3', 'I3', 'J3'],
        ['A4', 'A4', 'A4', 'A4', 'E4', 'F4', 'A4', 'A4', 'A4', 'A4'],
        ['A5', 'A5', 'A5', 'A5', 'E5', 'F5', 'A5', 'A5', 'A5', 'A5'],
        ['A6', 'A6', 'A6', 'A6', 'E6', 'F6', 'A6', 'A6', 'A6', 'A6'],
        ['A7', 'A7', 'A7', 'A7', 'E7', 'F7', 'A7', 'A7', 'A7', 'A7'],
        ['A8', 'A8', 'A8', 'A8', 'E8', 'F8', 'A8', 'A8', 'A8', 'A8'],
        ['A9', 'A9', 'A9', 'A9', 'E9', 'F9', 'A9', 'A9', 'A9', 'A9'],
        ['A10', 'A10', 'A10', 'A10', 'E10', 'F10', 'A10', 'A10', 'A10', 'A10'],
      ]);

      expect(getSelected()).toEqual([[0, 1, 9, 9]]);
      expect(getSelectedRangeLast().highlight.row).toBe(0);
      expect(getSelectedRangeLast().highlight.col).toBe(1);
      expect(getSelectedRangeLast().from.row).toBe(0);
      expect(getSelectedRangeLast().from.col).toBe(1);
      expect(getSelectedRangeLast().to.row).toBe(9);
      expect(getSelectedRangeLast().to.col).toBe(9);
    });

    it.forTheme('classic')('should paste data without scrolling the viewport', async() => {
      handsontable({
        data: createSpreadsheetData(50, 50),
        width: 200,
        height: 200,
      });

      selectCell(6, 2);
      triggerPaste([
        'test\ttest\ttest\ttest\ttest\ttest',
        'test\ttest\ttest\ttest\ttest\ttest',
        'test\ttest\ttest\ttest\ttest\ttest',
        'test\ttest\ttest\ttest\ttest\ttest',
        'test\ttest\ttest\ttest\ttest\ttest',
        'test\ttest\ttest\ttest\ttest\ttest',
      ].join('\n'));

      expect(topOverlay().getScrollPosition()).toBe(0);
      expect(inlineStartOverlay().getScrollPosition()).toBe(0);
    });

    it.forTheme('main')('should paste data without scrolling the viewport', async() => {
      handsontable({
        data: createSpreadsheetData(50, 50),
        width: 200,
        height: 250,
      });

      selectCell(6, 2);
      triggerPaste([
        'test\ttest\ttest\ttest\ttest\ttest',
        'test\ttest\ttest\ttest\ttest\ttest',
        'test\ttest\ttest\ttest\ttest\ttest',
        'test\ttest\ttest\ttest\ttest\ttest',
        'test\ttest\ttest\ttest\ttest\ttest',
        'test\ttest\ttest\ttest\ttest\ttest',
      ].join('\n'));

      expect(topOverlay().getScrollPosition()).toBe(0);
      expect(inlineStartOverlay().getScrollPosition()).toBe(0);
    });

    it('should sanitize pasted HTML', async() => {
      handsontable();

      const onErrorSpy = spyOn(window, 'onerror');
      const clipboardEvent = getClipboardEvent();
      const plugin = getPlugin('CopyPaste');

      clipboardEvent.clipboardData.setData('text/html', [
        '<table><tr></tr></table><img src onerror="boom()">'
      ].join('\r\n'));

      selectCell(0, 0);

      plugin.onPaste(clipboardEvent);

      await sleep(100);

      expect(onErrorSpy).not.toHaveBeenCalled();
      expect(getDataAtCell(0, 0)).toEqual(null);
    });

    it('should be possible to paste text into the outside element of the table when the `outsideClickDeselects` is disabled', () => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        outsideClickDeselects: false,
      });

      const testElement = $('<div id="testElement">Test</div>');

      spec().$container.after(testElement);

      const pasteEvent = getClipboardEvent();
      const plugin = getPlugin('CopyPaste');

      selectCell(1, 1);
      pasteEvent.target = testElement[0]; // native paste event is triggered on the element outside the table
      plugin.onPaste(pasteEvent); // trigger the plugin's method that is normally triggered by the native "paste" event

      // the data in HoT should not be changed as the paste was triggered on the outside element
      expect(getDataAtCell(1, 1)).toBe('B2');

      testElement.remove();
    });

    it('should skip processing the event when the target element has the "data-hot-input" attribute and it\'s not an editor', () => {
      handsontable({
        data: createSpreadsheetData(5, 5),
      });

      const copyEvent = getClipboardEvent();
      const plugin = getPlugin('CopyPaste');

      spyOn(copyEvent, 'preventDefault');

      selectCell(1, 1);
      copyEvent.target = $('<div id="testElement" data-hot-input="true">Test</div>')[0];
      plugin.onPaste(copyEvent); // trigger the plugin's method that is normally triggered by the native "paste" event

      expect(copyEvent.preventDefault).not.toHaveBeenCalled();
    });

    it('should not skip processing the event when the target element has the "data-hot-input" attribute and it\'s an editor', () => {
      handsontable({
        data: createSpreadsheetData(5, 5),
      });

      const copyEvent = getClipboardEvent();
      const plugin = getPlugin('CopyPaste');

      spyOn(copyEvent, 'preventDefault');

      selectCell(1, 1);
      copyEvent.target = getActiveEditor().TEXTAREA;
      plugin.onPaste(copyEvent); // trigger the plugin's method that is normally triggered by the native "paste" event

      expect(copyEvent.preventDefault).toHaveBeenCalled();
    });

    it('should skip processing the event when the target element has not the "data-hot-input" attribute and it\'s not a BODY element', () => {
      handsontable({
        data: createSpreadsheetData(5, 5),
      });

      const copyEvent = getClipboardEvent();
      const plugin = getPlugin('CopyPaste');

      spyOn(copyEvent, 'preventDefault');

      selectCell(1, 1);
      copyEvent.target = $('<div id="testElement">Test</div>')[0];
      plugin.onPaste(copyEvent); // trigger the plugin's method that is normally triggered by the native "paste" event

      expect(copyEvent.preventDefault).not.toHaveBeenCalled();
    });

    it('should not skip processing the event when the target element has not the "data-hot-input" attribute and it\'s a BODY element', () => {
      handsontable({
        data: createSpreadsheetData(5, 5),
      });

      const copyEvent = getClipboardEvent();
      const plugin = getPlugin('CopyPaste');

      spyOn(copyEvent, 'preventDefault');

      selectCell(1, 1);
      copyEvent.target = document.body;
      plugin.onPaste(copyEvent); // trigger the plugin's method that is normally triggered by the native "paste" event

      expect(copyEvent.preventDefault).toHaveBeenCalled();
    });

    it('should not skip processing the event when the target element has not the "data-hot-input" attribute and it\'s a TD element (#dev-2225)', () => {
      handsontable({
        data: createSpreadsheetData(5, 5),
      });

      const copyEvent = getClipboardEvent();
      const plugin = getPlugin('CopyPaste');

      spyOn(copyEvent, 'preventDefault');

      selectCell(1, 1);
      copyEvent.target = getCell(1, 1);
      plugin.onPaste(copyEvent); // trigger the plugin's method that is normally triggered by the native "paste" event

      expect(copyEvent.preventDefault).toHaveBeenCalled();
    });
  });
});
