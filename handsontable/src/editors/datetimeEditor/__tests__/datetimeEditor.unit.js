import { DatetimeEditor } from '../datetimeEditor';

describe('DatetimeEditor value normalization', () => {
  const makeEditor = () => {
    const editor = Object.create(DatetimeEditor.prototype);

    Object.defineProperty(editor, 'TEXTAREA', { value: { value: '' }, writable: true });
    editor.cellProperties = {};

    return editor;
  };

  it('exposes the datetime EDITOR_TYPE', () => {
    expect(DatetimeEditor.EDITOR_TYPE).toBe('datetime');
  });

  it('getValue pads HH:mm to HH:mm:ss', () => {
    const editor = makeEditor();

    editor.TEXTAREA.value = '2024-03-16T09:00';
    expect(editor.getValue()).toBe('2024-03-16T09:00:00');

    editor.TEXTAREA.value = '2024-03-16T09:00:30';
    expect(editor.getValue()).toBe('2024-03-16T09:00:30');
  });

  it('setValue converts a space separator to T for the native input', () => {
    const editor = makeEditor();

    editor.setValue('2024-03-16 09:00:00');
    expect(editor.TEXTAREA.value).toBe('2024-03-16T09:00:00');
  });

  it('setValue pads a date-only value to midnight', () => {
    const editor = makeEditor();

    editor.setValue('2024-06-01');
    expect(editor.TEXTAREA.value).toBe('2024-06-01T00:00:00');
  });

  it('setValue pads a seconds-less value to HH:mm:ss', () => {
    const editor = makeEditor();

    editor.setValue('2024-06-01T08:15');
    expect(editor.TEXTAREA.value).toBe('2024-06-01T08:15:00');
  });

  it('setValue strips milliseconds the native input cannot represent', () => {
    const editor = makeEditor();

    editor.setValue('2024-06-01T08:15:30.500');
    expect(editor.TEXTAREA.value).toBe('2024-06-01T08:15:30');
  });

  it('setValue clears an empty value', () => {
    const editor = makeEditor();

    editor.TEXTAREA.value = 'stale';
    editor.setValue('');
    expect(editor.TEXTAREA.value).toBe('');
  });

  it('setValue rejects an invalid value and clears the input', () => {
    const editor = makeEditor();

    editor.TEXTAREA.value = 'stale';
    editor.setValue('not-a-date');
    expect(editor.TEXTAREA.value).toBe('');
  });
});
