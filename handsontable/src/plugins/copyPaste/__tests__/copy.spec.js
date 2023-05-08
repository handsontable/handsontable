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
    xit('should be possible to copy data by keyboard shortcut', () => {
      // simulated keyboard shortcuts doesn't run the true events
    });

    xit('should be possible to copy data by contextMenu option', () => {
      // simulated mouse events doesn't run the true browser event
    });

    it('should reset the copy mode (internal state) to "cells-only" after each copy operation', () => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
        copyPaste: true,
      });

      const copyEvent = getClipboardEvent();
      const plugin = getPlugin('CopyPaste');

      selectCell(1, 1);

      plugin.copyColumnHeadersOnly();
      plugin.onCopy(copyEvent); // emulate native "copy" event

      expect(copyEvent.clipboardData.getData('text/plain')).toBe('B');

      plugin.onCopy(copyEvent); // emulate native "copy" event triggered by Cmd/Ctrl+C (copy cells)

      expect(copyEvent.clipboardData.getData('text/plain')).toBe('B2');
    });

    it('should copy special characters to the clipboard', () => {
      handsontable({
        colHeaders: ['!@#$%^&*()_+-={[', ']};:\'"\\|,<.>/?~'],
        data: [
          ['!@#$%^&*()_+-={[', ']};:\'"\\|,<.>/?~']
        ],
      });

      const copyEvent = getClipboardEvent();
      const plugin = getPlugin('CopyPaste');

      selectAll();

      plugin.copyWithColumnHeaders();
      plugin.onCopy(copyEvent); // emulate native "copy" event

      expect(copyEvent.clipboardData.getData('text/plain'))
        .toBe('!@#$%^&*()_+-={[\t]};:\'"\\|,<.>/?~\n!@#$%^&*()_+-={[\t]};:\'"\\|,<.>/?~');
      expect(copyEvent.clipboardData.getData('text/html')).toBe([
        '<meta name="generator" content="Handsontable"/>' +
          '<style type="text/css">td{white-space:normal}br{mso-data-placement:same-cell}</style>',
        '<table><tbody>',
        '<tr><td>!@#$%^&*()_+-={[</td><td>]};:\'"\\|,&lt;.&gt;/?~</td></tr>',
        '<tr><td>!@#$%^&*()_+-={[</td><td>]};:\'"\\|,&lt;.&gt;/?~</td></tr>',
        '</tbody></table>',
      ].join(''));
    });

    it('should copy text in quotes to the clipboard', () => {
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

      selectAll();

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

    it('should copy 0 and false values to the clipboard', () => {
      handsontable({
        colHeaders: ['', 0, false, undefined, null],
        data: [['', 0, false, undefined, null]],
      });

      const copyEvent = getClipboardEvent();
      const plugin = getPlugin('CopyPaste');

      selectAll();

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

    it('should handle spaces properly (creates Excel compatible HTML)', () => {
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

      selectAll();

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
  });
});
