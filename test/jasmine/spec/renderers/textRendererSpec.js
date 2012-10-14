describe('TextCell', function () {
  var id = 'testContainer';

  beforeEach(function () {
    this.$container = $('<div id="' + id + '"></div>').appendTo('body');
  });

  afterEach(function () {
    if (this.$container) {
      this.$container.remove();
    }
  });

  it('should render string', function () {
    handsontable();
    setDataAtCell(2, 2, "string");
    expect(getCell(2,2).innerHTML).toEqual("string");
  });

  it('should render number', function () {
    handsontable();
    setDataAtCell(2, 2, 13);
    expect(getCell(2,2).innerHTML).toEqual("13");
  });

  it('should render boolean true', function () {
    handsontable();
    setDataAtCell(2, 2, true);
    expect(getCell(2,2).innerHTML).toEqual("true");
  });

  it('should render boolean false', function () {
    handsontable();
    setDataAtCell(2, 2, false);
    expect(getCell(2,2).innerHTML).toEqual("false");
  });

  it('should render null', function () {
    handsontable();
    setDataAtCell(2, 2, null);
    expect(getCell(2,2).innerHTML).toEqual("");
  });

  it('should render undefined', function () {
    handsontable();
    setDataAtCell(2, 2, (function(){})());
    expect(getCell(2,2).innerHTML).toEqual("");
  });
});