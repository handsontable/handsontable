describe('Core_removeCellMeta', () => {
  var id = 'testContainer';

  beforeEach(function() {
    this.$container = $(`<div id="${id}"></div>`).appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  it('should remove meta for cell', () => {
    handsontable({
      data: [
        [1, 2, 3, 4],
        [5, 6, 7, 8],
        [0, 9, 8, 7]
      ]
    });
    var border = {
      top: {

      },
      left: {

      }
    };

    setCellMeta(0, 0, 'borders', border);
    expect(getCellMeta(0, 0).borders).toEqual(border);

    removeCellMeta(0, 0, 'borders');
    expect(getCellMeta(0, 0).borders).toBeUndefined();
  });
});
