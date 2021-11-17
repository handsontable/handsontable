describe('Core_beforechange', () => {
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

  it('this.rootElement should point to handsontable rootElement', () => {
    let output = null;

    handsontable({
      beforeChange() {
        output = this.rootElement;
      }
    });
    setDataAtCell(0, 0, 'test');

    expect(output).toEqual(spec().$container[0]);
  });

  it('should remove change from stack', () => {
    let output = null;

    handsontable({
      data: [['a', 'b'], ['c', 'd']],
      beforeChange(changes) {
        changes[1] = null;
      },
      afterChange(changes) {
        output = changes;
      }
    });
    setDataAtCell([[0, 0, 'test'], [1, 0, 'test'], [1, 1, 'test']]);

    expect(getDataAtCell(0, 0)).toEqual('test');
    expect(getDataAtCell(1, 0)).toEqual('c');
    expect(getDataAtCell(1, 1)).toEqual('test');
    expect(output).toEqual([[0, 0, 'a', 'test'], [1, 1, 'd', 'test']]);
  });

  it('should drop all changes when beforeChange return false', () => {
    handsontable({
      data: [['a', 'b'], ['c', 'd']],
      beforeChange() {
        return false;
      }
    });
    setDataAtCell([[0, 0, 'test'], [1, 0, 'test'], [1, 1, 'test']]);

    expect(getDataAtCell(0, 0)).toEqual('a');
    expect(getDataAtCell(1, 0)).toEqual('c');
    expect(getDataAtCell(1, 1)).toEqual('d');
  });

  it('should drop change when beforeChange set single change to null and close editor autocomplete (date)', () => {
    handsontable({
      data: [['a', 'b'], ['c', 'd']],
      columns: [
        {
          type: 'autocomplete',
          source: ['Audi', 'BMW', 'Chrysler', 'Citroen', 'Mercedes', 'Nissan', 'Opel', 'Suzuki', 'Toyota', 'Volvo'],
          strict: false
        },
        {
          // 2nd cell is simple text, no special options here
        },
      ],
      beforeChange(changes) {
        changes[0] = null;
      }
    });

    setDataAtCell([[0, 0, 'test']]);

    expect(getDataAtCell(0, 0)).toEqual('a');

    selectCell(0, 0);
    keyDown('enter');
    keyDown('enter');

    expect(isEditorVisible()).toBe(false);
  });

  it('should drop change when beforeChange remove single change and close editor autocomplete (date)', () => {
    handsontable({
      data: [['a', 'b'], ['c', 'd']],
      columns: [
        {
          type: 'date',
          dateFormat: 'MM/DD/YYYY',
          correctFormat: true,
          defaultDate: '01/01/1900',
        },
        {
          // 2nd cell is simple text, no special options here
        },
      ],
      beforeChange(changes) {
        changes.splice(0, 1);
      }
    });

    setDataAtCell([[0, 0, 'test']]);

    expect(getDataAtCell(0, 0)).toEqual('a');

    selectCell(0, 0);
    keyDown('enter');
    keyDown('enter');

    expect(isEditorVisible()).toBe(false);
  });

  it('should drop change when beforeChange set to `true` and allowInvalid is `false` and do not close editor (which has validator)', () => {
    handsontable({
      data: [['a', 'b'], ['c', 'd']],
      columns: () => ({
        validator: (_, callback) => callback(false),
        allowInvalid: false
      }),
      beforeChange: () => true
    });

    setDataAtCell([[0, 0, 'test']]);

    expect(getDataAtCell(0, 0)).toEqual('a');

    selectCell(0, 0);
    keyDown('enter');
    keyDown('enter');

    expect(isEditorVisible()).toBe(true);
  });

  it('should drop change when beforeChange return `false` and allowInvalid is `false` and close editor (which has validator)', () => {
    handsontable({
      data: [['a', 'b'], ['c', 'd']],
      columns: () => ({
        validator: (_, callback) => callback(false),
        allowInvalid: false
      }),
      beforeChange: () => false
    });

    setDataAtCell([[0, 0, 'test']]);

    expect(getDataAtCell(0, 0)).toEqual('a');

    selectCell(0, 0);
    keyDown('enter');
    keyDown('enter');

    expect(isEditorVisible()).toBe(false);
  });

  function beforechangeOnKeyFactory(keyCode) {
    return function() {
      let called = false;

      handsontable({
        beforeChange(changes) {
          if (changes[0][2] === 'test' && changes[0][3] === null) {
            called = true;
          }
        }
      });

      setDataAtCell(0, 0, 'test');
      selectCell(0, 0);

      keyDown(keyCode);

      expect(called).toEqual(true);
    };
  }

  it('should be called on Delete key', beforechangeOnKeyFactory(46)); // 46 = Delete key

  it('should be called on Backspace key', beforechangeOnKeyFactory(8)); // 8 = Backspace key
});
