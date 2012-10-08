describe('AutocompleteEditor', function () {
  var id = 'testContainer';

  beforeEach(function () {
    this.$container = $('<div id="' + id + '"></div>').appendTo('body');
  });

  afterEach(function () {
    if (this.$container) {
      this.$container.remove();
    }
  });

  it('should destroy editor when value change with mouse click on suggestion', function () {
    runs(function () {
      handsontable({
        autoComplete: [
          {
            match: function (row, col, data) {
              if (col == 2) {
                return true;
              }
              return false;
            },
            source: function () {
              return ["yellow", "red", "orange", "green", "blue", "gray", "black", "white"]
            }
          }
        ]
      });
      selectCell(2, 2);
      keyDown('enter');
      keyUp('enter');

      var li = autocomplete().$menu.find('li[data-value="green"]');
      li.trigger('mouseenter');
      li.trigger('click');
    });

    waitsFor(function () {
      return (getDataAtCell(2, 2) === 'green');
    }, 10);
  });
});