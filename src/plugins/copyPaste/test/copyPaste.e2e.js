describe('CopyPaste', () => {
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

  const arrayOfArrays = function() {
    return [
      ['', 'Kia', 'Nissan', 'Toyota', 'Honda'],
      ['2008', 10, 11, 12, 13],
      ['2009', 20, 11, 14, 13],
      ['2010', 30, 15, 12, 13]
    ];
  };

  describe('enabling/disabing plugin', () => {
    it('should copyPaste be set enabled as default', () => {
      const hot = handsontable();

      expect(hot.getSettings().copyPaste).toBeTruthy();
      expect(hot.getPlugin('CopyPaste').focusableElement).toBeDefined();
    });

    it('should do not create textarea element if copyPaste is disabled on initialization', () => {
      handsontable({
        copyPaste: false
      });

      expect($('.HandsontableCopyPaste').length).toEqual(0);
    });
  });

  describe('focusable element', () => {
    it('should reuse focusable element by borrowing an element from cell editor', async() => {
      handsontable();
      selectCell(0, 0);

      await sleep(150);

      expect(document.activeElement).toBe(getActiveEditor().TEXTAREA);
      expect($('.HandsontableCopyPaste').length).toBe(0);
    });

    it('should create focusable element when cell editor doesn\'t exist', () => {
      handsontable({
        editor: false,
      });
      selectCell(0, 0);

      expect($('.HandsontableCopyPaste').length).toEqual(1);
    });

    it('should keep focusable element if updateSettings occurred after the end of the selection', () => {
      handsontable();
      selectCell(0, 0, 2, 2);
      updateSettings({});

      expect(getPlugin('CopyPaste').focusableElement.mainElement).not.toBe(null);
    });
  });

  describe('working with multiple tables', () => {
    beforeEach(function() {
      this.$container2 = $(`<div id="${id}2"></div>`).appendTo('body');
    });

    afterEach(function() {
      if (this.$container2) {
        this.$container2.handsontable('destroy');
        this.$container2.remove();
      }
    });

    it('should disable copyPaste only in particular table', () => {
      const hot1 = handsontable();
      const hot2 = spec().$container2.handsontable({ copyPaste: false }).handsontable('getInstance');

      expect(hot1.getPlugin('CopyPaste').focusableElement).toBeDefined();
      expect(hot2.getPlugin('CopyPaste').focusableElement).toBeUndefined();
    });

    it('should not create HandsontableCopyPaste element until the table will be selected', () => {
      handsontable();
      spec().$container2.handsontable();

      expect($('.HandsontableCopyPaste').length).toBe(0);
    });

    it('should use focusable element from cell editor of the lastly selected table', async() => {
      const hot1 = handsontable();
      const hot2 = spec().$container2.handsontable().handsontable('getInstance');

      hot1.selectCell(0, 0);
      hot2.selectCell(1, 1);

      await sleep(100);

      expect($('.HandsontableCopyPaste').length).toBe(0);
      expect(document.activeElement).toBe(hot2.getActiveEditor().TEXTAREA);
    });

    it('should destroy HandsontableCopyPaste element as long as at least one table has copyPaste enabled', () => {
      const hot1 = handsontable({ editor: false });
      const hot2 = spec().$container2.handsontable({ editor: false }).handsontable('getInstance');

      hot1.selectCell(0, 0);
      hot2.selectCell(0, 0);

      expect($('.HandsontableCopyPaste').length).toBe(1);

      hot1.updateSettings({ copyPaste: false });

      expect($('.HandsontableCopyPaste').length).toBe(1);

      hot2.updateSettings({ copyPaste: false });

      expect($('.HandsontableCopyPaste').length).toBe(0);
    });

    it('should not touch focusable element borrowed from cell editors', () => {
      const hot1 = handsontable();
      const hot2 = spec().$container2.handsontable().handsontable('getInstance');

      hot1.selectCell(0, 0);
      hot2.selectCell(0, 0);

      expect($('.handsontableInput').length).toBe(2);

      hot1.updateSettings({ copyPaste: false });

      expect($('.handsontableInput').length).toBe(2);

      hot2.updateSettings({ copyPaste: false });

      expect($('.handsontableInput').length).toBe(2);
    });
  });

  describe('copy', () => {
    xit('should be possible to copy data by keyboard shortcut', () => {
      // simulated keyboard shortcuts doesn't run the true events
    });

    xit('should be possible to copy data by contextMenu option', () => {
      // simulated mouse events doesn't run the true browser event
    });

    it('should be possible to copy data by API', () => {
      const hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(2, 2),
      });
      const copyEvent = getClipboardEvent();
      const plugin = hot.getPlugin('CopyPaste');

      selectCell(1, 0);

      plugin.onCopy(copyEvent);

      expect(copyEvent.clipboardData.getData('text/plain')).toBe('A2');
      expect(copyEvent.clipboardData.getData('text/html')).toBe([
        '<meta name="generator" content="Handsontable"/><style type="text/css">td{white-space:normal}br{mso-data-placement:same-cell}</style><table>',
        '<tbody><tr><td>A2</td></tr></tbody></table>'].join(''));
    });

    it('should call beforeCopy and afterCopy during copying operation', () => {
      const beforeCopySpy = jasmine.createSpy('beforeCopy');
      const afterCopySpy = jasmine.createSpy('afterCopy');

      const hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(2, 2),
        beforeCopy: beforeCopySpy,
        afterCopy: afterCopySpy,
      });

      const copyEvent = getClipboardEvent();
      const plugin = hot.getPlugin('CopyPaste');

      selectCell(0, 0);

      plugin.onCopy(copyEvent);

      expect(beforeCopySpy.calls.count()).toEqual(1);
      expect(beforeCopySpy).toHaveBeenCalledWith([['A1']], [{ startRow: 0, startCol: 0, endRow: 0, endCol: 0 }], void 0, void 0, void 0, void 0);
      expect(afterCopySpy.calls.count()).toEqual(1);
      expect(afterCopySpy).toHaveBeenCalledWith([['A1']], [{ startRow: 0, startCol: 0, endRow: 0, endCol: 0 }], void 0, void 0, void 0, void 0);
    });

    it('should be possible to block copying', () => {
      const beforeCopySpy = jasmine.createSpy('beforeCopy');
      const afterCopySpy = jasmine.createSpy('afterCopy');

      const hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(2, 2),
        beforeCopy() {
          beforeCopySpy();
          return false;
        },
        afterCopy: afterCopySpy,
      });

      const copyEvent = getClipboardEvent();
      const plugin = hot.getPlugin('CopyPaste');

      selectCell(0, 0);

      plugin.onCopy(copyEvent);

      expect(beforeCopySpy.calls.count()).toEqual(1);
      expect(afterCopySpy.calls.count()).toEqual(0);
    });

    it('should be possible modification of changes during copying', () => {
      const hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(2, 2),
        beforeCopy(changes) {
          changes.splice(0, 1);
        },
      });

      const copyEvent = getClipboardEvent();
      const plugin = hot.getPlugin('CopyPaste');
      selectCell(0, 0, 1, 0);

      plugin.onCopy(copyEvent);

      expect(copyEvent.clipboardData.getData('text/plain')).toEqual('A2');
      expect(copyEvent.clipboardData.getData('text/html')).toEqual([
        '<meta name="generator" content="Handsontable"/><style type="text/css">td{white-space:normal}br{mso-data-placement:same-cell}</style><table>',
        '<tbody><tr><td>A2</td></tr></tbody></table>'].join(''));
    });

    it('should be possible to copy multiline text', () => {
      handsontable({
        data: [
          ['A\nB', 'C']
        ],
      });

      const copyEvent = getClipboardEvent();
      const plugin = getPlugin('CopyPaste');

      selectCell(0, 0, 0, 1);

      plugin.onCopy(copyEvent);

      expect(copyEvent.clipboardData.getData('text/plain')).toEqual('"A\nB"\tC');
      expect(copyEvent.clipboardData.getData('text/html')).toEqual([
        '<meta name="generator" content="Handsontable"/><style type="text/css">td{white-space:normal}br{mso-data-placement:same-cell}</style><table><tbody><tr><td>A<br>',
        'B</td><td>C</td></tr></tbody></table>'
      ].join('\r\n'));
    });

    it('should be possible to copy special chars', () => {
      handsontable({
        data: [
          ['!@#$%^&*()_+-={[', ']};:\'"\\|,<.>/?~']
        ],
      });

      const copyEvent = getClipboardEvent();
      const plugin = getPlugin('CopyPaste');

      selectCell(0, 0, 0, 1);

      plugin.onCopy(copyEvent);

      expect(copyEvent.clipboardData.getData('text/plain')).toEqual('!@#$%^&*()_+-={[\t]};:\'"\\|,<.>/?~');
      expect(copyEvent.clipboardData.getData('text/html')).toEqual([
        '<meta name="generator" content="Handsontable"/><style type="text/css">td{white-space:normal}br{mso-data-placement:same-cell}</style>',
        '<table><tbody><tr><td>!@#$%^&*()_+-={[</td>',
        '<td>]};:\'"\\|,&lt;.&gt;/?~</td></tr></tbody></table>'
      ].join(''));
    });

    it('should be possible to copy text in quotes', () => {
      handsontable({
        data: [
          ['{"test": "value"}'],
          ['{"test2": {"testtest": ""}}'],
          ['{"test3": ""}'],
        ],
      });

      const copyEvent = getClipboardEvent();
      const plugin = getPlugin('CopyPaste');

      selectCell(0, 0, 2, 0);

      plugin.onCopy(copyEvent);

      expect(copyEvent.clipboardData.getData('text/plain')).toEqual('{"test": "value"}\n{"test2": {"testtest": ""}}\n{"test3": ""}');
      expect(copyEvent.clipboardData.getData('text/html')).toEqual([
        '<meta name="generator" content="Handsontable"/><style type="text/css">td{white-space:normal}br{mso-data-placement:same-cell}</style>',
        '<table><tbody><tr><td>{"test":&nbsp;"value"}</td></tr><tr><td>{"test2":&nbsp;{"testtest":&nbsp;""}}</td>',
        '</tr><tr><td>{"test3":&nbsp;""}</td></tr></tbody></table>'
      ].join(''));
    });

    it('should be possible to copy 0 and false', () => {
      handsontable({
        data: [
          [''],
          [0],
          [false],
          [undefined],
          [null],
        ],
      });

      const copyEvent = getClipboardEvent();
      const plugin = getPlugin('CopyPaste');

      selectCell(0, 0, 4, 0);

      plugin.onCopy(copyEvent);

      expect(copyEvent.clipboardData.getData('text/plain')).toEqual('\n0\nfalse\n\n');
      expect(copyEvent.clipboardData.getData('text/html')).toEqual([
        '<meta name="generator" content="Handsontable"/><style type="text/css">td{white-space:normal}br{mso-data-placement:same-cell}</style>',
        '<table><tbody><tr><td></td></tr><tr><td>0</td></tr><tr><td>false</td></tr>',
        '<tr><td></td></tr><tr><td></td></tr></tbody></table>'
      ].join(''));
    });
  });

  describe('cut', () => {
    xit('should be possible to cut data by keyboard shortcut', () => {
      // simulated keyboard shortcuts doesn't run the true events
    });

    xit('should be possible to cut data by contextMenu option', () => {
      // simulated mouse events doesn't run the true browser event
    });

    it('should be possible to cut data by API', () => {
      const hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(2, 2),
      });
      const cutEvent = getClipboardEvent();
      const plugin = hot.getPlugin('CopyPaste');

      selectCell(1, 0);

      plugin.onCut(cutEvent);

      expect(cutEvent.clipboardData.getData('text/plain')).toBe('A2');
      expect(cutEvent.clipboardData.getData('text/html')).toEqual([
        '<meta name="generator" content="Handsontable"/><style type="text/css">td{white-space:normal}br{mso-data-placement:same-cell}</style>',
        '<table><tbody><tr><td>A2</td></tr></tbody></table>'].join(''));

      expect(hot.getDataAtCell(1, 0)).toBe(null);
    });

    it('should call beforeCut and afterCut during cutting out operation', () => {
      const beforeCutSpy = jasmine.createSpy('beforeCut');
      const afterCutSpy = jasmine.createSpy('afterCut');

      const hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(2, 2),
        beforeCut: beforeCutSpy,
        afterCut: afterCutSpy
      });
      const cutEvent = getClipboardEvent();
      const plugin = hot.getPlugin('CopyPaste');

      selectCell(0, 0);

      plugin.onCut(cutEvent);

      expect(beforeCutSpy.calls.count()).toEqual(1);
      expect(beforeCutSpy).toHaveBeenCalledWith([['A1']], [{ startRow: 0, startCol: 0, endRow: 0, endCol: 0 }], void 0, void 0, void 0, void 0);
      expect(afterCutSpy.calls.count()).toEqual(1);
      expect(afterCutSpy).toHaveBeenCalledWith([['A1']], [{ startRow: 0, startCol: 0, endRow: 0, endCol: 0 }], void 0, void 0, void 0, void 0);
    });
  });

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
      expect(getData(0, 0, 2, 4)).toEqual([['', 'Kia', 'Nissan', 'Toyota', 'Honda'], ['Kia', 'Nissan', 'Toyota', 12, 13], ['2008', 10, 11, 14, 13]]);
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
      expect(getData(0, 0, 2, 4)).toEqual([['', 'Kia', 'Nissan', 'Toyota', 'Honda'], ['Kia', 'Nissan', 'Toyota', 12, 13], ['2008', 10, 11, 14, 13]]);
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
      keyDown('ctrl');
      triggerPaste('Kia');

      await sleep(60);

      expect(beforePasteSpy.calls.count()).toEqual(1);
      expect(beforePasteSpy).toHaveBeenCalledWith([['Kia']], [{ startRow: 0, startCol: 0, endRow: 0, endCol: 0 }], void 0, void 0, void 0, void 0);

      expect(afterPasteSpy.calls.count()).toEqual(1);
      expect(afterPasteSpy).toHaveBeenCalledWith([['Kia']], [{ startRow: 0, startCol: 0, endRow: 0, endCol: 0 }], void 0, void 0, void 0, void 0);
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
      keyDown('ctrl');
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
      keyDown('ctrl');
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

      expect(afterChangeSpy)
        .toHaveBeenCalledWith([[0, 0, null, 'Kia'], [1, 0, null, 'Nissan'], [2, 0, null, 'Toyota']], 'CopyPaste.paste', void 0, void 0, void 0, void 0);
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
  });
});
