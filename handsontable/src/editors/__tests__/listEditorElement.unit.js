import { TextEditor } from '../textEditor';
import { HandsontableEditor } from '../handsontableEditor';
import { AutocompleteEditor } from '../autocompleteEditor';
import { DropdownEditor } from '../dropdownEditor';

/**
 * The list editors edit in a single-line `<input type="text">` (ARIA in HTML forbids `role="combobox"` on a
 * textarea), while the text editor keeps its `<textarea>`. The field keeps the attributes and the place the
 * textarea had, and the property that holds it keeps its `TEXTAREA` name.
 */
describe('list editor element', () => {
  const makeHot = () => ({
    guid: 'ht_1234567890abcdef',
    rootDocument: document,
    rootWindow: window,
    rootElement: document.createElement('div'),
    addHook: jest.fn(),
    addHookOnce: jest.fn(),
    getSettings: () => ({ ariaTags: true }),
  });

  it.each([
    ['HandsontableEditor', HandsontableEditor],
    ['AutocompleteEditor', AutocompleteEditor],
    ['DropdownEditor', DropdownEditor],
  ])('%s edits in a text input', (name, EditorClass) => {
    const editor = new EditorClass(makeHot());
    const field = editor.TEXTAREA;

    expect(field).toBeInstanceOf(HTMLInputElement);
    expect(field.getAttribute('type')).toBe('text');
    expect(field.hasAttribute('data-hot-input')).toBe(true);
    expect(field.getAttribute('tabindex')).toBe('-1');
    expect(field.classList.contains('handsontableInput')).toBe(true);
    expect(field.parentElement).toBe(editor.TEXTAREA_PARENT);
    expect(editor.TEXTAREA_PARENT.classList.contains('handsontableInputHolder')).toBe(true);
  });

  it('the autocomplete field is a text input with ariaTags off too', () => {
    const hot = { ...makeHot(), getSettings: () => ({ ariaTags: false }) };
    const field = new AutocompleteEditor(hot).TEXTAREA;

    expect(field).toBeInstanceOf(HTMLInputElement);
    expect(field.getAttribute('type')).toBe('text');
    expect(field.hasAttribute('role')).toBe(false);
  });

  it('the text editor keeps its textarea', () => {
    expect(new TextEditor(makeHot()).TEXTAREA).toBeInstanceOf(HTMLTextAreaElement);
  });
});
