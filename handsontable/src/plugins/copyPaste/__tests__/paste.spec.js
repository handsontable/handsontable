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
    it('should paste the data by default to the last selection layer', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
        copyPaste: true,
        navigableHeaders: true,
      });

      await selectCells([
        [0, 0, 2, 2],
        [2, 1, 2, 3],
        [1, 4, 3, 4],
      ]);

      triggerPaste('Kia\nNissan\nToyota');

      expect(getData()).toEqual([
        ['A1', 'B1', 'C1', 'D1', 'E1'],
        ['A2', 'B2', 'C2', 'D2', 'Kia'],
        ['A3', 'B3', 'C3', 'D3', 'Nissan'],
        ['A4', 'B4', 'C4', 'D4', 'Toyota'],
        ['A5', 'B5', 'C5', 'D5', 'E5'],
      ]);
    });

    it('should paste the data to the active selection layer', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
        copyPaste: true,
        navigableHeaders: true,
      });

      await selectCells([
        [0, 0, 2, 2],
        [2, 1, 2, 3],
        [1, 4, 3, 4],
      ]);

      await keyDownUp(['shift', 'tab']);
      await keyDownUp(['shift', 'tab']); // select C3 of the second layer

      triggerPaste('Kia\nNissan\nToyota');

      expect(getData()).toEqual([
        ['A1', 'B1', 'C1', 'D1', 'E1'],
        ['A2', 'B2', 'C2', 'D2', 'E2'],
        ['A3', 'Kia', 'Kia', 'Kia', 'E3'],
        ['A4', 'Nissan', 'Nissan', 'Nissan', 'E4'],
        ['A5', 'Toyota', 'Toyota', 'Toyota', 'E5'],
      ]);
    });

    it('should not create new rows or columns when allowInsertRow and allowInsertColumn equal false', async() => {
      handsontable({
        data: arrayOfArrays(),
        copyPaste: {
          pasteMode: 'shift_down',
        },
        allowInsertRow: false,
        allowInsertColumn: false
      });

      await selectCell(3, 4); // selectAll
      triggerPaste('Kia\tNissan\tToyota');

      await waitForNextAnimationFrames(2);

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

      await selectCell(1, 0); // selectAll
      triggerPaste('Kia\tNissan\tToyota');

      await waitForNextAnimationFrames(2);

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

      await selectCell(1, 0); // selectAll
      triggerPaste('Kia\tNissan\tToyota');

      await waitForNextAnimationFrames(2);

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

      await selectCell(1, 0); // selectAll
      triggerPaste('Kia\tNissan\tToyota');

      await waitForNextAnimationFrames(2);

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

      await selectCell(1, 0); // selectAll
      triggerPaste('Kia\tNissan\tToyota');

      await waitForNextAnimationFrames(2);
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

            // eslint-disable-next-line handsontable/require-await
            loadData(arrayOfArrays());
          }
        });

        await selectCell(1, 0); // selectAll
        triggerPaste('Kia\tNissan\tToyota');

      } catch (e) {
        errors += 1;
      }

      await waitForNextAnimationFrames(2);

      expect(errors).toEqual(0);
    });

    it('should not throw an error while pasting when headers are selected by corner click', async() => {
      handsontable({
        data: arrayOfArrays(),
        rowHeaders: true,
        colHeaders: true,
      });

      await listen();

      await selectAll();

      expect(() => {
        triggerPaste('Kia\tNissan\tToyota');
      }).not.toThrowWithCause(undefined, { handsontable: true });
    });

    it('should not paste any data, if no cell is selected', async() => {
      const copiedData1 = 'foo';
      const copiedData2 = 'bar';

      handsontable({
        data: createSpreadsheetData(3, 1)
      });

      expect(spec().$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('A1');
      expect(spec().$container.find('tbody tr:eq(1) td:eq(0)').text()).toEqual('A2');
      expect(spec().$container.find('tbody tr:eq(2) td:eq(0)').text()).toEqual('A3');
      expect(getSelected()).toBeUndefined();

      triggerPaste(copiedData1);

      await waitForNextAnimationFrames(2);
      expect(spec().$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('A1');
      expect(spec().$container.find('tbody tr:eq(1) td:eq(0)').text()).toEqual('A2');
      expect(spec().$container.find('tbody tr:eq(2) td:eq(0)').text()).toEqual('A3');

      await waitForNextAnimationFrames(2);
      await selectCell(1, 0, 2, 0);
      triggerPaste(copiedData2);

      await waitForNextAnimationFrames(2);
      expect(spec().$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('A1');
      expect(spec().$container.find('tbody tr:eq(1) td:eq(0)').text()).toEqual(copiedData2);
      expect(spec().$container.find('tbody tr:eq(2) td:eq(0)').text()).toEqual(copiedData2);
    });

    it('should not paste any data, if no cell is selected (select/deselect cell using mouse)', async() => {
      const copiedData = 'foo';

      handsontable({
        data: createSpreadsheetData(3, 1)
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

      await waitForNextAnimationFrames(2);

      expect(spec().$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('A1');
      expect(spec().$container.find('tbody tr:eq(1) td:eq(0)').text()).toEqual('A2');
      expect(spec().$container.find('tbody tr:eq(2) td:eq(0)').text()).toEqual('A3');
    });

    it('should call beforePaste and afterPaste during pasting operation', async() => {
      const beforePasteSpy = jasmine.createSpy('beforePaste');
      const afterPasteSpy = jasmine.createSpy('afterPaste');

      handsontable({
        data: createSpreadsheetData(2, 2),
        beforePaste: beforePasteSpy,
        afterPaste: afterPasteSpy
      });

      await selectCell(0, 0);
      await keyDownUp(['control/meta', 'v']);
      triggerPaste('Kia');

      await waitForNextAnimationFrames(2);

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
        data: createSpreadsheetData(2, 2),
        beforePaste() {
          return false;
        },
        afterPaste: afterPasteSpy
      });

      await selectCell(0, 0);
      await keyDownUp(['control/meta', 'v']);
      triggerPaste('Kia');

      await waitForNextAnimationFrames(2);

      expect(afterPasteSpy.calls.count()).toEqual(0);
    });

    it('should be possible modification of changes', async() => {
      handsontable({
        data: createSpreadsheetData(2, 2),
        beforePaste(changes) {
          changes.splice(0, 1);
        }
      });

      await selectCell(0, 0);
      await keyDownUp(['control/meta', 'v']);
      triggerPaste('Kia\nToyota');

      await waitForNextAnimationFrames(2);

      expect(spec().$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('Toyota');
      expect(spec().$container.find('tbody tr:eq(1) td:eq(0)').text()).toEqual('A2');
    });

    it('should be possible to paste copied data from the same instance', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
      });

      expect(getDataAtCell(3, 1, 3, 1)).toEqual('B4');

      const copyEvent = getClipboardEvent();
      const plugin = getPlugin('CopyPaste');

      await selectCell(0, 0, 1, 4);

      plugin.onCopy(copyEvent);

      await selectCell(4, 1);

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

      await selectCell(0, 1, 2, 1);

      plugin.onCopy(copyEvent);

      await selectCell(2, 0);

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

      await selectCell(0, 0, 2, 0);

      plugin.onCopy(copyEvent);

      await selectCell(0, 1);

      plugin.onPaste(copyEvent);

      expect(getDataAtCol(1)).toEqual(['{""""}', '{""""}{""""}', '{""""}{""""}{""""}']);
    });

    it('should properly parse newline in text/plain on Windows', async() => {
      const afterChangeSpy = jasmine.createSpy('afterChange');

      handsontable({
        afterChange: afterChangeSpy,
      });

      await selectCell(0, 0);

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

      await selectCell(0, 0);

      plugin.onPaste(clipboardEvent);

      expect(getDataAtCell(0, 0)).toEqual('very\r\nlong\r\n\r\ntext');
    });

    it('should keep a single quoted cell with bare mid-cell quote chars on one row (issue #11001)', async() => {
      handsontable({
        data: createSpreadsheetData(5, 2),
      });

      await selectCell(0, 0);

      // Apple Numbers wraps a multi-line cell with `"..."` and writes bare ASCII `"` chars
      // (not `""`-escaped) inside the content. Internal `\n` characters must not split the
      // cell into multiple rows, and bare `"` chars must be preserved.
      triggerPaste('"Test: Some stage\nClick "check balance" on 42” tile.\nNote: text."');

      expect(getDataAtCell(0, 0)).toBe('Test: Some stage\nClick "check balance" on 42” tile.\nNote: text.');
      expect(getDataAtCell(1, 0)).toBe('A2');
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

      await selectCell(0, 0);

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

      await selectCell(0, 0);

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

      await selectCell(0, 0);

      plugin.onPaste(clipboardEvent);

      expect(getDataAtCell(0, 0)).toEqual('A1');
      expect(getDataAtCell(0, 1)).toEqual(null);
      expect(getDataAtCell(0, 2)).toEqual('C1');
      expect(getDataAtCell(1, 0)).toEqual(null);
      expect(getDataAtCell(1, 1)).toEqual(null);
      expect(getDataAtCell(1, 2)).toEqual('C2');
    });

    it('should preserve all cells when pasting Excel range with shape (nested td in cell)', async() => {
      handsontable({
        data: createSpreadsheetData(1, 5),
      });

      const clipboardEvent = getClipboardEvent();
      const plugin = getPlugin('CopyPaste');
      const excelLikeHTMLWithShape = [
        '<meta name="Generator" content="Microsoft Excel 15">',
        '<table><tr>',
        '<td>text</td>',
        '<td width=116><!--[if gte vml 1]><v:shape></v:shape><![endif]-->',
        '<span><table><tr><td></td></tr></table></span></td>',
        '<td>text2</td>',
        '<td width=124><!--[if gte vml 1]><v:shape></v:shape><![endif]-->',
        '<span><table><tr><td></td></tr></table></span></td>',
        '<td>test</td>',
        '</tr></table>'
      ].join('');

      clipboardEvent.clipboardData.setData('text/html', excelLikeHTMLWithShape);

      await selectCell(0, 0);

      plugin.onPaste(clipboardEvent);

      expect(getDataAtCell(0, 0)).toEqual('text');
      expect(getDataAtCell(0, 1)).toEqual('');
      expect(getDataAtCell(0, 2)).toEqual('text2');
      expect(getDataAtCell(0, 3)).toEqual('');
      expect(getDataAtCell(0, 4)).toEqual('test');
    });

    it('should populate data just within selection - there was bug #5961', async() => {
      handsontable({
        data: createSpreadsheetData(10, 10),
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

      await selectCell(0, 0, 9, 0);

      plugin.onCopy(copyEvent);

      await selectColumns(1, 9);

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
      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,1 from: 0,1 to: 9,9']);
    });

    it('should paste data without scrolling the viewport', async() => {
      // Size the container so row 6 fits inside the viewport regardless of theme row height;
      // otherwise `selectCell(6, 2)` below would auto-scroll and defeat the purpose of the test.
      handsontable({
        data: createSpreadsheetData(50, 50),
        width: 200,
        height: containerHeightForRows(7),
      });

      await selectCell(6, 2);
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

    // TODO: To be changed in 18.0
    it('should sanitize pasted HTML by default', async() => {
      handsontable();

      window.__testFunction = () => {};

      const onErrorSpy = spyOn(window, 'onerror');
      const clipboardEvent = getClipboardEvent();
      const plugin = getPlugin('CopyPaste');

      spyOn(window, '__testFunction');

      clipboardEvent.clipboardData.setData('text/html', [
        '<table><tr></tr></table><img src onerror="__testFunction()">'
      ].join('\r\n'));

      await selectCell(0, 0);

      plugin.onPaste(clipboardEvent);

      await waitForNextAnimationFrames(2);

      expect(onErrorSpy).not.toHaveBeenCalled();
      expect(window.__testFunction).not.toHaveBeenCalled();
      expect(getDataAtCell(0, 0)).toEqual(null);

      delete window.__testFunction;
    });

    it('should sanitize pasted HTML when custom sanitizer is set', async() => {
      handsontable({
        sanitizer: (content) => {
          return content.replace(/\s+onerror\s*=\s*("[^"]*"|'[^']*'|[^\s>]*)/gi, '');
        },
      });

      window.__testFunction = () => {};

      const onErrorSpy = spyOn(window, 'onerror');
      const clipboardEvent = getClipboardEvent();
      const plugin = getPlugin('CopyPaste');

      spyOn(window, '__testFunction');

      clipboardEvent.clipboardData.setData('text/html', [
        '<table><tr></tr></table><img src onerror="__testFunction()">'
      ].join('\r\n'));

      await selectCell(0, 0);

      plugin.onPaste(clipboardEvent);

      await waitForNextAnimationFrames(2);

      expect(onErrorSpy).not.toHaveBeenCalled();
      expect(window.__testFunction).not.toHaveBeenCalled();
      expect(getDataAtCell(0, 0)).toEqual(null);

      delete window.__testFunction;
    });

    it('should be possible to paste text into the outside element of the table when the `outsideClickDeselects` is disabled', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        outsideClickDeselects: false,
      });

      const testElement = $('<div id="testElement">Test</div>');

      spec().$container.after(testElement);

      const pasteEvent = getClipboardEvent({
        target: testElement[0],
      });
      const plugin = getPlugin('CopyPaste');

      await selectCell(1, 1);

      pasteEvent.target = testElement[0]; // native paste event is triggered on the element outside the table
      plugin.onPaste(pasteEvent); // trigger the plugin's method that is normally triggered by the native "paste" event

      // the data in HoT should not be changed as the paste was triggered on the outside element
      expect(getDataAtCell(1, 1)).toBe('B2');

      testElement.remove();
    });

    it('should skip processing the event when the target element has the "data-hot-input" attribute and it\'s not an editor', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
      });

      const copyEvent = getClipboardEvent({
        target: $('<div id="testElement" data-hot-input="true">Test</div>')[0],
      });
      const plugin = getPlugin('CopyPaste');

      spyOn(copyEvent, 'preventDefault');

      await selectCell(1, 1);

      copyEvent.target = $('<div id="testElement" data-hot-input="true">Test</div>')[0];
      plugin.onPaste(copyEvent); // trigger the plugin's method that is normally triggered by the native "paste" event

      expect(copyEvent.preventDefault).not.toHaveBeenCalled();
    });

    it('should not skip processing the event when the target element has the "data-hot-input" attribute and it\'s an editor', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
      });

      const plugin = getPlugin('CopyPaste');

      await selectCell(1, 1);

      const copyEvent = getClipboardEvent({
        target: getActiveEditor().TEXTAREA,
      });

      spyOn(copyEvent, 'preventDefault');

      copyEvent.target = getActiveEditor().TEXTAREA;
      plugin.onPaste(copyEvent); // trigger the plugin's method that is normally triggered by the native "paste" event

      expect(copyEvent.preventDefault).toHaveBeenCalled();
    });

    it('should skip processing the event when the target element does not have the "data-hot-input" attribute and it\'s not a BODY element', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
      });

      const copyEvent = getClipboardEvent({
        target: $('<div id="testElement">Test</div>')[0],
      });
      const plugin = getPlugin('CopyPaste');

      spyOn(copyEvent, 'preventDefault');

      await selectCell(1, 1);

      copyEvent.target = $('<div id="testElement">Test</div>')[0];
      plugin.onPaste(copyEvent); // trigger the plugin's method that is normally triggered by the native "paste" event

      expect(copyEvent.preventDefault).not.toHaveBeenCalled();
    });

    it('should not skip processing the event when the target element does not have the "data-hot-input" attribute and it\'s a BODY element', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
      });

      const copyEvent = getClipboardEvent({
        target: document.body,
      });
      const plugin = getPlugin('CopyPaste');

      spyOn(copyEvent, 'preventDefault');

      await selectCell(1, 1);

      copyEvent.target = document.body;
      plugin.onPaste(copyEvent); // trigger the plugin's method that is normally triggered by the native "paste" event

      expect(copyEvent.preventDefault).toHaveBeenCalled();
    });

    it('should not skip processing the event when the target element does not have the "data-hot-input" attribute and it\'s a TD element (#dev-2225)', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
      });

      const copyEvent = getClipboardEvent({
        target: getCell(1, 1),
      });
      const plugin = getPlugin('CopyPaste');

      spyOn(copyEvent, 'preventDefault');

      await selectCell(1, 1);

      copyEvent.target = getCell(1, 1);
      plugin.onPaste(copyEvent); // trigger the plugin's method that is normally triggered by the native "paste" event

      expect(copyEvent.preventDefault).toHaveBeenCalled();
    });

    it('should be possible to paste data having selected a range that reaches outside of the rendered viewport (#dev-2298)', async() => {
      handsontable({
        data: createSpreadsheetData(1, 50),
        width: 100,
        height: 50,
      });

      const plugin = getPlugin('CopyPaste');

      await selectCells([[0, 0, 0, 49]]);
      await waitForNextAnimationFrames(1);

      const pasteEvent = getClipboardEvent({
        target: document.activeElement,
      });

      spyOn(pasteEvent, 'preventDefault');

      plugin.onPaste(pasteEvent); // emulate native "paste" event

      expect(pasteEvent.preventDefault).toHaveBeenCalled();
    });

    it('should paste the object-based cells as their displayed value, when the target cell is not object-based', async() => {
      handsontable({
        data: [
          [{ id: 1, value: 'A1' }, 'test'],
          [{ id: 2, value: 'A2' }, 'test2'],
        ],
        columns: [
          {
            valueGetter: value => value?.value,
          },
          {},
        ],
      });

      const plugin = getPlugin('CopyPaste');
      const event = getClipboardEvent();

      await selectCell(0, 0);
      plugin.onCopy(event);

      await selectCell(1, 1);
      plugin.onPaste(event);

      expect(getDataAtCell(1, 1)).toEqual('A1');
    });

    it('should not paste the object-based cells, when the target cell is object-based, but it\'s data schema doesn\'t match the pasted content', async() => {
      handsontable({
        data: [
          [{ id: 1, value: 'A1' }, { sth: 0, label: 'test' }],
          [{ id: 2, value: 'A2' }, { sth: 1, label: 'test2' }],
        ],
        valueGetter: value => value?.value ?? value?.label,
      });

      const plugin = getPlugin('CopyPaste');
      const event = getClipboardEvent();

      await selectCell(0, 0);
      plugin.onCopy(event);

      await selectCell(1, 1);
      plugin.onPaste(event);

      expect(getDataAtCell(1, 1)).toEqual('test2');
      expect(getCopyableSourceData(1, 1)).toEqual({ sth: 1, label: 'test2' });
    });
  });
});
