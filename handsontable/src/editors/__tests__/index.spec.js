describe('editors', () => {
  const id = 'testContainer';
  const {
    registerEditor,
    getEditor,
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

  it('should register custom editor', () => {
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

    selectCell(0, 0);
    keyDownUp('enter');
    document.activeElement.value = 'hello';
    destroyEditor();

    expect(getDataAtCell(0, 0)).toBe('--hello--');
  });

  it('should retrieve predefined editors by its names', () => {
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

  it('should return the original editor function when it was passed directly to the getter', () => {
    class MyEditor {}

    expect(getEditor(MyEditor)).toBe(MyEditor);
  });

  it('should retrieve custom editor by its names', () => {
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

    selectCell(0, 0);
    keyDownUp('1');

    destroyEditor();

    await sleep(100);

    expect(getCell(0, 0).innerHTML).not.toEqual('10');

    selectCell(0, 1);
    keyDownUp('a');

    destroyEditor();

    await sleep(100);

    expect(getCell(1, 0).innerHTML).not.toEqual('Cup');
  });
});
