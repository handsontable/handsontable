describe('a11y DOM attributes (ARIA tags)', () => {
  const id = 'testContainer';
  const choices = ['yellow', 'red', 'orange', 'green', 'blue', 'gray', 'black',
    'white', 'purple', 'lime', 'olive', 'cyan'];

  beforeEach(function() {
    this.$container = $(`<div id="${id}"></div>`).appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  it('should add a correct set of aria tags to the TEXTAREA element', async() => {
    const hot = handsontable({
      columns: [
        { editor: 'autocomplete', source: choices, strict: true }
      ],
    });

    selectCell(0, 0);

    const editor = getActiveEditor();
    const editorTextarea = editor.TEXTAREA;

    expect(editorTextarea.getAttribute('type')).toEqual('text');
    expect(editorTextarea.getAttribute('role')).toEqual('combobox');
    expect(editorTextarea.getAttribute('aria-haspopup')).toEqual('listbox');
    expect(editorTextarea.getAttribute('aria-expanded')).toEqual('false');
    expect(editorTextarea.getAttribute('aria-autocomplete')).toEqual('list');
    expect(editorTextarea.getAttribute('aria-controls')).toEqual(`${hot.guid.slice(0, 9)}-listbox-0-0`);

    keyDownUp('enter');

    await sleep(50);

    expect(editorTextarea.getAttribute('aria-expanded')).toEqual('true');
    expect(editorTextarea.getAttribute('aria-activedescendant')).toEqual(
      `${hot.guid.slice(0, 9)}-listbox-0-0_${
        editor.htEditor.getSelectedLast()[0]
      }-${
        editor.htEditor.getSelectedLast()[1]
      }`
    );
  });

  it('should add a correct set of aria tags to the choice dropdown element', async() => {
    const hot = handsontable({
      columns: [
        { editor: 'autocomplete', source: choices, strict: true }
      ],
    });

    selectCell(0, 0);

    keyDownUp('enter');

    await sleep(50);

    const editor = getActiveEditor();
    const editorHot = editor.htEditor;
    const choiceDropdownRoot = editorHot.rootElement;

    expect(choiceDropdownRoot.getAttribute('role')).toEqual('listbox');
    expect(choiceDropdownRoot.getAttribute('aria-live')).toEqual('polite');
    expect(choiceDropdownRoot.getAttribute('aria-relevant')).toEqual('text');
    expect(choiceDropdownRoot.getAttribute('id')).toEqual(`${hot.guid.slice(0, 9)}-listbox-0-0`);
    expect(editorHot.getCell(...editorHot.getSelectedLast()).getAttribute('aria-selected')).toEqual('true');

    choices.forEach((option, index) => {
      expect(editorHot.getCell(index, 0).getAttribute('role')).toEqual('option');
      expect(editorHot.getCell(index, 0).getAttribute('id')).toEqual(`${hot.guid.slice(0, 9)}-listbox-0-0_${index}-0`);
      expect(editorHot.getCell(index, 0).getAttribute('aria-setsize')).toEqual(`${choices.length}`);
      expect(editorHot.getCell(index, 0).getAttribute('aria-posinset')).toEqual(`${index + 1}`);
    });
  });

  it('should should not add `aria-setsize` and `aria-posinset` if the source is a function`', async() => {
    const hot = handsontable({
      columns: [
        { editor: 'autocomplete', source: (quiery, callback) => callback(choices), strict: true }
      ],
    });

    selectCell(0, 0);

    keyDownUp('enter');

    await sleep(50);

    const editor = getActiveEditor();
    const editorHot = editor.htEditor;
    const choiceDropdownRoot = editorHot.rootElement;

    expect(choiceDropdownRoot.getAttribute('role')).toEqual('listbox');
    expect(choiceDropdownRoot.getAttribute('aria-live')).toEqual('polite');
    expect(choiceDropdownRoot.getAttribute('aria-relevant')).toEqual('text');
    expect(choiceDropdownRoot.getAttribute('id')).toEqual(`${hot.guid.slice(0, 9)}-listbox-0-0`);
    expect(editorHot.getCell(...editorHot.getSelectedLast()).getAttribute('aria-selected')).toEqual('true');

    editorHot.getSourceData().forEach((option, index) => {
      option = option[0];

      expect(editorHot.getCell(index, 0).getAttribute('role')).toEqual('option');
      expect(editorHot.getCell(index, 0).getAttribute('id')).toEqual(`${hot.guid.slice(0, 9)}-listbox-0-0_${index}-0`);
      expect(editorHot.getCell(index, 0).getAttribute('aria-setsize')).toEqual(null);
      expect(editorHot.getCell(index, 0).getAttribute('aria-posinset')).toEqual(null);
    });
  });
});
