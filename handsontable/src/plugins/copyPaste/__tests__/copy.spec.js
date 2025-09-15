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

  describe('copy', () => {
    xit('should be possible to copy data by keyboard shortcut', async() => {
      // simulated keyboard shortcuts doesn't run the true events
    });

    xit('should be possible to copy data by contextMenu option', async() => {
      // simulated mouse events doesn't run the true browser event
    });

    it('should copy the data by default from the last selection layer', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
        copyPaste: true,
        navigableHeaders: true,
      });

      const copyEvent = getClipboardEvent();
      const plugin = getPlugin('CopyPaste');

      await selectCells([
        [0, 0, 2, 2],
        [2, 1, 2, 3],
        [1, 4, 3, 4],
      ]);

      plugin.copyCellsOnly();
      plugin.onCopy(copyEvent); // emulate native "copy" event

      expect(copyEvent.clipboardData.getData('text/plain')).toBe('E2\nE3\nE4');
    });

    it('should copy the data from the active selection layer', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
        copyPaste: true,
        navigableHeaders: true,
      });

      const copyEvent = getClipboardEvent();
      const plugin = getPlugin('CopyPaste');

      await selectCells([
        [0, 0, 2, 2],
        [2, 1, 2, 3],
        [1, 4, 3, 4],
      ]);

      await keyDownUp(['shift', 'tab']);
      await keyDownUp(['shift', 'tab']); // select C3 of the second layer

      plugin.copyCellsOnly();
      plugin.onCopy(copyEvent); // emulate native "copy" event

      expect(copyEvent.clipboardData.getData('text/plain')).toBe('B3\tC3\tD3');
    });

    it('should reset the copy mode (internal state) to "cells-only" after each copy operation', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
        copyPaste: true,
      });

      const copyEvent = getClipboardEvent();
      const plugin = getPlugin('CopyPaste');

      await selectCell(1, 1);

      plugin.copyColumnHeadersOnly();
      plugin.onCopy(copyEvent); // emulate native "copy" event

      expect(copyEvent.clipboardData.getData('text/plain')).toBe('B');

      plugin.onCopy(copyEvent); // emulate native "copy" event triggered by Cmd/Ctrl+C (copy cells)

      expect(copyEvent.clipboardData.getData('text/plain')).toBe('B2');
    });

    it('should reset the clipboard when the column header is highlighted', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
        copyPaste: true,
        navigableHeaders: true,
      });

      const copyEvent = getClipboardEvent();
      const plugin = getPlugin('CopyPaste');

      await selectCell(1, 1);

      plugin.copyCellsOnly();
      plugin.onCopy(copyEvent); // emulate native "copy" event

      expect(copyEvent.clipboardData.getData('text/plain')).toBe('B2');

      await sleep(500);

      await selectCell(-1, 1);

      plugin.copyCellsOnly();
      plugin.onCopy(copyEvent); // emulate native "copy" event

      expect(copyEvent.clipboardData.getData('text/plain')).toBe('');
    });

    it('should reset the clipboard when the row header is highlighted', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
        copyPaste: true,
        navigableHeaders: true,
      });

      const copyEvent = getClipboardEvent();
      const plugin = getPlugin('CopyPaste');

      await selectCell(1, 1);

      plugin.copyCellsOnly();
      plugin.onCopy(copyEvent); // emulate native "copy" event

      expect(copyEvent.clipboardData.getData('text/plain')).toBe('B2');

      await sleep(500);
      await selectCell(1, -1);

      plugin.copyCellsOnly();
      plugin.onCopy(copyEvent); // emulate native "copy" event

      expect(copyEvent.clipboardData.getData('text/plain')).toBe('');
    });

    it('should reset the clipboard when the corner is highlighted', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
        copyPaste: true,
        navigableHeaders: true,
      });

      const copyEvent = getClipboardEvent();
      const plugin = getPlugin('CopyPaste');

      await selectCell(1, 1);

      plugin.copyCellsOnly();
      plugin.onCopy(copyEvent); // emulate native "copy" event

      expect(copyEvent.clipboardData.getData('text/plain')).toBe('B2');

      await sleep(500);
      await selectCell(-1, -1);

      plugin.copyCellsOnly();
      plugin.onCopy(copyEvent); // emulate native "copy" event

      expect(copyEvent.clipboardData.getData('text/plain')).toBe('');
    });

    it('should copy special characters to the clipboard', async() => {
      handsontable({
        colHeaders: ['!@#$%^&*()_+-={[', ']};:\'"\\|,<.>/?~&LTE'],
        data: [
          ['!@#$%^&*()_+-={[', ']};:\'"\\|,<.>/?~&LTE']
        ],
      });

      const copyEvent = getClipboardEvent();
      const plugin = getPlugin('CopyPaste');

      await selectAll();

      plugin.copyWithColumnHeaders();
      plugin.onCopy(copyEvent); // emulate native "copy" event

      expect(copyEvent.clipboardData.getData('text/plain'))
        .toBe('!@#$%^&*()_+-={[\t]};:\'"\\|,<.>/?~&LTE\n!@#$%^&*()_+-={[\t]};:\'"\\|,<.>/?~&LTE');
      expect(copyEvent.clipboardData.getData('text/html')).toBe([
        '<meta name="generator" content="Handsontable"/>' +
          '<style type="text/css">td{white-space:normal}br{mso-data-placement:same-cell}</style>',
        '<table><tbody>',
        '<tr><td>!@#$%^&amp;*()_+-={[</td><td>]};:\'"\\|,&lt;.&gt;/?~&amp;LTE</td></tr>',
        '<tr><td>!@#$%^&amp;*()_+-={[</td><td>]};:\'"\\|,&lt;.&gt;/?~&amp;LTE</td></tr>',
        '</tbody></table>',
      ].join(''));
    });

    it('should copy text in quotes to the clipboard', async() => {
      handsontable({
        colHeaders: ['{"test": "value"}'],
        data: [
          ['{"test": "value"}'],
          ['{"test2": {"testtest": ""}}'],
          ['{"test3": ""}'],
        ],
      });

      const copyEvent = getClipboardEvent();
      const plugin = getPlugin('CopyPaste');

      await selectAll();

      plugin.copyWithColumnHeaders();
      plugin.onCopy(copyEvent); // emulate native "copy" event

      expect(copyEvent.clipboardData.getData('text/plain'))
        .toBe('{"test": "value"}\n{"test": "value"}\n{"test2": {"testtest": ""}}\n{"test3": ""}');
      expect(copyEvent.clipboardData.getData('text/html')).toBe([
        '<meta name="generator" content="Handsontable"/>' +
          '<style type="text/css">td{white-space:normal}br{mso-data-placement:same-cell}</style>',
        '<table><tbody>',
        '<tr><td>{"test": "value"}</td></tr>',
        '<tr><td>{"test": "value"}</td></tr>',
        '<tr><td>{"test2": {"testtest": ""}}</td></tr>',
        '<tr><td>{"test3": ""}</td></tr>',
        '</tbody></table>',
      ].join(''));
    });

    it('should copy 0 and false values to the clipboard', async() => {
      handsontable({
        colHeaders: ['', 0, false, undefined, null],
        data: [['', 0, false, undefined, null]],
      });

      const copyEvent = getClipboardEvent();
      const plugin = getPlugin('CopyPaste');

      await selectAll();

      plugin.copyWithColumnHeaders();
      plugin.onCopy(copyEvent); // emulate native "copy" event

      // Handsontable replaces undefined values with letters
      expect(copyEvent.clipboardData.getData('text/plain')).toBe('\t0\tfalse\tD\t\n\t0\tfalse\t\t');
      expect(copyEvent.clipboardData.getData('text/html')).toBe([
        '<meta name="generator" content="Handsontable"/>' +
          '<style type="text/css">td{white-space:normal}br{mso-data-placement:same-cell}</style>',
        '<table><tbody>',
        '<tr><td></td><td>0</td><td>false</td><td>D</td><td></td></tr>',
        '<tr><td></td><td>0</td><td>false</td><td></td><td></td></tr>',
        '</tbody></table>',
      ].join(''));
    });

    it('should handle spaces properly (creates Excel compatible HTML)', async() => {
      handsontable({
        colHeaders: ['a   b'],
        data: [
          ['c d'],
          ['e  f'],
          ['g      h'],
        ],
      });

      const copyEvent = getClipboardEvent();
      const plugin = getPlugin('CopyPaste');

      await selectAll();

      plugin.copyWithColumnHeaders();
      plugin.onCopy(copyEvent); // emulate native "copy" event

      expect(copyEvent.clipboardData.getData('text/plain'))
        .toBe('a   b\nc d\ne  f\ng      h');
      expect(copyEvent.clipboardData.getData('text/html')).toBe([
        '<meta name="generator" content="Handsontable"/>' +
        '<style type="text/css">td{white-space:normal}br{mso-data-placement:same-cell}</style>',
        '<table><tbody>',
        '<tr><td>a<span style="mso-spacerun: yes">&nbsp;&nbsp; </span>b</td></tr>',
        '<tr><td>c d</td></tr>',
        '<tr><td>e<span style="mso-spacerun: yes">&nbsp; </span>f</td></tr>',
        '<tr><td>g<span style="mso-spacerun: yes">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; </span>h</td></tr>',
        '</tbody></table>',
      ].join(''));
    });

    it('should be possible to copy text outside the table when the `outsideClickDeselects` is disabled', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        outsideClickDeselects: false,
      });

      const testElement = $('<div id="testElement">Test</div>');

      spec().$container.after(testElement);

      const copyEvent = getClipboardEvent({
        target: testElement[0], // native copy event is triggered on the element outside the table
      });
      const plugin = getPlugin('CopyPaste');

      await selectCell(1, 1);
      copyEvent.target = testElement[0]; // native copy event is triggered on the element outside the table
      plugin.onCopy(copyEvent); // trigger the plugin's method that is normally triggered by the native "copy" event

      // the result is that the clipboard data is not overwritten by the HoT
      expect(copyEvent.clipboardData.getData('text/plain')).toBe('');

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
      plugin.onCopy(copyEvent); // trigger the plugin's method that is normally triggered by the native "copy" event

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
      plugin.onCopy(copyEvent); // trigger the plugin's method that is normally triggered by the native "copy" event

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
      plugin.onCopy(copyEvent); // trigger the plugin's method that is normally triggered by the native "copy" event

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
      plugin.onCopy(copyEvent); // trigger the plugin's method that is normally triggered by the native "copy" event

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
      plugin.onCopy(copyEvent); // trigger the plugin's method that is normally triggered by the native "copy" event

      expect(copyEvent.preventDefault).toHaveBeenCalled();
    });

    it('should be possible to copy the content that starts outside of the rendered viewport (#dev-2298)', async() => {
      handsontable({
        data: createSpreadsheetData(1, 50),
        width: 100,
        height: 50,
      });

      const plugin = getPlugin('CopyPaste');
      const expectedResult = getDataAtRow(0).join('\t');

      await selectCells([[0, 0, 0, 49]]);
      await sleep(10);

      const copyEvent = getClipboardEvent({
        target: document.activeElement,
      });

      plugin.onCopy(copyEvent); // emulate native "copy" event

      expect(copyEvent.clipboardData.getData('text/plain')).toBe(expectedResult);
    });

    it('should stringify the object-based cells as JSON under `application/ht-source-data-json-html`', async() => {
      handsontable({
        data: [
          [{ id: 1, value: 'A1' }, 'test'],
          [{ id: 3, value: 'A2' }, 'test2'],
        ],
        columns: [
          {
            valueGetter: value => value.value,
          },
          {},
        ],
      });

      const plugin = getPlugin('CopyPaste');
      const copyEvent = getClipboardEvent();

      await selectCells([[0, 0, 1, 0]]);
      plugin.onCopy(copyEvent);

      expect(copyEvent.clipboardData.getData('application/ht-source-data-json-html')).toEqual([
        '<meta name="generator" content="Handsontable"/>' +
        '<style type="text/css">td{white-space:normal}br{mso-data-placement:same-cell}</style>' +
        '<table><tbody>' +
        '<tr><td>{"id":1,"value":"A1"}</td></tr>' +
        '<tr><td>{"id":3,"value":"A2"}</td></tr>' +
        '</tbody></table>',
      ].join(''));

      await selectCells([[0, 1, 1, 1]]);
      plugin.onCopy(copyEvent);

      expect(copyEvent.clipboardData.getData('application/ht-source-data-json-html')).toEqual([
        '<meta name="generator" content="Handsontable"/>' +
        '<style type="text/css">td{white-space:normal}br{mso-data-placement:same-cell}</style>' +
        '<table><tbody>' +
        '<tr><td>test</td></tr>' +
        '<tr><td>test2</td></tr>' +
        '</tbody></table>',
      ].join(''));

      await selectAll();
      plugin.onCopy(copyEvent);

      expect(copyEvent.clipboardData.getData('application/ht-source-data-json-html')).toEqual([
        '<meta name="generator" content="Handsontable"/>' +
        '<style type="text/css">td{white-space:normal}br{mso-data-placement:same-cell}</style>' +
        '<table><tbody>' +
        '<tr><td>{"id":1,"value":"A1"}</td><td>test</td></tr>' +
        '<tr><td>{"id":3,"value":"A2"}</td><td>test2</td></tr>' +
        '</tbody></table>',
      ].join(''));
    });
  });
});
