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
        it(`if ${key} was pressed`, () => {
          handsontable();

          selectCell(0, 0);

          const activeEditor = getActiveEditor();

          keyDownUp(key);

          expect(activeEditor.isOpened()).toBe(true);
        });
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
        it(`if ${key} was pressed`, () => {
          handsontable();

          selectCell(0, 0);

          const activeEditor = getActiveEditor();

          keyDownUp(key);

          expect(activeEditor.isOpened()).toBe(false);
        });
      });
    });
  });
});
