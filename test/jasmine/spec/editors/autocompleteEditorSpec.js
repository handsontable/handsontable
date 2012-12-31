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

  it('autocomplete textarea should have cell dimensions', function () {
    var data = [
      ["a", "b"],
      ["c", "d"]
    ];

    handsontable({
      data: data,
      minRows: 4,
      minCols: 4,
      minSpareRows: 4,
      minSpareCols: 4,
      cells: function () {
        return {
          type: Handsontable.AutocompleteCell
        };
      }
    });

    selectCell(1, 1);
    keyDownUp('enter');

    var $td = this.$container.find('.htCore tbody tr:eq(1) td:eq(1)');
    expect(this.$keyboardProxy.width()).toEqual($td.width());
  });

  it('autocomplete textarea should have cell dimensions (after render)', function () {
    runs(function () {
      var data = [
        ["a", "b"],
        ["c", "d"]
      ];

      handsontable({
        data: data,
        minRows: 4,
        minCols: 4,
        minSpareRows: 4,
        minSpareCols: 4,
        cells: function () {
          return {
            type: Handsontable.AutocompleteCell
          };
        }
      });

      selectCell(1, 1);
      keyDownUp('enter');

      data[1][1] = "dddddddddddddddddddd";
      render();
    });

    waits(1);

    runs(function () {
      var $td = this.$container.find('.htCore tbody tr:eq(1) td:eq(1)');
      expect(this.$keyboardProxy.width()).toEqual($td.width());
    });
  });

  it('should show items as configured in cellProperties (async)', function () {
    var done = false;
    runs(function () {
      handsontable({
        columns: [
          {
            type: Handsontable.AutocompleteCell,
            options: {items: 10}, //`options` overrides `defaults` defined in bootstrap typeahead
            source: function (query, process) {
              $.ajax({
                url: '../../demo/php/cars.php',
                data: {
                  query: query
                },
                success: function (response) {
                  process(response);
                  done = true;
                }
              });
            },
            strict: true
          },
          {},
          {},
          {}
        ]
      });
      selectCell(0, 0);
      keyDownUp('enter');
    });

    waitsFor(function () {
      return done;
    }, 1000);

    runs(function () {
      var li = autocomplete().$menu.find('li');
      expect(li.length).toEqual(10);
    });
  });
});