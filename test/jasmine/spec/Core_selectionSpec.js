describe('Core_selection', function () {
  var $container,
    id = 'testContainer';

  beforeEach(function () {
    $container = $('<div id="' + id + '"></div>');
  });

  afterEach(function () {
    $('#' + id).remove();
  });

  it('should call onSelection callback', function () {
    var output = null;

    runs(function () {
      $container.handsontable({
        onSelection:function (r, c) {
          output = [r, c];
        }
      });
      $container.handsontable('selectCell', 1, 2);
    });

    waitsFor(function () {
      return (output != null)
    }, "onSelection callback called", 100);

    runs(function () {
      expect(output[0]).toEqual(1);
      expect(output[1]).toEqual(2);
    });
  });
});