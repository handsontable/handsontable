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
        this.instance.rootElement.appendChild(this.TEXTAREA_PARENT);
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

    const hot = handsontable({
      data: [
        [1, 6, 10],
      ],
      columns: [{
        editor: 'myEditor',
      }],
    });

    selectCell(0, 0);
    keyDown('enter');
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
    expect(getEditor('mobile')).toBeFunction();
    expect(getEditor('numeric')).toBeFunction();
    expect(getEditor('password')).toBeFunction();
    expect(getEditor('select')).toBeFunction();
    expect(getEditor('text')).toBeFunction();
  });

  it('should retrieve custom editor by its names', () => {
    class MyEditor {}
    registerEditor('myEditor', MyEditor);

    expect(getEditor('myEditor')).toBe(MyEditor);
  });
});
