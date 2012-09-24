describe('Core_beforechange', function () {
  var $container,
    id = 'testContainer';

  beforeEach(function () {
    $container = $('<div id="' + id + '"></div>');
  });

  afterEach(function () {
    $('#' + id).remove();
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
});