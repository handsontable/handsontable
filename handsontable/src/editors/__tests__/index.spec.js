describe('editors', () => {
  const id = 'testContainer';
  const {
    registerEditor,
    getEditor,
    editorFactory,
  } = Handsontable.editors;

  beforeEach(function() {
    this.$container = $(`<div id="${id}"></div>`).appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  it('should register custom editor', async() => {
    class MyEditor extends Handsontable.editors.BaseEditor {
      init() {
        this.TEXTAREA = document.createElement('TEXTAREA');
        this.TEXTAREA_PARENT = document.createElement('DIV');

        this.TEXTAREA_PARENT.appendChild(this.TEXTAREA);
        this.hot.rootElement.appendChild(this.TEXTAREA_PARENT);
      }
      getValue() {
        return `--${this.TEXTAREA.value}--`;
      }
      setValue(value) {
        this.TEXTAREA.value = value;
      }
      open() {}
      close() {}
      focus() {
        this.TEXTAREA.focus();
      }
    }
    registerEditor('myEditor', MyEditor);

    handsontable({
      data: [
        [1, 6, 10],
      ],
      columns: [{
        editor: 'myEditor',
      }],
    });

    await selectCell(0, 0);
    await keyDownUp('enter');

    document.activeElement.value = 'hello';
    destroyEditor();

    expect(getDataAtCell(0, 0)).toBe('--hello--');
  });

  it('should retrieve predefined editors by its names', async() => {
    expect(getEditor('autocomplete')).toBeFunction();
    expect(getEditor('base')).toBeFunction();
    expect(getEditor('checkbox')).toBeFunction();
    expect(getEditor('date')).toBeFunction();
    expect(getEditor('dropdown')).toBeFunction();
    expect(getEditor('handsontable')).toBeFunction();
    expect(getEditor('numeric')).toBeFunction();
    expect(getEditor('password')).toBeFunction();
    expect(getEditor('select')).toBeFunction();
    expect(getEditor('text')).toBeFunction();
  });

  it('should return the original editor function when it was passed directly to the getter', async() => {
    class MyEditor {}

    expect(getEditor(MyEditor)).toBe(MyEditor);
  });

  it('should retrieve custom editor by its names', async() => {
    class MyEditor {}
    registerEditor('myEditor', MyEditor);

    expect(getEditor('myEditor')).toBe(MyEditor);
  });

  it('should reset previous value when printable character was entered to selected, non-empty cell', async() => {
    handsontable({
      data: [
        { id: 10, name: 'Cup' },
        { id: 23, name: 'Newspaper' },
        { id: 31, name: 'Car' }
      ],
      columns: [
        { data: 'id', type: 'numeric' },
        { data: 'name' },
      ]
    });

    await selectCell(0, 0);
    await keyDownUp('1');

    destroyEditor();

    await sleep(100);

    expect(getCell(0, 0).innerHTML).not.toEqual('10');

    await selectCell(0, 1);
    await keyDownUp('a');

    destroyEditor();

    await sleep(50);

    expect(getCell(1, 0).innerHTML).not.toEqual('Cup');
  });

  it('should create a custom editor using the editorFactory', async() => {
    const myEditor = editorFactory({});

    expect(myEditor).toBeFunction();
  });

  describe('editorFactory options', () => {
    const minimalFactoryEditor = (overrides = {}) => editorFactory({
      init(editor) {
        editor.input = document.createElement('input');
      },
      ...overrides,
    });

    it('should prevent close when beforeClose returns false', async() => {
      const beforeClose = jasmine.createSpy('beforeClose').and.returnValue(false);
      const CustomEditor = minimalFactoryEditor({ beforeClose });

      handsontable({
        data: [['a']],
        columns: [{ editor: CustomEditor }],
      });

      await selectCell(0, 0);
      await keyDownUp('enter');

      expect(getActiveEditor().isOpened()).toBe(true);

      const closeResult = getActiveEditor().close();

      expect(closeResult).toBe(false);
      expect(beforeClose).toHaveBeenCalled();
      expect(getActiveEditor().isOpened()).toBe(true);
      expect(getActiveEditor().container.style.display).not.toBe('none');
    });

    it('should close normally when beforeClose returns true or undefined', async() => {
      const CustomEditor = minimalFactoryEditor({ beforeClose: () => true });

      handsontable({
        data: [['a']],
        columns: [{ editor: CustomEditor }],
      });

      await selectCell(0, 0);
      await keyDownUp('enter');

      expect(getActiveEditor().close()).not.toBe(false);
      expect(getActiveEditor().isOpened()).toBe(false);
    });

    it('should add ht_clone_master class on open and call refreshDimensions', async() => {
      const CustomEditor = minimalFactoryEditor();

      handsontable({
        data: [['a']],
        columns: [{ editor: CustomEditor }],
      });

      await selectCell(0, 0);
      await keyDownUp('enter');

      const editor = getActiveEditor();

      expect(editor.container.classList.contains('ht_clone_master')).toBe(true);
      expect(editor.container.style.display).toBe('block');
    });

    it('should close editor in refreshDimensions when getEditedCell returns null', async() => {
      const CustomEditor = minimalFactoryEditor();

      handsontable({
        data: [['a']],
        columns: [{ editor: CustomEditor }],
      });

      await selectCell(0, 0);
      await keyDownUp('enter');

      const editor = getActiveEditor();

      spyOn(editor, 'getEditedCell').and.returnValue(null);
      spyOn(editor, 'close').and.callThrough();

      editor.refreshDimensions();

      expect(editor.close).toHaveBeenCalled();
    });

    it('should not update container in refreshDimensions when editor is not open', async() => {
      const CustomEditor = minimalFactoryEditor();

      handsontable({
        data: [['a']],
        columns: [{ editor: CustomEditor }],
      });

      await selectCell(0, 0);
      await keyDownUp('enter');

      const editor = getActiveEditor();

      editor.close();
      editor.container.style.top = '999px';
      editor.refreshDimensions();

      expect(editor.container.style.top).toBe('999px');
    });

    it('should register scroll hooks that call refreshDimensions', async() => {
      const CustomEditor = minimalFactoryEditor();

      handsontable({
        data: [['a']],
        columns: [{ editor: CustomEditor }],
      });

      await selectCell(0, 0);
      await keyDownUp('enter');

      const editor = getActiveEditor();

      spyOn(editor, 'refreshDimensions');

      editor.hot.runHooks('afterScrollHorizontally');
      expect(editor.refreshDimensions).toHaveBeenCalled();

      editor.refreshDimensions.calls.reset();
      editor.hot.runHooks('afterScrollVertically');
      expect(editor.refreshDimensions).toHaveBeenCalled();
    });
  });
});
