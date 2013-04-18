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

    runs(function () {
      handsontable({
        onBeforeChange: function () {
          output = this.rootElement[0];
        }
      });
      setDataAtCell(0, 0, "test");
    });

    waitsFor(function () {
      return (output != null)
    }, "onBeforeChange callback called", 100);

    runs(function () {
      expect(output).toEqual(this.$container[0]);
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