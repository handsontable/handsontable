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
              return (col === 2);
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

  it('should destroy editor when value change with enter on suggestion', function () {
    runs(function () {
      handsontable({
        autoComplete: [
          {
            match: function (row, col, data) {
              return (col === 2);
            },
            source: function () {
              return ["yellow", "red", "orange", "green", "blue", "gray", "black", "white"]
            },
            strict: true
          }
        ]
      });
      selectCell(2, 2);
      keyDown('enter');
      keyUp('enter');
    });

    waits(51);

    runs(function(){
      keyDown('arrow_down');
      keyUp('arrow_down');
      keyDown('arrow_down');
      keyUp('arrow_down');
      keyDown('arrow_down');
      keyUp('arrow_down');
      keyDown('enter');
      keyUp('enter');
    });

    waitsFor(function () {
      return (getDataAtCell(2, 2) === 'green');
    }, 10);
  });
});