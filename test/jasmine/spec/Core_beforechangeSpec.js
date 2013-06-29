describe('Core_beforechange', function () {
  var id = 'testContainer';

  beforeEach(function () {
    this.$container = $('<div id="' + id + '"></div>').appendTo('body');
  });

  afterEach(function () {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  it('this.rootElement should point to handsontable rootElement', function () {
    var output = null;

    handsontable({
      beforeChange: function () {
        output = this.rootElement[0];
      }
    });
    setDataAtCell(0, 0, "test");

    expect(output).toEqual(this.$container[0]);
  });

  it('should remove change from stack', function () {
    var output = null;

    handsontable({
      data : [["a", "b"], ["c", "d"]],
      beforeChange: function (changes) {
        changes[1] = null;
      },
      afterChange : function (changes) {
        output = changes;
      }
    });
    setDataAtCell([[0, 0, "test"], [1, 0, "test"], [1, 1, "test"]]);

    expect(getDataAtCell(0,0)).toEqual("test");
    expect(getDataAtCell(1,0)).toEqual("c");
    expect(getDataAtCell(1,1)).toEqual("test");
    expect(output).toEqual([[0, 0, "a", "test"], [1, 1, "d", "test"]]);
  });

  it('should drop all changes when beforeChange return false', function () {
    var fired = false;

    handsontable({
      data : [["a", "b"], ["c", "d"]],
      beforeChange: function (changes) {
        fired = true;
        return false;
      }
    });
    setDataAtCell([[0, 0, "test"], [1, 0, "test"], [1, 1, "test"]]);

    expect(getDataAtCell(0,0)).toEqual("a");
    expect(getDataAtCell(1,0)).toEqual("c");
    expect(getDataAtCell(1,1)).toEqual("d");
  });

  function beforechangeOnKeyFactory(keyCode) {
    return function () {
      var called = false;

      handsontable({
        beforeChange: function (changes) {
          if (changes[0][2] === "test" && changes[0][3] === "") {
            called = true;
          }
        }
      });

      setDataAtCell(0, 0, "test");
      selectCell(0, 0);

      keyDown(keyCode);

      expect(called).toEqual(true);
    }
  }

  it('should be called on Delete key', beforechangeOnKeyFactory(46)); //46 = Delete key

  it('should be called on Backspace key', beforechangeOnKeyFactory(8)); //8 = Backspace key
});