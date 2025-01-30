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
    it('should move the caret position to the beginning of the line', () => {
      handsontable({
        data: [
          ['Maserati', 'Mazda'],
          ['Honda', 'Mini']
        ],
      });

      selectCell(0, 0);
      keyDownUp('enter');

      const editorElement = getActiveEditor().TEXTAREA;

      Handsontable.dom.setCaretPosition(editorElement, 2);

      keyDownUp('home');

      expect(Handsontable.dom.getCaretPosition(editorElement)).toBe(0);
    });
  });

  describe('"End"', () => {
    it('should move the caret position to the end of the line', () => {
      handsontable({
        data: [
          ['Maserati', 'Mazda'],
          ['Honda', 'Mini']
        ],
      });

      selectCell(0, 0);
      keyDownUp('enter');

      const editorElement = getActiveEditor().TEXTAREA;

      Handsontable.dom.setCaretPosition(editorElement, 2);

      keyDownUp('end');

      expect(Handsontable.dom.getCaretPosition(editorElement)).toBe(8);
    });
  });

  describe('"Enter + Alt"', () => {
    it.forTheme('classic')('should exceed the editor height only for one line', () => {
      const hot = handsontable({
        data: [
          ['Maserati', 'Mazda'],
          ['Honda', 'Mini']
        ]
      });

      selectCell(0, 0);
      keyDownUp('enter');
      keyDownUp(['alt', 'enter']);

      const editorTextarea = hot.getActiveEditor().TEXTAREA;
      const editorComputedStyle = getComputedStyle(editorTextarea);
      const editorTextareaLineHeight = parseInt(editorComputedStyle.lineHeight, 10);
      const editorTextareaHeight = parseInt(editorComputedStyle.height, 10);

      expect(editorTextareaHeight).toBe(2 * editorTextareaLineHeight);
    });

    it.forTheme('main')('should exceed the editor height only for one line', () => {
      const hot = handsontable({
        data: [
          ['Maserati', 'Mazda'],
          ['Honda', 'Mini']
        ]
      });

      selectCell(0, 0);
      keyDownUp('enter');
      keyDownUp(['alt', 'enter']);

      const editorTextarea = hot.getActiveEditor().TEXTAREA;
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
    it.forTheme('classic')('should exceed the editor height only for one line', () => {
      const hot = handsontable({
        data: [
          ['Maserati', 'Mazda'],
          ['Honda', 'Mini']
        ]
      });

      selectCell(0, 0);
      keyDownUp('enter');
      keyDownUp(['control', 'enter']);

      const editorTextarea = hot.getActiveEditor().TEXTAREA;
      const editorComputedStyle = getComputedStyle(editorTextarea);
      const editorTextareaLineHeight = parseInt(editorComputedStyle.lineHeight, 10);
      const editorTextareaHeight = parseInt(editorComputedStyle.height, 10);

      expect(editorTextareaHeight).toBe(2 * editorTextareaLineHeight);
    });

    it.forTheme('main')('should exceed the editor height only for one line', () => {
      const hot = handsontable({
        data: [
          ['Maserati', 'Mazda'],
          ['Honda', 'Mini']
        ]
      });

      selectCell(0, 0);
      keyDownUp('enter');
      keyDownUp(['control', 'enter']);

      const editorTextarea = hot.getActiveEditor().TEXTAREA;
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
    it.forTheme('classic')('should exceed the editor height only for one line', () => {
      const hot = handsontable({
        data: [
          ['Maserati', 'Mazda'],
          ['Honda', 'Mini']
        ]
      });

      selectCell(0, 0);
      keyDownUp('enter');
      keyDownUp(['meta', 'enter']);

      const editorTextarea = hot.getActiveEditor().TEXTAREA;
      const editorComputedStyle = getComputedStyle(editorTextarea);
      const editorTextareaLineHeight = parseInt(editorComputedStyle.lineHeight, 10);
      const editorTextareaHeight = parseInt(editorComputedStyle.height, 10);

      expect(editorTextareaHeight).toBe(2 * editorTextareaLineHeight);
    });

    it.forTheme('main')('should exceed the editor height only for one line', () => {
      const hot = handsontable({
        data: [
          ['Maserati', 'Mazda'],
          ['Honda', 'Mini']
        ]
      });

      selectCell(0, 0);
      keyDownUp('enter');
      keyDownUp(['meta', 'enter']);

      const editorTextarea = hot.getActiveEditor().TEXTAREA;
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

  describe('"PageUp"', () => {
    it('should move the selection to the first cell in a row while cell editing', () => {
      handsontable({
        startRows: 5,
        startCols: 5
      });

      selectCell(2, 0);
      keyDownUp('enter');
      keyDownUp('pageup');

      expect(getSelected()).toEqual([[0, 0, 0, 0]]);
    });
  });

  describe('"PageUp + Shift"', () => {
    it('should not move the selection while cell editing', () => {
      handsontable({
        startRows: 5,
        startCols: 5
      });

      selectCell(2, 0);
      keyDownUp('enter');
      keyDownUp(['shift', 'pageup']);

      expect(getActiveEditor().isOpened()).toBe(true);
      expect(getSelected()).toEqual([[2, 0, 2, 0]]);
    });
  });

  describe('"PageDown"', () => {
    it('should move the selection to the last cell in a row while cell editing', () => {
      handsontable({
        startRows: 5,
        startCols: 5
      });

      selectCell(2, 0);
      keyDownUp('enter');
      keyDownUp('pagedown');

      expect(getSelected()).toEqual([[4, 0, 4, 0]]);
    });
  });

  describe('"PageDown + Shift"', () => {
    it('should not move the selection while cell editing', () => {
      handsontable({
        startRows: 5,
        startCols: 5
      });

      selectCell(2, 0);
      keyDownUp('enter');
      keyDownUp(['shift', 'pagedown']);

      expect(getActiveEditor().isOpened()).toBe(true);
      expect(getSelected()).toEqual([[2, 0, 2, 0]]);
    });
  });

  describe('"Tab"', () => {
    it('should move the selection to the next cell in the a while cell editing', () => {
      handsontable({
        startRows: 5,
        startCols: 5
      });

      selectCell(2, 0);
      keyDownUp('enter');
      keyDownUp('tab');

      expect(getSelected()).toEqual([[2, 1, 2, 1]]);
    });
  });

  describe('"Tab + Shift"', () => {
    it('should move the selection to the previous cell in a row while cell editing', () => {
      handsontable({
        startRows: 5,
        startCols: 5
      });

      selectCell(2, 2);
      keyDownUp('enter');
      keyDownUp(['shift', 'tab']);

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
