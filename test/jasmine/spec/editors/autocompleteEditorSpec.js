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
      destroy();
      this.$container.remove();
    }
  });

  it('should destroy editor when value change with mouse click on suggestion', function () {
    runs(function () {
      handsontable({
        autoComplete: getAutocompleteConfig(false),
        asyncRendering: false //TODO make sure tests pass also when async true
      });
      selectCell(2, 2);
      keyDownUp('enter');

      var li = autocomplete().$menu.find('li[data-value="green"]');
      li.trigger('mouseenter');
      li.trigger('click');
    });

    waitsFor(function () {
      return (getDataAtCell(2, 2) === 'green');
    }, 100);
  });

  it('should destroy editor when value change with Enter on suggestion', function () {
    handsontable({
      autoComplete: getAutocompleteConfig(true),
      asyncRendering: false //TODO make sure tests pass also when async true
    });
    selectCell(2, 2);
    keyDownUp('enter');

    waits(100);

    runs(function () {
      keyDownUp('arrow_down');
      keyDownUp('arrow_down');
      keyDownUp('arrow_down');
      keyDownUp('enter');
    });

    waitsFor(function () {
      return (getDataAtCell(2, 2) === 'green');
    }, 100);
  });

  it('should destroy editor when pressed Enter then Esc', function () {
    runs(function () {
      handsontable({
        autoComplete: getAutocompleteConfig(false),
        asyncRendering: false //TODO make sure tests pass also when async true
      });
      selectCell(2, 2);
      keyDownUp('enter');
      keyDownUp('esc');
    });

    waitsFor(nextFrame, 'next frame', 60);

    runs(function () {
      expect(isAutocompleteVisible()).toEqual(false);
    });
  });

  it('should destroy editor when mouse double clicked then Esc', function () {
    runs(function () {
      handsontable({
        autoComplete: getAutocompleteConfig(false),
        asyncRendering: false //TODO make sure tests pass also when async true
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
        autoComplete: getAutocompleteConfig(false),
        asyncRendering: false //TODO make sure tests pass also when async true
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
      },
      asyncRendering: false //TODO make sure tests pass also when async true
    });

    selectCell(1, 1);
    keyDownUp('enter');

    var $td = this.$container.find('.htCore tbody tr:eq(1) td:eq(1)');
    expect(keyProxy().width()).toEqual($td.width());
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
        },
        asyncRendering: false //TODO make sure tests pass also when async true
      });

      selectCell(1, 1);
      keyDownUp('enter');

      data[1][1] = "dddddddddddddddddddd";
      render();
    });

    waitsFor(nextFrame, 'next frame', 60);

    runs(function () {
      var $td = this.$container.find('.htCore tbody tr:eq(1) td:eq(1)');
      expect(autocompleteEditor().width()).toEqual($td.width());
    });
  });

  it('should show items as configured in cellProperties (async)', function () {
    var done = false;

    var url;
    if (window.location.href.indexOf('test/jasmine/') > -1) {
      url = '../../demo/json/autocomplete.json';
    }
    else {
      url = 'demo/json/autocomplete.json';
    }

    runs(function () {
      handsontable({
        columns: [
          {
            type: Handsontable.AutocompleteCell,
            options: {items: 10}, //`options` overrides `defaults` defined in bootstrap typeahead
            source: function (query, process) {
              $.ajax({
                url: url,
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
        ],
        asyncRendering: false //TODO make sure tests pass also when async true
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

  it('should return previous value when entered value didn\'t match to the list (async reponse is empty)', function () {
    var done = false;

    var url;
    if (window.location.href.indexOf('test/jasmine/') > -1) {
      url = '../../demo/json/autocomplete.json';
    }
    else {
      url = 'demo/json/autocomplete.json';
    }

    runs(function () {
      handsontable({
        data   : [['one','two'],['three','four']],
        columns: [
          {
            type: Handsontable.AutocompleteCell,
            options: {items: 10}, //`options` overrides `defaults` defined in bootstrap typeahead
            source: function (query, process) {
              $.ajax({
                url: url,
                data: {
                  query: query
                },
                success: function (response) {
                  process([]); // hardcoded empty result
                  done = true;
                }
              });
            },
            strict: true
          },
          { type : 'text'}
        ],
        asyncRendering: false //TODO make sure tests pass also when async true
      });
      selectCell(0, 0);
      keyDownUp('enter');
    });

    waitsFor(function () {
      return done;
    }, 1000);

    runs(function () {

      autocompleteEditor().val('non existent');
      keyDownUp('enter');

      expect(getData()).toEqual([['one','two'],['three','four']]);
    });

  });

  it('typing in textarea should refresh the lookup list', function () {
    runs(function () {
      handsontable({
        autoComplete: getAutocompleteConfig(false),
        asyncRendering: false //TODO make sure tests pass also when async true
      });
      selectCell(2, 2);
      keyDownUp('enter');

      autocomplete().$element.val("e");
      keyUp(69); //e
      expect(autocomplete().$menu.find('li:eq(0)').data('value')).toEqual('yellow');

      autocomplete().$element.val("ed");
      keyUp(68); //e
      expect(autocomplete().$menu.find('li:eq(0)').data('value')).toEqual('red');
    });
  });

  it('cancel editing (Esc) should restore the previous value', function () {
    runs(function () {
      handsontable({
        autoComplete: getAutocompleteConfig(false),
        asyncRendering: false //TODO make sure tests pass also when async true
      });
      setDataAtCell(2, 2, 'black');
      selectCell(2, 2);
      keyDownUp('enter');

      autocomplete().$element.val("ye");
      keyUp(69); //e
      keyDownUp('esc');
      expect(getDataAtCell(2, 2)).toEqual('black');
    });
  });

  it('finish editing should move the focus aways from textarea to table cell', function () {
    runs(function () {
      handsontable({
        autoComplete: getAutocompleteConfig(false)
      });
      setDataAtCell(2, 2, 'black');
      selectCell(2, 2);
    });

    waitsFor(nextFrame, 'next frame', 60);

    runs(function () {
      keyDownUp('enter');

    });

    waitsFor(nextFrame, 'next frame', 60);

    runs(function () {
      autocomplete().$element.val("ye");
      keyDownUp(69); //e
      deselectCell();
      keyDownUp('enter');
      expect(document.activeElement.nodeName).toEqual('TD');
    });
  });
});