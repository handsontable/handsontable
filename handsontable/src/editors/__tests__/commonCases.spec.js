describe('Editor common cases', () => {
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

  class X1Editor extends Handsontable.editors.TextEditor {
    setValue(newValue) {
      super.setValue(newValue);
    }
    getValue() {
      return super.getValue();
    }
  }
  class X100Editor extends Handsontable.editors.TextEditor {
    setValue(newValue) {
      super.setValue(newValue / 100);
    }
    getValue() {
      return super.getValue() * 100;
    }
  }

  it('should prepare new editor type in the next column after accepting the value by "Tab" key (#dev-1855)', async() => {
    handsontable({
      data: Array.from({ length: 1 }, (_, i) => ({ type: 'x100', value: i + 5 })),
      columns: [
        {
          data: 'type',
          type: 'dropdown',
          source: ['x1', 'x100'],
          allowInvalid: false,
        },
        {
          data: 'value',
          type: 'numeric',
        },
      ],
      cells(row, col, prop) {
        if (prop !== 'value') {
          return {};
        }

        if (this.instance.getDataAtRowProp(row, 'type') === 'x1') {
          return {
            editor: X1Editor,
          };
        }

        return {
          editor: X100Editor,
        };
      },
    });

    selectCell(0, 0);

    expect(getCellEditor(0, 1)).toBe(X100Editor);

    keyDownUp('enter');
    getActiveEditor().TEXTAREA.value = 'x1';
    keyDownUp('tab');

    await sleep(20);

    keyDownUp('enter');

    expect(getActiveEditor()).toBeInstanceOf(X1Editor);
  });
});
