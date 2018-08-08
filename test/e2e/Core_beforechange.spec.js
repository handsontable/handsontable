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

  function beforechangeOnKeyFactory(keyCode) {
    return function() {
      let called = false;

      handsontable({
        beforeChange(changes) {
          if (changes[0][2] === 'test' && changes[0][3] === '') {
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
