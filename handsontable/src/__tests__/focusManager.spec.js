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
    it('should return default (very small) delay (#dev-1762)', () => {
      handsontable({});

      expect(getFocusManager().getRefocusDelay()).toBe(1);
    });
  });

  describe('`getFocusMode` method', () => {
    it('should set it\'s internal `focusMode` property to "cell" after HOT initialization with `imeFastEdit` not' +
      ' defined', () => {
      handsontable({});

      expect(getFocusManager().getFocusMode()).toEqual('cell');
    });

    it('should set it\'s internal `focusMode` property to "mixed" after HOT initialization with `imeFastEdit` enabled', () => {
      handsontable({
        imeFastEdit: true,
      });

      expect(getFocusManager().getFocusMode()).toEqual('mixed');
    });

    it('should set it\'s internal `focusMode` property to "mixed" after HOT initialization with `imeFastEdit` disabled', () => {
      handsontable({
        imeFastEdit: false,
      });

      expect(getFocusManager().getFocusMode()).toEqual('cell');
    });

    it('should update it\'s internal `focusMode` config after calling `updateSettings` containing `imeFastEdit`', () => {
      handsontable({});

      expect(getFocusManager().getFocusMode()).toEqual('cell');

      updateSettings({
        imeFastEdit: true,
      });

      expect(getFocusManager().getFocusMode()).toEqual('mixed');

      updateSettings({
        imeFastEdit: false,
      });

      expect(getFocusManager().getFocusMode()).toEqual('cell');
    });

    it('should not reset internal `focusMode` config after calling `updateSettings` with an empty object', () => {
      handsontable({
        imeFastEdit: true,
      });

      expect(getFocusManager().getFocusMode()).toEqual('mixed');

      updateSettings({});

      expect(getFocusManager().getFocusMode()).toEqual('mixed');
    });

    it('should be able to get and set the current `focusMode` with appropriate API options', () => {
      handsontable({});

      expect(getFocusManager().getFocusMode()).toEqual('cell');

      getFocusManager().setFocusMode('mixed');

      expect(getFocusManager().getFocusMode()).toEqual('mixed');
    });

    it('should display a warning when trying to set an invalid `focusMode`', () => {
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

      await sleep(50);

      expect(spy.test.calls.count()).toBe(0);

      window.onerror = prevError;
    });

    it('should focus the element provided in the argument', () => {
      handsontable({});
      selectCell(0, 0);

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
      selectCell(0, 0);

      await sleep(100);

      expect(document.activeElement).toEqual(getActiveEditor().TEXTAREA);

      selectCell(0, 1);

      await sleep(100);

      expect(document.activeElement).toEqual(getActiveEditor().TEXTAREA);
    });
  });
});
