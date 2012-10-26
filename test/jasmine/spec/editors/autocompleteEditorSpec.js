describe('AutocompleteEditor', function () {
  var id = 'testContainer';

  function getAutocompleteConfig(isStrict) {
    return [
      {
        match: function (row, col, data) {
          return (col === 2);
        },
        source: function () {
          return ["yellow", "red", "orange", "green", "blue", "gray", "black", "white"]
        },
        strict: isStrict
      }
    ];
  }

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
        autoComplete: getAutocompleteConfig(false)
      });
      selectCell(2, 2);
      keyDownUp('enter');

      var li = autocomplete().$menu.find('li[data-value="green"]');
      li.trigger('mouseenter');
      li.trigger('click');
    });

    waitsFor(function () {
      return (getDataAtCell(2, 2) === 'green');
    }, 10);
  });

  it('should destroy editor when value change with Enter on suggestion', function () {
    runs(function () {
      handsontable({
        autoComplete: getAutocompleteConfig(true)
      });
      selectCell(2, 2);
      keyDownUp('enter');
    });

    waits(51);

    runs(function () {
      keyDownUp('arrow_down');
      keyDownUp('arrow_down');
      keyDownUp('arrow_down');
      keyDownUp('enter');
    });

    waitsFor(function () {
      return (getDataAtCell(2, 2) === 'green');
    }, 10);
  });

  it('should destroy editor when pressed Enter then Esc', function () {
    runs(function () {
      handsontable({
        autoComplete: getAutocompleteConfig(false)
      });
      selectCell(2, 2);
      keyDownUp('enter');
      keyDownUp('esc');
    });

    waits(51);

    runs(function () {
      expect(isAutocompleteVisible()).toEqual(false);
    });
  });

  it('should destroy editor when mouse double clicked then Esc', function () {
    runs(function () {
      handsontable({
        autoComplete: getAutocompleteConfig(false)
      });
      selectCell(2, 2);
      $(getCell(2, 2)).trigger("dblclick");
    });

    waits(51);

    runs(function () {
      keyDownUp('esc');
    });

    waits(51);

    runs(function () {
      expect(isAutocompleteVisible()).toEqual(false);
    });
  });

  it('should destroy editor when clicked outside the table', function () {
    runs(function () {
      handsontable({
        autoComplete: getAutocompleteConfig(false)
      });
      selectCell(2, 2);
      $(getCell(2, 2)).trigger("dblclick");
    });

    waits(10);

    runs(function () {
      $('body').click();
    });

    waits(10);

    runs(function () {
      expect(isAutocompleteVisible()).toEqual(false);
    });
  });
});