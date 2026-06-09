describe('Focus Manager', () => {
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

  describe('`getRefocusDelay` method', () => {
    it('should return default (very small) delay (#dev-1762)', async() => {
      handsontable({});

      expect(getFocusManager().getRefocusDelay()).toBe(1);
    });
  });

  describe('`getFocusMode` method', () => {
    it('should set it\'s internal `focusMode` property to "cell" after HOT initialization with `imeFastEdit` not' +
      ' defined', async() => {
      handsontable({});

      expect(getFocusManager().getFocusMode()).toEqual('cell');
    });

    it('should set it\'s internal `focusMode` property to "mixed" after HOT initialization with `imeFastEdit` enabled', async() => {
      handsontable({
        imeFastEdit: true,
      });

      expect(getFocusManager().getFocusMode()).toEqual('mixed');
    });

    it('should set it\'s internal `focusMode` property to "mixed" after HOT initialization with `imeFastEdit` disabled', async() => {
      handsontable({
        imeFastEdit: false,
      });

      expect(getFocusManager().getFocusMode()).toEqual('cell');
    });

    it('should update it\'s internal `focusMode` config after calling `updateSettings` containing `imeFastEdit`', async() => {
      handsontable({});

      expect(getFocusManager().getFocusMode()).toEqual('cell');

      await updateSettings({
        imeFastEdit: true,
      });

      expect(getFocusManager().getFocusMode()).toEqual('mixed');

      await updateSettings({
        imeFastEdit: false,
      });

      expect(getFocusManager().getFocusMode()).toEqual('cell');
    });

    it('should not reset internal `focusMode` config after calling `updateSettings` with an empty object', async() => {
      handsontable({
        imeFastEdit: true,
      });

      expect(getFocusManager().getFocusMode()).toEqual('mixed');

      await updateSettings({});

      expect(getFocusManager().getFocusMode()).toEqual('mixed');
    });

    it('should update value in editor textarea when `imeFastEdit` is enabled', async() => {
      handsontable({
        data: createSpreadsheetData(2, 2),
        imeFastEdit: true,
      });

      await selectCell(0, 0);
      await waitForNextAnimationFrames(1);

      expect(document.activeElement).toEqual(getActiveEditor().TEXTAREA);
      expect(getActiveEditor().TEXTAREA.value).toEqual('A1');
    });

    it('should be able to get and set the current `focusMode` with appropriate API options', async() => {
      handsontable({});

      expect(getFocusManager().getFocusMode()).toEqual('cell');

      getFocusManager().setFocusMode('mixed');

      expect(getFocusManager().getFocusMode()).toEqual('mixed');
    });

    it('should display a warning when trying to set an invalid `focusMode`', async() => {
      spyOn(console, 'warn');

      handsontable({});

      getFocusManager().setFocusMode('test');

      // eslint-disable-next-line no-console
      expect(console.warn).toHaveBeenCalledWith('"test" is not a valid focus mode.');
    });
  });

  describe('`focusOnHighlightedCell` method', () => {
    it('should not throw an error when there is no selection applied', async() => {
      const spy = jasmine.createSpyObj('error', ['test']);
      const prevError = window.onerror;

      window.onerror = function() {
        spy.test();

        return true;
      };

      handsontable({});

      getFocusManager().focusOnHighlightedCell();

      await waitForNextAnimationFrames(4);

      expect(spy.test.calls.count()).toBe(0);

      window.onerror = prevError;
    });

    it('should focus the element provided in the argument', async() => {
      handsontable({});

      await selectCell(0, 0);

      getFocusManager().focusOnHighlightedCell(getCell(1, 1, true));

      expect(document.activeElement).toEqual(getCell(1, 1, true));
    });
  });

  describe('`refocusToEditorTextarea` method', () => {
    it('should focus the current editor element valid for the time when it is focused (#dev-2094)', async() => {
      handsontable({
        columns: [
          { type: 'text' },
          { type: 'numeric' },
        ],
        imeFastEdit: true,
      });

      getFocusManager().setRefocusDelay(50);

      await selectCell(0, 0);
      await waitForNextAnimationFrames(7);

      expect(document.activeElement).toEqual(getActiveEditor().TEXTAREA);

      await selectCell(0, 1);
      await waitForNextAnimationFrames(7);

      expect(document.activeElement).toEqual(getActiveEditor().TEXTAREA);
    });
  });

  describe('`selectCells`/`selectCell` with `changeListener = false` (#10038)', () => {
    let externalInput;

    afterEach(() => {
      if (externalInput && externalInput.parentNode) {
        externalInput.parentNode.removeChild(externalInput);
      }
      externalInput = null;
    });

    it('should keep an externally focused `<input>` focused when `selectCells` is called with' +
      ' `changeListener` set to `false`', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
      });

      externalInput = document.createElement('input');
      externalInput.id = 'external-input';
      document.body.appendChild(externalInput);
      externalInput.focus();

      expect(document.activeElement).toBe(externalInput);

      const wasSelected = await selectCells([[1, 1]], true, false);

      expect(wasSelected).toBe(true);
      expect(document.activeElement).toBe(externalInput);
      expect(getSelected()).toEqual([[1, 1, 1, 1]]);
      expect(isListening()).toBe(false);
    });

    it('should keep an externally focused `<textarea>` focused when `selectCells` is called with' +
      ' `changeListener` set to `false`', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
      });

      externalInput = document.createElement('textarea');
      document.body.appendChild(externalInput);
      externalInput.focus();

      expect(document.activeElement).toBe(externalInput);

      await selectCells([[2, 2]], true, false);

      expect(document.activeElement).toBe(externalInput);
    });

    it('should keep an externally focused `<input>` focused when `selectCell` is called with' +
      ' `changeListener` set to `false`', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
      });

      externalInput = document.createElement('input');
      document.body.appendChild(externalInput);
      externalInput.focus();

      expect(document.activeElement).toBe(externalInput);

      await selectCell(3, 2, undefined, undefined, true, false);

      expect(document.activeElement).toBe(externalInput);
      expect(getSelected()).toEqual([[3, 2, 3, 2]]);
    });

    it('should not steal the external focus to the editor TEXTAREA when `imeFastEdit` is enabled and' +
      ' `selectCells` is called with `changeListener` set to `false`', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        imeFastEdit: true,
      });

      externalInput = document.createElement('input');
      document.body.appendChild(externalInput);
      externalInput.focus();

      await selectCells([[1, 1]], true, false);
      await waitForNextAnimationFrames(4);

      expect(document.activeElement).toBe(externalInput);
    });

    it('should still move browser focus to the highlighted cell when `selectCells` is called with' +
      ' the default `changeListener = true`', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
      });

      externalInput = document.createElement('input');
      document.body.appendChild(externalInput);
      externalInput.focus();

      expect(document.activeElement).toBe(externalInput);

      await selectCells([[1, 1]]);

      expect(document.activeElement).toBe(getCell(1, 1));
      expect(isListening()).toBe(true);
    });

    it('should not affect a subsequent default `selectCells` call (suspend is released after the call)', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
      });

      externalInput = document.createElement('input');
      document.body.appendChild(externalInput);
      externalInput.focus();

      await selectCells([[1, 1]], true, false);

      expect(document.activeElement).toBe(externalInput);

      await selectCells([[2, 2]]);

      expect(document.activeElement).toBe(getCell(2, 2));
    });

    it('should keep an externally focused `<select>` focused when `selectCells` is called with' +
      ' `changeListener` set to `false`', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
      });

      externalInput = document.createElement('select');
      const option = document.createElement('option');

      option.textContent = 'a';
      externalInput.appendChild(option);
      document.body.appendChild(externalInput);
      externalInput.focus();

      expect(document.activeElement).toBe(externalInput);

      await selectCells([[1, 1]], true, false);

      expect(document.activeElement).toBe(externalInput);
    });

    it('should keep an externally focused `contenteditable` element focused when `selectCells`' +
      ' is called with `changeListener` set to `false`', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
      });

      externalInput = document.createElement('div');
      externalInput.contentEditable = 'true';
      externalInput.textContent = 'editable';
      document.body.appendChild(externalInput);
      externalInput.focus();

      expect(document.activeElement).toBe(externalInput);

      await selectCells([[1, 1]], true, false);

      expect(document.activeElement).toBe(externalInput);
    });

    it('should release the suspended focus state after `selectCells` throws on malformed' +
      ' coordinates', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
      });

      externalInput = document.createElement('input');
      document.body.appendChild(externalInput);
      externalInput.focus();

      // Malformed coordinates - selectCells throws synchronously inside selection.selectCells.
      // The `try/finally` in core.selectCells must still release the focus manager suspend flag,
      // otherwise a subsequent default `selectCells` call would silently preserve external focus.
      expect(() => hot().selectCells([['not-a-number']], true, false)).toThrow();

      await selectCells([[2, 2]]);

      expect(document.activeElement).toBe(getCell(2, 2));
    });
  });
});
