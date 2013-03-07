describe('Core_datachange', function () {
  var id = 'testContainer';

  beforeEach(function () {
    this.$container = $('<div id="' + id + '"></div>').appendTo('body');
  });

  afterEach(function () {
    if (this.$container) {
      this.$container.remove();
    }
  });

  it('should call onChange callback', function () {
    var output = null;

    runs(function () {
      handsontable({
        onChange: function (changes) {
          output = changes;
        }
      });
      setDataAtCell(1, 2, "test");
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
      handsontable();
      this.$container.on("datachange.handsontable", function (event, changes) {
        output = changes;
      });
      setDataAtCell(1, 2, "test");
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
    var $container = this.$container;

    runs(function () {
      handsontable({
        onChange: function () {
          output = this;
        }
      });
      setDataAtCell(0, 0, "test");
    });

    waitsFor(function () {
      return (output != null)
    }, "onChange callback called", 100);

    runs(function () {
      expect(output).toEqual($container[0]);
    });
  });

  it('onChange should be triggered after data is rendered to DOM (init)', function () {
    var output = null;
    var $container = this.$container;

    runs(function () {
      handsontable({
        data: [
          ['Joe Red']
        ],
        onChange: function (changes, source) {
          if (source === 'loadData') {
            output = $container.find('table.htCore tbody td:first').html();
          }
        }
      });
    });

    waitsFor(function () {
      return (output != null)
    }, "onChange callback called", 100);

    runs(function () {
      expect(output).toEqual('Joe Red');
    });
  });

  it('onChange should be triggered after data is rendered to DOM (setDataAtCell)', function () {
    var output = null;
    var $container = this.$container;

    runs(function () {
      handsontable({
        data: [
          ['Joe Red']
        ],
        onChange: function (changes, source) {
          if (source === 'edit') {
            output = $container.find('table.htCore tbody td:first').html();
          }
        }
      });
      setDataAtCell(0, 0, 'Alice Red');
    });

    waitsFor(function () {
      return (output != null)
    }, "onChange callback called", 100);

    runs(function () {
      expect(output).toEqual('Alice Red');
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
      handsontable({
        data: sampleData,
        onChange: function (changes, source) {
          if ('edit' == source) {
            event = changes.shift();
          }
        }
      });
      setDataAtCell(0, 0, "test");
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