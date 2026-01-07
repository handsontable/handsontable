describe('TextEditor keyboard shortcut', () => {
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

  describe('"Home"', () => {
    it('should move the caret position to the beginning of the line', async() => {
      handsontable({
        data: [
          ['Maserati', 'Mazda'],
          ['Honda', 'Mini']
        ],
      });

      await selectCell(0, 0);
      await keyDownUp('enter');

      const editorElement = getActiveEditor().TEXTAREA;

      Handsontable.dom.setCaretPosition(editorElement, 2);

      await keyDownUp('home');

      expect(Handsontable.dom.getCaretPosition(editorElement)).toBe(0);
    });
  });

  describe('"End"', () => {
    it('should move the caret position to the end of the line', async() => {
      handsontable({
        data: [
          ['Maserati', 'Mazda'],
          ['Honda', 'Mini']
        ],
      });

      await selectCell(0, 0);
      await keyDownUp('enter');

      const editorElement = getActiveEditor().TEXTAREA;

      Handsontable.dom.setCaretPosition(editorElement, 2);

      await keyDownUp('end');

      expect(Handsontable.dom.getCaretPosition(editorElement)).toBe(8);
    });
  });

  describe('"Enter + Alt"', () => {
    it.forTheme('classic')('should exceed the editor height only for one line', async() => {
      handsontable({
        data: [
          ['Maserati', 'Mazda'],
          ['Honda', 'Mini']
        ]
      });

      await selectCell(0, 0);
      await keyDownUp('enter');
      await keyDownUp(['alt', 'enter']);

      const editorTextarea = getActiveEditor().TEXTAREA;
      const editorComputedStyle = getComputedStyle(editorTextarea);
      const editorTextareaLineHeight = parseInt(editorComputedStyle.lineHeight, 10);
      const editorTextareaHeight = parseInt(editorComputedStyle.height, 10);

      expect(editorTextareaHeight).toBe(2 * editorTextareaLineHeight);
    });

    it.forTheme('main')('should exceed the editor height only for one line', async() => {
      handsontable({
        data: [
          ['Maserati', 'Mazda'],
          ['Honda', 'Mini']
        ]
      });

      await selectCell(0, 0);
      await keyDownUp('enter');
      await keyDownUp(['alt', 'enter']);

      const editorTextarea = getActiveEditor().TEXTAREA;
      const editorComputedStyle = getComputedStyle(editorTextarea);
      const editorTextareaLineHeight = parseInt(editorComputedStyle.lineHeight, 10);
      const editorTextareaTopPadding = parseInt(editorComputedStyle.paddingTop, 10);
      const editorTextareaBottomPadding = parseInt(editorComputedStyle.paddingBottom, 10);
      const editorTextareaHeight = parseInt(editorComputedStyle.height, 10);

      expect(editorTextareaHeight).toBe(
        (2 * editorTextareaLineHeight)
        + editorTextareaTopPadding
        + editorTextareaBottomPadding
        - 1 // Subtracted by the `autoResize` plugin, not sure why.
      );
    });

    it.forTheme('horizon')('should exceed the editor height only for one line', async() => {
      handsontable({
        data: [
          ['Maserati', 'Mazda'],
          ['Honda', 'Mini']
        ]
      });

      await selectCell(0, 0);
      await keyDownUp('enter');
      await keyDownUp(['alt', 'enter']);

      const editorTextarea = getActiveEditor().TEXTAREA;
      const editorComputedStyle = getComputedStyle(editorTextarea);
      const editorTextareaLineHeight = parseInt(editorComputedStyle.lineHeight, 10);
      const editorTextareaTopPadding = parseInt(editorComputedStyle.paddingTop, 10);
      const editorTextareaBottomPadding = parseInt(editorComputedStyle.paddingBottom, 10);
      const editorTextareaHeight = parseInt(editorComputedStyle.height, 10);

      expect(editorTextareaHeight).toBe(
        (2 * editorTextareaLineHeight)
        + editorTextareaTopPadding
        + editorTextareaBottomPadding
        - 1 // Subtracted by the `autoResize` plugin, not sure why.
      );
    });
  });

  describe('"Enter + Control"', () => {
    it.forTheme('classic')('should exceed the editor height only for one line', async() => {
      handsontable({
        data: [
          ['Maserati', 'Mazda'],
          ['Honda', 'Mini']
        ]
      });

      await selectCell(0, 0);
      await keyDownUp('enter');
      await keyDownUp(['control', 'enter']);

      const editorTextarea = getActiveEditor().TEXTAREA;
      const editorComputedStyle = getComputedStyle(editorTextarea);
      const editorTextareaLineHeight = parseInt(editorComputedStyle.lineHeight, 10);
      const editorTextareaHeight = parseInt(editorComputedStyle.height, 10);

      expect(editorTextareaHeight).toBe(2 * editorTextareaLineHeight);
    });

    it.forTheme('main')('should exceed the editor height only for one line', async() => {
      handsontable({
        data: [
          ['Maserati', 'Mazda'],
          ['Honda', 'Mini']
        ]
      });

      await selectCell(0, 0);
      await keyDownUp('enter');
      await keyDownUp(['control', 'enter']);

      const editorTextarea = getActiveEditor().TEXTAREA;
      const editorComputedStyle = getComputedStyle(editorTextarea);
      const editorTextareaLineHeight = parseInt(editorComputedStyle.lineHeight, 10);
      const editorTextareaPaddingTop = parseInt(editorComputedStyle.paddingTop, 10);
      const editorTextareaPaddingBottom = parseInt(editorComputedStyle.paddingBottom, 10);
      const editorTextareaHeight = parseInt(editorComputedStyle.height, 10);

      expect(editorTextareaHeight).toBe(
        (2 * editorTextareaLineHeight)
        + editorTextareaPaddingTop
        + editorTextareaPaddingBottom
        - 1 // Subtracted by the `autoResize` plugin, not sure why.
      );
    });

    it.forTheme('horizon')('should exceed the editor height only for one line', async() => {
      handsontable({
        data: [
          ['Maserati', 'Mazda'],
          ['Honda', 'Mini']
        ]
      });

      await selectCell(0, 0);
      await keyDownUp('enter');
      await keyDownUp(['control', 'enter']);

      const editorTextarea = getActiveEditor().TEXTAREA;
      const editorComputedStyle = getComputedStyle(editorTextarea);
      const editorTextareaLineHeight = parseInt(editorComputedStyle.lineHeight, 10);
      const editorTextareaPaddingTop = parseInt(editorComputedStyle.paddingTop, 10);
      const editorTextareaPaddingBottom = parseInt(editorComputedStyle.paddingBottom, 10);
      const editorTextareaHeight = parseInt(editorComputedStyle.height, 10);

      expect(editorTextareaHeight).toBe(
        (2 * editorTextareaLineHeight)
        + editorTextareaPaddingTop
        + editorTextareaPaddingBottom
        - 1 // Subtracted by the `autoResize` plugin, not sure why.
      );
    });
  });

  describe('"Enter + Command"', () => {
    it.forTheme('classic')('should exceed the editor height only for one line', async() => {
      handsontable({
        data: [
          ['Maserati', 'Mazda'],
          ['Honda', 'Mini']
        ]
      });

      await selectCell(0, 0);
      await keyDownUp('enter');
      await keyDownUp(['meta', 'enter']);

      const editorTextarea = getActiveEditor().TEXTAREA;
      const editorComputedStyle = getComputedStyle(editorTextarea);
      const editorTextareaLineHeight = parseInt(editorComputedStyle.lineHeight, 10);
      const editorTextareaHeight = parseInt(editorComputedStyle.height, 10);

      expect(editorTextareaHeight).toBe(2 * editorTextareaLineHeight);
    });

    it.forTheme('main')('should exceed the editor height only for one line', async() => {
      handsontable({
        data: [
          ['Maserati', 'Mazda'],
          ['Honda', 'Mini']
        ]
      });

      await selectCell(0, 0);
      await keyDownUp('enter');
      await keyDownUp(['meta', 'enter']);

      const editorTextarea = getActiveEditor().TEXTAREA;
      const editorComputedStyle = getComputedStyle(editorTextarea);
      const editorTextareaLineHeight = parseInt(editorComputedStyle.lineHeight, 10);
      const editorTextareaPaddingTop = parseInt(editorComputedStyle.paddingTop, 10);
      const editorTextareaPaddingBottom = parseInt(editorComputedStyle.paddingBottom, 10);
      const editorTextareaHeight = parseInt(editorComputedStyle.height, 10);

      expect(editorTextareaHeight).toBe(
        (2 * editorTextareaLineHeight)
        + editorTextareaPaddingTop
        + editorTextareaPaddingBottom
        - 1 // Subtracted by the `autoResize` plugin, not sure why.
      );
    });

    it.forTheme('horizon')('should exceed the editor height only for one line', async() => {
      handsontable({
        data: [
          ['Maserati', 'Mazda'],
          ['Honda', 'Mini']
        ]
      });

      await selectCell(0, 0);
      await keyDownUp('enter');
      await keyDownUp(['meta', 'enter']);

      const editorTextarea = getActiveEditor().TEXTAREA;
      const editorComputedStyle = getComputedStyle(editorTextarea);
      const editorTextareaLineHeight = parseInt(editorComputedStyle.lineHeight, 10);
      const editorTextareaPaddingTop = parseInt(editorComputedStyle.paddingTop, 10);
      const editorTextareaPaddingBottom = parseInt(editorComputedStyle.paddingBottom, 10);
      const editorTextareaHeight = parseInt(editorComputedStyle.height, 10);

      expect(editorTextareaHeight).toBe(
        (2 * editorTextareaLineHeight)
        + editorTextareaPaddingTop
        + editorTextareaPaddingBottom
        - 1 // Subtracted by the `autoResize` plugin, not sure why.
      );
    });

    it('should do nothing when no selection is present', async() => {
      handsontable({
        startRows: 5,
        startCols: 5
      });

      await listen();
      await keyDownUp(['meta', 'enter']);

      expect(getSelectedRange()).toBeUndefined();
      expect(getActiveEditor()).toBeUndefined();
    });
  });

  describe('"PageUp"', () => {
    it('should move the selection to the first cell in a row while cell editing', async() => {
      handsontable({
        startRows: 5,
        startCols: 5
      });

      await selectCell(2, 0);
      await keyDownUp('enter');
      await keyDownUp('pageup');

      expect(getSelected()).toEqual([[0, 0, 0, 0]]);
    });
  });

  describe('"PageUp + Shift"', () => {
    it('should not move the selection while cell editing', async() => {
      handsontable({
        startRows: 5,
        startCols: 5
      });

      await selectCell(2, 0);
      await keyDownUp('enter');
      await keyDownUp(['shift', 'pageup']);

      expect(getActiveEditor().isOpened()).toBe(true);
      expect(getSelected()).toEqual([[2, 0, 2, 0]]);
    });
  });

  describe('"PageDown"', () => {
    it('should move the selection to the last cell in a row while cell editing', async() => {
      handsontable({
        startRows: 5,
        startCols: 5
      });

      await selectCell(2, 0);
      await keyDownUp('enter');
      await keyDownUp('pagedown');

      expect(getSelected()).toEqual([[4, 0, 4, 0]]);
    });
  });

  describe('"PageDown + Shift"', () => {
    it('should not move the selection while cell editing', async() => {
      handsontable({
        startRows: 5,
        startCols: 5
      });

      await selectCell(2, 0);
      await keyDownUp('enter');
      await keyDownUp(['shift', 'pagedown']);

      expect(getActiveEditor().isOpened()).toBe(true);
      expect(getSelected()).toEqual([[2, 0, 2, 0]]);
    });
  });

  describe('"Tab"', () => {
    it('should move the selection to the next cell in the a while cell editing', async() => {
      handsontable({
        startRows: 5,
        startCols: 5
      });

      await selectCell(2, 0);
      await keyDownUp('enter');
      await keyDownUp('tab');

      expect(getSelected()).toEqual([[2, 1, 2, 1]]);
    });
  });

  describe('"Tab + Shift"', () => {
    it('should move the selection to the previous cell in a row while cell editing', async() => {
      handsontable({
        startRows: 5,
        startCols: 5
      });

      await selectCell(2, 2);
      await keyDownUp('enter');
      await keyDownUp(['shift', 'tab']);

      expect(getSelected()).toEqual([[2, 1, 2, 1]]);
    });
  });

  describe('"Z + Cmd/Ctrl"', () => {
    // Moved tests to the visual ones
    // https://github.com/handsontable/handsontable/blob/develop/visual-tests/tests/editors/textEditor/undo.spec.ts
    // https://github.com/handsontable/handsontable/blob/develop/visual-tests/tests/editors/textEditor/undo-multiline-text.spec.ts
  });

  describe('"Z + Shift + Cmd/Ctrl"', () => {
    // Moved tests to the visual ones
    // https://github.com/handsontable/handsontable/blob/develop/visual-tests/tests/editors/textEditor/redo.spec.ts
    // https://github.com/handsontable/handsontable/blob/develop/visual-tests/tests/editors/textEditor/redo-multiline-text.spec.ts
  });
});
