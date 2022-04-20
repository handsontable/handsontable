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
    it('should exceed the editor height only for one line', () => {
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
  });

  describe('"Enter + Control"', () => {
    it('should exceed the editor height only for one line', () => {
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
  });

  describe('"Enter + Command"', () => {
    it('should exceed the editor height only for one line', () => {
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
    it('should move the selection to the first cell in a row while cell editing', () => {
      handsontable({
        startRows: 5,
        startCols: 5
      });

      selectCell(2, 0);
      keyDownUp('enter');
      keyDownUp(['shift', 'pageup']);

      expect(getSelected()).toEqual([[0, 0, 0, 0]]);
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
    it('should move the selection to the last cell in a row while cell editing', () => {
      handsontable({
        startRows: 5,
        startCols: 5
      });

      selectCell(2, 0);
      keyDownUp('enter');
      keyDownUp(['shift', 'pagedown']);

      expect(getSelected()).toEqual([[4, 0, 4, 0]]);
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
    it('should undo the last change in editor', () => {
      handsontable({
        data: [['Ferrari']],
      });

      selectCell(0, 0);
      keyDownUp('enter');

      document.execCommand('insertText', false, 'F1');
      document.execCommand('undo', false);

      expect(getActiveEditor().getValue()).toBe('Ferrari');
    });

    it('should update editor\'s height after undo the last change', async() => {
      handsontable({
        data: [['Ferrari']],
      });

      selectCell(0, 0);
      keyDownUp('enter');

      keyDownUp(['control/meta', 'enter']);
      keyDownUp(['control/meta', 'enter']);
      keyDownUp(['control/meta', 'enter']);

      expect($(getActiveEditor().TEXTAREA).height()).toBe(84);

      document.execCommand('undo', false);
      keyDownUp(['control/meta', 'z']);

      await sleep(50);

      expect($(getActiveEditor().TEXTAREA).height()).toBe(63);
    });

    // potentially unstable test
    it('should undo the last change in editor for multiline text', () => {
      handsontable({
        data: [['Ferrari']],
      });

      selectCell(0, 0);
      keyDownUp('enter');

      keyDownUp(['control/meta', 'enter']);
      document.execCommand('insertText', false, 'F1');
      keyDownUp(['control/meta', 'enter']);
      keyDownUp(['control/meta', 'enter']);
      document.execCommand('undo', false);

      // the native undo works differently on Safari do happy test
      if (Handsontable.helper.isSafari()) {
        expect(true).toBe(true);

      } else {
        expect(getActiveEditor().getValue()).toBe('Ferrari\nF1\n');

        document.execCommand('undo', false);

        expect(getActiveEditor().getValue()).toBe('Ferrari\nF1');

        document.execCommand('undo', false);

        expect(getActiveEditor().getValue()).toBe('Ferrari\n');

        document.execCommand('undo', false);

        expect(getActiveEditor().getValue()).toBe('Ferrari');
      }
    });
  });

  describe('"Z + Shift + Cmd/Ctrl"', () => {
    it('should redo the last change in editor', () => {
      handsontable({
        data: [['Ferrari']],
      });

      selectCell(0, 0);
      keyDownUp('enter');

      document.execCommand('insertText', false, 'F1');
      document.execCommand('undo', false);
      document.execCommand('redo', false);

      expect(getActiveEditor().getValue()).toBe('FerrariF1');
    });

    it('should update editor\'s height after redo the last change', async() => {
      handsontable({
        data: [['Ferrari']],
      });

      selectCell(0, 0);
      keyDownUp('enter');

      keyDownUp(['control/meta', 'enter']);
      keyDownUp(['control/meta', 'enter']);
      keyDownUp(['control/meta', 'enter']);

      document.execCommand('undo', false);

      await sleep(50);

      expect($(getActiveEditor().TEXTAREA).height()).toBe(63);

      await sleep(50);

      document.execCommand('redo', false);
      keyDownUp(['control/meta', 'shift', 'z']);

      expect($(getActiveEditor().TEXTAREA).height()).toBe(84);
    });

    // potentially unstable test
    it('should undo the last change in editor for multiline text', () => {
      handsontable({
        data: [['Ferrari']],
      });

      selectCell(0, 0);
      keyDownUp('enter');

      keyDownUp(['control/meta', 'enter']);
      document.execCommand('insertText', false, 'F1');
      keyDownUp(['control/meta', 'enter']);
      keyDownUp(['control/meta', 'enter']);
      document.execCommand('undo', false);
      document.execCommand('undo', false);
      document.execCommand('undo', false);
      document.execCommand('undo', false);

      expect(getActiveEditor().getValue()).toBe('Ferrari');

      document.execCommand('redo', false);

      // the native redo works differently on Safari do happy test
      if (Handsontable.helper.isSafari()) {
        expect(true).toBe(true);

      } else {
        expect(getActiveEditor().getValue()).toBe('Ferrari\n');

        document.execCommand('redo', false);

        expect(getActiveEditor().getValue()).toBe('Ferrari\nF1');

        document.execCommand('redo', false);

        expect(getActiveEditor().getValue()).toBe('Ferrari\nF1\n');
      }
    });
  });
});
