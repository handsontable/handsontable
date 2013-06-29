describe('Core_datachange', function () {
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

  it('should call onChange callback', function () {
    var output = null;

    handsontable({
      onChange: function (changes) {
        output = changes;
      }
    });
    setDataAtCell(1, 2, "test");

    expect(output[0][0]).toEqual(1);
    expect(output[0][1]).toEqual(2);
    expect(output[0][2]).toEqual(null);
    expect(output[0][3]).toEqual("test");
  });

  it('should use custom source for datachange', function () {
    var output = null,
        src    = null;

    handsontable({
      onChange: function (changes, source) {
        output = changes;
        src = source;
      }
    });
    setDataAtCell(1, 2, "abc", "test");

    expect(output[0][3]).toEqual("abc");
    expect(src).toEqual("test");
  });

  it('should use custom source for datachange with array', function () {
    var output = null,
        src    = null;

    handsontable({
      onChange: function (changes, source) {
        output = changes;
        src = source;
      }
    });
    setDataAtCell([[1, 2, "abc"]], "test");

    expect(output[0][3]).toEqual("abc");
    expect(src).toEqual("test");
  });

  it('should trigger datachange event', function () {
    var output = null;

    handsontable();
    Handsontable.PluginHooks.add("onChange", function (changes) {
      output = changes;
    });
    setDataAtCell(1, 2, "test");

    expect(output[0][0]).toEqual(1);
    expect(output[0][1]).toEqual(2);
    expect(output[0][2]).toEqual(null);
    expect(output[0][3]).toEqual("test");
  });

  it('this.rootElement should point to handsontable rootElement', function () {
    var output = null;
    var $container = this.$container;

    handsontable({
      onChange: function () {
        output = this.rootElement[0];
      }
    });
    setDataAtCell(0, 0, "test");

    expect(output).toEqual($container[0]);
  });

  it('onChange should be triggered after data is rendered to DOM (init)', function () {
    var output = null;
    var $container = this.$container;

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

    expect(output).toEqual('Joe Red');
  });

  it('onChange should be triggered after data is rendered to DOM (setDataAtCell)', function () {
    var output = null;
    var $container = this.$container;

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

    expect(output).toEqual('Alice Red');
  });

  it('onChange event object should contain documented keys and values when triggered by edit', function () {
    var sampleData = [
      {
        col1: 'a',
        col2: 'b',
        col3: 'c'
      }
    ];
    var event = null;

    handsontable({
      data: sampleData,
      onChange: function (changes, source) {
        if ('edit' == source) {
          event = changes.shift();
        }
      }
    });
    setDataAtCell(0, 0, "test");

    expect(event[0]).toEqual(0);
    expect(event[1]).toEqual('col1');
    expect(event[2]).toEqual('a');
    expect(event[3]).toEqual('test');
  });

  it('source parameter should be `edit` when cell value is changed through editor', function () {
    var sources = [];

    handsontable({
      data: [
        ['Joe Red']
      ],
      onChange: function (changes, source) {
        sources.push(source);
      }
    });
    selectCell(0, 0);

    keyDown('enter');
    document.activeElement.value = 'Ted';
    keyDown('enter');

    expect(sources).toEqual(['loadData', 'edit']); //loadData is always the first source
  });

});