import { DateEditor } from '../dateEditor';
import { TextEditor } from '../../textEditor';

describe('DateEditor', () => {
  const makeEditor = () => new DateEditor({
    rootDocument: document,
    rootElement: document.createElement('div'),
    addHook: jest.fn(),
    addHookOnce: jest.fn(),
  });

  describe('open', () => {
    beforeEach(() => {
      jest.spyOn(TextEditor.prototype, 'open').mockImplementation(() => {});
    });

    afterEach(() => {
      TextEditor.prototype.open.mockRestore();
    });

    it('shows the native picker when a double-click opens the editor', () => {
      const editor = makeEditor();

      editor.TEXTAREA.showPicker = jest.fn();
      editor.open(new MouseEvent('dblclick'));

      expect(editor.TEXTAREA.showPicker).toHaveBeenCalledTimes(1);
    });

    it('shows the native picker when the editor API opens the editor with no event', () => {
      const editor = makeEditor();

      editor.TEXTAREA.showPicker = jest.fn();
      editor.open();

      expect(editor.TEXTAREA.showPicker).toHaveBeenCalledTimes(1);
    });

    it.each(['keydown', 'keypress', 'keyup'])('keeps the picker closed when a %s event opens the editor', (type) => {
      const editor = makeEditor();

      editor.TEXTAREA.showPicker = jest.fn();
      editor.open(new KeyboardEvent(type, { key: 'Enter' }));

      expect(editor.TEXTAREA.showPicker).not.toHaveBeenCalled();
    });
  });
});
