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

  it('this should point to handsontable rootElement', function () {
    var output = null;

    runs(function () {
      handsontable({
        onBeforeChange: function () {
          output = this;
        }
      });
      setDataAtCell(0, 0, "test");
    });

    waitsFor(function () {
      return (output != null)
    }, "onBeforeChange callback called", 100);

    runs(function () {
      expect(output).toEqual(this.$container.get(0));
    });
  });

  it('this should remove change from stack', function () {
    var output = null;

    runs(function () {
      handsontable({
        data : [["a", "b"], ["c", "d"]],
        onBeforeChange: function (changes) {
          changes[1] = null;
        },
        onChange : function (changes) {
          output = changes;
        }
      });
      setDataAtCell([[0, 0, "test"], [1, 0, "test"], [1, 1, "test"]]);
    });

    waitsFor(function () {
      return (output != null)
    }, "onChange callback called", 100);

    runs(function () {
      expect(getDataAtCell(0,0)).toEqual("test");
      expect(getDataAtCell(1,0)).toEqual("c");
      expect(getDataAtCell(1,1)).toEqual("test");
      expect(output).toEqual([[0, 0, "a", "test"], [1, 1, "d", "test"]]);
    });
  });

  function beforechangeOnKeyFactory(keyCode) {
    return function () {
      var called = false;

      runs(function () {
        handsontable({
          onBeforeChange: function (changes) {
            if (changes[0][2] === "test" && changes[0][3] === "") {
              called = true;
            }
          }
        });
        setDataAtCell(0, 0, "test");
        selectCell(0, 0);

        keyDown(keyCode);
      });

      waitsFor(function () {
        return (called === true)
      }, "onBeforeChange callback called", 100);

      runs(function () {
        expect(called).toEqual(true);
      });
    }
  }

  it('should be called on Delete key', beforechangeOnKeyFactory(46)); //46 = Delete key

  it('should be called on Backspace key', beforechangeOnKeyFactory(8)); //8 = Backspace key
});