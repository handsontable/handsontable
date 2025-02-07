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
        '<meta name="generator" content="Handsontable"/>' +
          '<style type="text/css">td{white-space:normal}br{mso-data-placement:same-cell}</style>',
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
      expect(beforeCutSpy).toHaveBeenCalledWith(
        [['A1']], [{ startRow: 0, startCol: 0, endRow: 0, endCol: 0 }]);
      expect(afterCutSpy.calls.count()).toEqual(1);
      expect(afterCutSpy).toHaveBeenCalledWith(
        [['A1']], [{ startRow: 0, startCol: 0, endRow: 0, endCol: 0 }]);
    });

    it('should be possible to cut text outside the table when the `outsideClickDeselects` is disabled', () => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        outsideClickDeselects: false,
      });

      const testElement = $('<div id="testElement">Test</div>');

      spec().$container.after(testElement);

      const cutEvent = getClipboardEvent();
      const plugin = getPlugin('CopyPaste');

      selectCell(1, 1);
      cutEvent.target = testElement[0]; // native cut event is triggered on the element outside the table
      plugin.onCut(cutEvent); // trigger the plugin's method that is normally triggered by the native "cut" event

      // the result is that the clipboard data is not overwritten by the HoT
      expect(cutEvent.clipboardData.getData('text/plain')).toBe('');
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
      plugin.onCut(copyEvent); // trigger the plugin's method that is normally triggered by the native "cut" event

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
      plugin.onCut(copyEvent); // trigger the plugin's method that is normally triggered by the native "cut" event

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
      plugin.onCut(copyEvent); // trigger the plugin's method that is normally triggered by the native "cut" event

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
      plugin.onCut(copyEvent); // trigger the plugin's method that is normally triggered by the native "cut" event

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
      plugin.onCut(copyEvent); // trigger the plugin's method that is normally triggered by the native "cut" event

      expect(copyEvent.preventDefault).toHaveBeenCalled();
    });
  });
});
