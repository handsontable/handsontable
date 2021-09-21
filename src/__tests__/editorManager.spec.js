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
        'ENTER',
        'F2',
      ].forEach((key) => {
        it(`if ${key} was pressed`, () => {
          handsontable();

          selectCell(0, 0);

          const activeEditor = getActiveEditor();

          keyDownUp(key.toLowerCase());

          expect(activeEditor.isOpened()).toBe(true);
        });
      });
    });

    describe('should not begin editing', () => {
      [
        'ALT',
        'ARROW_DOWN',
        'ARROW_LEFT',
        'ARROW_RIGHT',
        'ARROW_UP',
        'AUDIO_DOWN',
        'AUDIO_MUTE',
        'AUDIO_UP',
        'BACKSPACE',
        'CAPS_LOCK',
        'DELETE',
        'END',
        'ESCAPE',
        'F1',
        'F3',
        'F4',
        'F5',
        'F6',
        'F7',
        'F8',
        'F9',
        'F10',
        'F11',
        'F12',
        'F13',
        'F14',
        'F15',
        'F16',
        'F17',
        'F18',
        'F19',
        'HOME',
        'INSERT',
        'MEDIA_NEXT',
        'MEDIA_PLAY_PAUSE',
        'MEDIA_PREV',
        'MEDIA_STOP',
        'NULL',
        'NUM_LOCK',
        'PAGE_DOWN',
        'PAGE_UP',
        'PAUSE',
        'SCROLL_LOCK',
        'SHIFT',
        'TAB',
      ].forEach((key) => {
        it(`if ${key} was pressed`, () => {
          handsontable();

          selectCell(0, 0);

          const activeEditor = getActiveEditor();

          keyDownUp(key.toLowerCase());

          expect(activeEditor.isOpened()).toBe(false);
        });
      });
    });
  });
});
