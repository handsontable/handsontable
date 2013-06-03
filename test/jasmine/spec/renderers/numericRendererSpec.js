describe('NumericRenderer', function () {
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

  it('should render formatted number', function () {
    handsontable({
      cells: function() {
        return {
          type: 'numeric',
          format: '$0,0.00'
        }
      }
    });
    setDataAtCell(2, 2, "1000.234");

    waitsFor(nextFrame, 'next frame', 60);

    runs(function () {
      expect(getCell(2, 2).innerHTML).toEqual("$1,000.23");
    });
  });

  it('should render signed number', function () {
    handsontable({
      cells: function() {
        return {
          type: 'numeric',
          format: '$0,0.00'
        }
      }
    });

    setDataAtCell(2, 2, "-1000.234");
    expect(getCell(2, 2).innerHTML).toEqual("-$1,000.23");
  });

  it('should render string as it is', function () {
    handsontable({
      cells: function() {
        return {
          type: 'numeric',
          format: '$0,0.00'
        }
      }
    });

    setDataAtCell(2, 2, "123 simple test");
    expect(getCell(2, 2).innerHTML).toEqual("123 simple test");
  });
});