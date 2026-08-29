import { IntlDatetimeEditor } from '../intlDatetimeEditor';
import { TextEditor } from '../../textEditor';

describe('IntlDatetimeEditor', () => {
  const makeHotMock = () => ({
    rootDocument: document,
    rootElement: document.createElement('div'),
    addHook: jest.fn(),
    addHookOnce: jest.fn(),
    toPhysicalRow: jest.fn(visualRow => visualRow + 10),
    getSourceDataAtCell: jest.fn(() => '2024-03-16T09:00:00'),
  });

  const makeEditor = (hotMock = makeHotMock()) => new IntlDatetimeEditor(hotMock);

  it('exposes the intl-datetime EDITOR_TYPE', () => {
    expect(IntlDatetimeEditor.EDITOR_TYPE).toBe('intl-datetime');
  });

  describe('createElements', () => {
    it('creates a native datetime-local input with seconds precision and LTR direction', () => {
      const editor = makeEditor();

      expect(editor.TEXTAREA.tagName).toBe('INPUT');
      expect(editor.TEXTAREA.getAttribute('type')).toBe('datetime-local');
      expect(editor.TEXTAREA.getAttribute('step')).toBe('1');
      expect(editor.TEXTAREA.getAttribute('dir')).toBe('ltr');
    });
  });

  describe('init', () => {
    it('registers an afterSetTheme hook that closes the editor on theme change', () => {
      const hotMock = makeHotMock();
      const editor = makeEditor(hotMock);
      const afterSetThemeCall = hotMock.addHook.mock.calls.find(([hookName]) => hookName === 'afterSetTheme');

      expect(afterSetThemeCall).toBeDefined();

      const hookCallback = afterSetThemeCall[1];
      const closeSpy = jest.spyOn(editor, 'close').mockImplementation(() => {});

      hookCallback('main', true);
      expect(closeSpy).not.toHaveBeenCalled();

      hookCallback('horizon', false);
      expect(closeSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('prepare', () => {
    it('replaces the formatted display value with the raw ISO source data', () => {
      const hotMock = makeHotMock();
      const editor = makeEditor(hotMock);
      const td = document.createElement('td');

      editor.prepare(2, 0, 0, td, '03/16/2024, 09:00:00', { readOnly: true });

      expect(hotMock.toPhysicalRow).toHaveBeenCalledWith(2);
      expect(hotMock.getSourceDataAtCell).toHaveBeenCalledWith(12, 0);
      expect(editor.originalValue).toBe('2024-03-16T09:00:00');
    });
  });

  describe('open', () => {
    it('invokes the native picker via showPicker()', () => {
      const editor = makeEditor();
      const showPickerSpy = jest.fn();

      jest.spyOn(TextEditor.prototype, 'open').mockImplementation(() => {});
      editor.TEXTAREA.showPicker = showPickerSpy;

      editor.open();

      expect(showPickerSpy).toHaveBeenCalledTimes(1);

      TextEditor.prototype.open.mockRestore();
    });

    it('swallows showPicker() user-gesture errors', () => {
      const editor = makeEditor();

      jest.spyOn(TextEditor.prototype, 'open').mockImplementation(() => {});
      editor.TEXTAREA.showPicker = jest.fn(() => {
        throw new Error('showPicker() requires a user gesture');
      });

      expect(() => editor.open()).not.toThrow();

      TextEditor.prototype.open.mockRestore();
    });
  });

  describe('value normalization', () => {
    // jsdom's datetime-local value sanitizer rewrites assigned values in a nonstandard way
    // (e.g. appends `.000`), so these string-normalization tests use a plain object in place of
    // the input element. The real-input path is covered by the Playwright E2E suite.
    const makeNormalizationEditor = () => {
      const editor = makeEditor();

      editor.TEXTAREA = { value: '' };

      return editor;
    };

    it('getValue pads HH:mm to HH:mm:ss', () => {
      const editor = makeNormalizationEditor();

      editor.TEXTAREA.value = '2024-03-16T09:00';
      expect(editor.getValue()).toBe('2024-03-16T09:00:00');

      editor.TEXTAREA.value = '2024-03-16T09:00:30';
      expect(editor.getValue()).toBe('2024-03-16T09:00:30');
    });

    it('setValue converts a space separator to T for the native input', () => {
      const editor = makeNormalizationEditor();

      editor.setValue('2024-03-16 09:00:00');
      expect(editor.TEXTAREA.value).toBe('2024-03-16T09:00:00');
    });

    it('setValue pads a date-only value to midnight', () => {
      const editor = makeNormalizationEditor();

      editor.setValue('2024-06-01');
      expect(editor.TEXTAREA.value).toBe('2024-06-01T00:00:00');
    });

    it('setValue pads a seconds-less value to HH:mm:ss', () => {
      const editor = makeNormalizationEditor();

      editor.setValue('2024-06-01T08:15');
      expect(editor.TEXTAREA.value).toBe('2024-06-01T08:15:00');
    });

    it('setValue strips milliseconds the native input cannot represent', () => {
      const editor = makeNormalizationEditor();

      editor.setValue('2024-06-01T08:15:30.500');
      expect(editor.TEXTAREA.value).toBe('2024-06-01T08:15:30');
    });

    it('setValue clears an empty value', () => {
      const editor = makeNormalizationEditor();

      editor.TEXTAREA.value = 'stale';
      editor.setValue('');
      expect(editor.TEXTAREA.value).toBe('');
    });

    it('setValue rejects an invalid value and clears the input', () => {
      const editor = makeNormalizationEditor();

      editor.TEXTAREA.value = 'stale';
      editor.setValue('not-a-date');
      expect(editor.TEXTAREA.value).toBe('');
    });
  });
});
