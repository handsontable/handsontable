describe('Core_beforechange', function () {
  var $container,
    id = 'testContainer';

  beforeEach(function () {
    $container = $('<div id="' + id + '"></div>').appendTo('body');
  });

  afterEach(function () {
    if ($container) {
      $container.remove();
    }
  });

  it('this should point to handsontable rootElement', function () {
    var output = null;

    runs(function () {
      $container.handsontable({
        onBeforeChange: function () {
          output = this;
        }
      });
      $container.handsontable('setDataAtCell', 0, 0, "test");
    });

    waitsFor(function () {
      return (output != null)
    }, "onBeforeChange callback called", 100);

    runs(function () {
      expect(output).toEqual($container.get(0));
    });
  });

  function beforechangeOnKeyFactory(keyCode) {
    return function () {
      var called = false;

      runs(function () {
        $container.handsontable({
          onBeforeChange: function (changes) {
            if (changes[0][2] === "test" && changes[0][3] === "") {
              called = true;
            }
          }
        });
        $container.handsontable('setDataAtCell', 0, 0, "test");
        $container.handsontable('selectCell', 0, 0);

        var keydown = $.Event('keydown');
        keydown.keyCode = keyCode;
        $container.find('textarea.handsontableInput').trigger(keydown);
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