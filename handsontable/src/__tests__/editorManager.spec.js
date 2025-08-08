describe('editorManager', () => {
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

  describe('function keys', () => {
    describe('should begin editing', () => {
      [
        'enter',
        'f2',
      ].forEach((key) => {
        it(`if ${key} was pressed`, async() => {
          handsontable();

          await selectCell(1, 2);

          const activeEditor = getActiveEditor();

          await keyDownUp(key);

          expect(activeEditor.isOpened()).toBe(true);
          expect(activeEditor.row).toBe(1);
          expect(activeEditor.col).toBe(2);
        });
      });

      it('should begin editing correct cell when focus is moved to the next selection layer', async() => {
        handsontable();

        await selectCells([
          [0, 0, 1, 1],
          [2, 2, 3, 3],
        ]);

        await keyDownUp(['shift', 'tab']);
        await keyDownUp(['shift', 'tab']); // move focus to the previous layer
        await keyDownUp('f2');

        const activeEditor = getActiveEditor();

        expect(activeEditor.isOpened()).toBe(true);
        expect(activeEditor.row).toBe(1);
        expect(activeEditor.col).toBe(0);
      });
    });

    describe('should not begin editing', () => {
      [
        'alt',
        'arrowdown',
        'arrowleft',
        'arrowright',
        'arrowup',
        'audiodown',
        'audiomute',
        'audioup',
        'backspace',
        'capslock',
        'delete',
        'end',
        'escape',
        'f1',
        'f3',
        'f4',
        'f5',
        'f6',
        'f7',
        'f8',
        'f9',
        'f10',
        'f11',
        'f12',
        'f13',
        'f14',
        'f15',
        'f16',
        'f17',
        'f18',
        'f19',
        'home',
        'insert',
        'medianext',
        'mediaplaypause',
        'mediaprev',
        'mediastop',
        'null',
        'numlock',
        'pagedown',
        'pageup',
        'pause',
        'scrolllock',
        'shift',
        'tab',
      ].forEach((key) => {
        it(`if ${key} was pressed`, async() => {
          handsontable();

          await selectCell(0, 0);

          const activeEditor = getActiveEditor();

          await keyDownUp(key);

          expect(activeEditor.isOpened()).toBe(false);
        });
      });
    });

    using('shortcut key', [
      ['f2'],
      ['backspace'],
      ['delete'],
      ['enter'],
      ['enter', 'shift']
    ], (shortcutKey) => {
      it('should not throw an error when pressed in case when the table is not selected', async() => {
        handsontable();

        await selectCell(0, 0);
        await deselectCell(0, 0);

        expect(async() => {
          await keyDownUp(shortcutKey);
        }).not.toThrowError();
      });
    });
  });
});
