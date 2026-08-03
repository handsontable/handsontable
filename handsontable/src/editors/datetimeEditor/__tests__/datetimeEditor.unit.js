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
});
