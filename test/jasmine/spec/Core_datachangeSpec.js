describe('Core_datachange', function () {
  var $container,
    id = 'testContainer';

  beforeEach(function () {
    $container = $('<div id="' + id + '"></div>').appendTo('body');
  });

  afterEach(function () {
    if($container) {
      $container.remove();
    }
  });

  it('should call onChange callback', function () {
    var output = null;

    runs(function () {
      $container.handsontable({
        onChange: function (changes) {
          output = changes;
        }
      });
      $container.handsontable('setDataAtCell', 1, 2, "test");
    });

    waitsFor(function () {
      return (output != null)
    }, "onChange callback called", 100);

    runs(function () {
      expect(output[0][0]).toEqual(1);
      expect(output[0][1]).toEqual(2);
      expect(output[0][2]).toEqual(null);
      expect(output[0][3]).toEqual("test");
    });
  });

  it('should trigger datachange event', function () {
    var output = null;

    runs(function () {
      $container.handsontable();
      $container.on("datachange.handsontable", function (event, changes) {
        output = changes;
      });
      $container.handsontable('setDataAtCell', 1, 2, "test");
    });

    waitsFor(function () {
      return (output != null)
    }, "datachange event triggered", 100);

    runs(function () {
      expect(output[0][0]).toEqual(1);
      expect(output[0][1]).toEqual(2);
      expect(output[0][2]).toEqual(null);
      expect(output[0][3]).toEqual("test");
    });
  });

  it('this should point to handsontable rootElement', function () {
    var output = null;

    runs(function () {
      $container.handsontable({
        onChange: function () {
          output = this;
        }
      });
      $container.handsontable('setDataAtCell', 0, 0, "test");
    });

    waitsFor(function () {
      return (output != null)
    }, "onChange callback called", 100);

    runs(function () {
      expect(output).toEqual($container.get(0));
    });
  });

  it('onChange event object should contain documented keys and values when triggered by edit', function () {

    var sampleData = [{
      col1: 'a',
      col2: 'b',
      col3: 'c'
    }];
    var event = null;

    runs(function () {
      $container.handsontable({
        data: sampleData,
        onChange: function (e, source) {
          if ('edit' == source) {
            event = e.shift();
          }
        }
      });
      $container.handsontable('setDataAtCell', 0, 0, "test");
    });

    waitsFor(function () {
      return (event != null)
    }, "onChange callback called", 100);

    runs(function () {
      expect(event[0]).toEqual(0);
      expect(event[1]).toEqual('col1');
      expect(event[2]).toEqual('a');
      expect(event[3]).toEqual('test');
    });
  });


});