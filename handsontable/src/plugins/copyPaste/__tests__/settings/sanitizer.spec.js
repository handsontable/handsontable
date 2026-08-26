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

  describe('`sanitizer` setting', () => {
    it('should be called with proper arguments before the value is pasted', async() => {
      const sanitizer = jasmine.createSpy('sanitizer');

      handsontable({
        copyPaste: true,
        sanitizer,
      });

      const clipboardEvent = getClipboardEvent();
      const plugin = getPlugin('CopyPaste');

      clipboardEvent.clipboardData.setData('text/html', '<div>test</div>');

      await selectCell(0, 0);

      plugin.onPaste(clipboardEvent);

      expect(sanitizer).toHaveBeenCalledWith('<div>test</div>', 'CopyPaste.paste');
    });

    it('should be called for the private source-data clipboard type', async() => {
      // Escapes the markup delimiters rather than stripping an attribute pattern. Removing a
      // multi-character sequence can reintroduce it (CodeQL `js/incomplete-multi-character-sanitization`),
      // and a test sanitizer that is itself unsound proves nothing about the code under test.
      const sanitizer = jasmine.createSpy('sanitizer')
        .and
        .callFake(content => content
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;'));

      handsontable({
        copyPaste: true,
        sanitizer,
      });

      window.__testFunction = () => {};
      spyOn(window, '__testFunction');

      const clipboardEvent = getClipboardEvent();
      const plugin = getPlugin('CopyPaste');
      // Handsontable writes this type from its own copy handler, but the clipboard is not a
      // trusted channel - any page can set the same type from its own. This branch reached
      // `htmlToGridSettings()` unsanitized while `text/html` did not.
      const payload = '<table><tbody><tr><td>A1</td></tr></tbody></table>' +
        '<img src onerror="__testFunction()">';

      clipboardEvent.clipboardData.setData('application/ht-source-data-json-html', payload);

      await selectCell(0, 0);

      plugin.onPaste(clipboardEvent);

      await waitForNextAnimationFrames(2);

      expect(sanitizer).toHaveBeenCalledWith(payload, 'CopyPaste.paste.sourceData');
      expect(window.__testFunction).not.toHaveBeenCalled();
    });

    it('should warn once when only the private source-data type carries HTML and no sanitizer is set',
      async() => {
        const warnSpy = spyOnConsoleWarn();

        handsontable({
          copyPaste: true,
        });

        const clipboardEvent = getClipboardEvent();
        const plugin = getPlugin('CopyPaste');

        clipboardEvent.clipboardData.setData(
          'application/ht-source-data-json-html',
          '<table><tbody><tr><td>A1</td></tr></tbody></table>'
        );

        await selectCell(0, 0);

        plugin.onPaste(clipboardEvent);

        await waitForNextAnimationFrames(2);

        expect(warnSpy).toHaveBeenCalledWith(jasmine.stringMatching(/without a sanitizer/));
        expect(warnSpy.calls.count()).toBe(1);
      });

    it('should still restore object-based source data pasted between Handsontable instances', async() => {
      handsontable({
        data: [{ id: 1, value: 'A1' }, { id: 2, value: 'A2' }],
        // `parsePastedValue` is what makes the source-data payload do anything at all. It defaults
        // to `false`, and only the `autocomplete`, `dropdown` and `multiSelect` cell types turn it
        // on, so without it the restore branch in `populateValues()` never runs and this test would
        // pass no matter what the sanitizer did to the payload.
        columns: [{ data: 'value', parsePastedValue: true }],
        copyPaste: true,
        sanitizer: content => content,
      });

      const clipboardEvent = getClipboardEvent();
      const plugin = getPlugin('CopyPaste');

      clipboardEvent.clipboardData.setData('text/html', [
        '<meta name="generator" content="Handsontable"/>',
        '<table><tbody><tr><td>B1</td></tr></tbody></table>',
      ].join(''));
      clipboardEvent.clipboardData.setData('application/ht-source-data-json-html', [
        '<meta name="generator" content="Handsontable"/>',
        '<table><tbody><tr><td>{"id":9,"value":"B1"}</td></tr></tbody></table>',
      ].join(''));

      await selectCell(0, 0);

      plugin.onPaste(clipboardEvent);

      await waitForNextAnimationFrames(2);

      expect(getSourceDataAtCell(0, 'value')).toEqual({ id: 9, value: 'B1' });
    });

    it('should degrade to the displayed value when the sanitizer escapes the source-data markup', async() => {
      handsontable({
        data: [{ id: 1, value: 'A1' }, { id: 2, value: 'A2' }],
        columns: [{ data: 'value', parsePastedValue: true }],
        copyPaste: true,
        // An escaping sanitizer turns the payload's `<table>` into text, so `htmlToGridSettings()`
        // finds no table and the object-keyed source data cannot be restored. That is the price of
        // sanitizing this branch, which previously reached the parser raw. Pinned here so the
        // degradation is a known, documented outcome rather than a silent surprise. A stripping
        // sanitizer such as DOMPurify keeps the table and is unaffected.
        sanitizer: content => content
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;'),
      });

      const clipboardEvent = getClipboardEvent();
      const plugin = getPlugin('CopyPaste');

      clipboardEvent.clipboardData.setData('text/plain', 'B1');
      clipboardEvent.clipboardData.setData('text/html', [
        '<meta name="generator" content="Handsontable"/>',
        '<table><tbody><tr><td>B1</td></tr></tbody></table>',
      ].join(''));
      clipboardEvent.clipboardData.setData('application/ht-source-data-json-html', [
        '<meta name="generator" content="Handsontable"/>',
        '<table><tbody><tr><td>{"id":9,"value":"B1"}</td></tr></tbody></table>',
      ].join(''));

      await selectCell(0, 0);

      plugin.onPaste(clipboardEvent);

      await waitForNextAnimationFrames(2);

      // The object is gone; only the displayed value survives.
      expect(getSourceDataAtCell(0, 'value')).toBe('B1');
    });

    it('should keep the object-based source data when the sanitizer passes its own context through',
      async() => {
        handsontable({
          data: [{ id: 1, value: 'A1' }, { id: 2, value: 'A2' }],
          columns: [{ data: 'value', parsePastedValue: true }],
          copyPaste: true,
          // The source-data payload feeds an inert parse, so letting it through does not reopen an
          // injection hole. This is the escape hatch from the degradation asserted above.
          sanitizer: (content, source) => (source === 'CopyPaste.paste.sourceData' ? content : content
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')),
        });

        const clipboardEvent = getClipboardEvent();
        const plugin = getPlugin('CopyPaste');

        clipboardEvent.clipboardData.setData('text/plain', 'B1');
        clipboardEvent.clipboardData.setData('text/html', [
          '<meta name="generator" content="Handsontable"/>',
          '<table><tbody><tr><td>B1</td></tr></tbody></table>',
        ].join(''));
        clipboardEvent.clipboardData.setData('application/ht-source-data-json-html', [
          '<meta name="generator" content="Handsontable"/>',
          '<table><tbody><tr><td>{"id":9,"value":"B1"}</td></tr></tbody></table>',
        ].join(''));

        await selectCell(0, 0);

        plugin.onPaste(clipboardEvent);

        await waitForNextAnimationFrames(2);

        expect(getSourceDataAtCell(0, 'value')).toEqual({ id: 9, value: 'B1' });
      });

    it('should not blank the cell below the target when a single Excel cell is pasted and the' +
      ' sanitizer strips the HTML to plain text', async() => {
      const sanitizer = (content) => {
        const tpl = document.createElement('template');

        tpl.innerHTML = content;

        const text = tpl.content.textContent ?? '';

        return text
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#39;');
      };

      handsontable({
        data: createSpreadsheetData(5, 5),
        copyPaste: true,
        sanitizer,
      });

      const clipboardEvent = getClipboardEvent();
      const plugin = getPlugin('CopyPaste');

      // Excel terminates the single copied cell with a trailing CRLF.
      clipboardEvent.clipboardData.setData('text/html', '<table><tbody><tr><td>X</td></tr></tbody></table>');
      clipboardEvent.clipboardData.setData('text/plain', 'X\r\n');

      await selectCell(3, 1);

      plugin.onPaste(clipboardEvent);

      expect(getDataAtCell(3, 1)).toBe('X');
      expect(getDataAtCell(4, 1)).toBe('B5');
    });

    it('should paste a multi-row Excel selection without appending an extra empty row when the' +
      ' sanitizer strips the HTML to plain text', async() => {
      const sanitizer = (content) => {
        const tpl = document.createElement('template');

        tpl.innerHTML = content;

        return tpl.content.textContent ?? '';
      };

      handsontable({
        data: createSpreadsheetData(5, 5),
        copyPaste: true,
        sanitizer,
      });

      const clipboardEvent = getClipboardEvent();
      const plugin = getPlugin('CopyPaste');

      clipboardEvent.clipboardData.setData('text/plain', 'A\r\nB\r\n');

      await selectCell(0, 0);

      plugin.onPaste(clipboardEvent);

      expect(getDataAtCell(0, 0)).toBe('A');
      expect(getDataAtCell(1, 0)).toBe('B');
      expect(getDataAtCell(2, 0)).toBe('A3');
    });
  });
});
