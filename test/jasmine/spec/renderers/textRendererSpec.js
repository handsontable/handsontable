describe('TextRenderer', function () {
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

  it('should render string', function () {
    handsontable();
    setDataAtCell(2, 2, "string");

    expect(getCell(2, 2).innerHTML).toEqual("string");
  });

  it('should render number', function () {
    handsontable();
    setDataAtCell(2, 2, 13);

    expect(getCell(2, 2).innerHTML).toEqual("13");
  });

  it('should render boolean true', function () {
    handsontable();
    setDataAtCell(2, 2, true);

    expect(getCell(2, 2).innerHTML).toEqual("true");
  });

  it('should render boolean false', function () {
    handsontable();
    setDataAtCell(2, 2, false);

    expect(getCell(2, 2).innerHTML).toEqual("false");
  });

  it('should render null', function () {
    handsontable();
    setDataAtCell(2, 2, null);

    expect(getCell(2, 2).innerHTML).toEqual('');
  });

  it('should render undefined', function () {
    handsontable();
    setDataAtCell(2, 2, (function () {
    })());

    expect(getCell(2, 2).innerHTML).toEqual('');
  });

  it('should add class name `htDimmed` to a read only cell', function () {
    var DIV = document.createElement('DIV');
    var instance = new Handsontable.Core($(DIV), {});
    instance.init(); //unfortunately these 3 lines are currently needed to satisfy renderer arguments (as of v0.8.21)

    var TD = document.createElement('TD');
    TD.className = "someClass";
    Handsontable.TextRenderer(instance, TD, 0, 0, 0, '', {readOnly: true});
    expect(TD.className).toEqual('someClass htDimmed');
  });

  it('should render a multiline string', function () {
    handsontable();
    setDataAtCell(1, 2, "a b");
    setDataAtCell(2, 2, "a\nb");

    expect($(getCell(2, 2)).height()).toBeGreaterThan($(getCell(1, 2)).height());
  });

  it('should wrap text when column width is limited', function () {
    handsontable({
      colWidths: [100]
    });
    setDataAtCell(0, 0, "short text");
    setDataAtCell(1, 0, "long long long long long long long text");

    expect($(getCell(1, 0)).height()).toBeGreaterThan($(getCell(0, 0)).height());
  });
});