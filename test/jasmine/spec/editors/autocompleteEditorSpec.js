describe('AutocompleteEditor', function () {
  var id = 'testContainer';

  function getAutocompleteConfig(isStrict) {
    return [
      {
        match: function (row, col/*, data*/) {
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
    handsontable({
      autoComplete: getAutocompleteConfig(false)
    });
    selectCell(2, 2);
    keyDownUp('enter');

    var li = autocomplete().$menu.find('li[data-value="green"]');
    li.trigger('mouseenter');
    li.trigger('click');

    expect(getDataAtCell(2, 2)).toEqual('green')
  });

  it('should destroy editor when value change with Enter on suggestion', function () {
    handsontable({
      autoComplete: getAutocompleteConfig(true)
    });
    selectCell(2, 2);
    keyDownUp('enter');

    keyDownUp('arrow_down');
    keyDownUp('arrow_down');
    keyDownUp('arrow_down');
    keyDownUp('enter');

    expect(getDataAtCell(2, 2)).toEqual('green')
  });

  it('should destroy editor when pressed Enter then Esc', function () {
    handsontable({
      autoComplete: getAutocompleteConfig(false)
    });
    selectCell(2, 2);

    keyDownUp('enter');
    keyDownUp('esc');

    expect(isAutocompleteVisible()).toEqual(false);
  });

  it('should destroy editor when mouse double clicked then Esc', function () {
    handsontable({
      autoComplete: getAutocompleteConfig(false)
    });
    selectCell(2, 2);
    $(getCell(2, 2)).trigger("dblclick");

    keyDownUp('esc');

    expect(isAutocompleteVisible()).toEqual(false);
  });

  it('should destroy editor when clicked outside the table', function () {
    handsontable({
      autoComplete: getAutocompleteConfig(false)
    });
    selectCell(2, 2);
    $(getCell(2, 2)).trigger("dblclick");

    $('body').click();

    expect(isAutocompleteVisible()).toEqual(false);
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
        }
      });

      selectCell(1, 1);
      keyDownUp('enter');

      data[1][1] = "dddddddddddddddddddd";
      render();
    });

    waits(10);

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
                dataType: 'json',
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

    waits(10); //wait 10ms so menu has a chance to show up

    runs(function () {
      var li = autocomplete().$menu.find('li');
      expect(li.length).toEqual(10);
    });
  });

  it('strict mode should not use value if it doesn\'t match the list (async reponse is empty)', function () {
    var done = false
      , count = 0;

    var url;
    if (window.location.href.indexOf('test/jasmine/') > -1) {
      url = '../../demo/json/autocomplete.json';
    }
    else {
      url = 'demo/json/autocomplete.json';
    }

    runs(function () {
      handsontable({
        data: [
          ['one', 'two'],
          ['three', 'four']
        ],
        columns: [
          {
            allowInvalid: false,
            type: Handsontable.AutocompleteCell,
            options: {items: 10}, //`options` overrides `defaults` defined in bootstrap typeahead
            source: function (query, process) {
              $.ajax({
                url: url,
                data: {
                  query: query
                },
                dataType: 'json',
                success: function (/*response*/) {
                  process([]); // hardcoded empty result
                }
              });
            },
            strict: true
          },
          { type: 'text'}
        ],
        onChange: function (/*changes, source*/) {
          count++;
        },
        afterValidate: function (isValid, value) {
          if (isValid === false && value === 'unexistent') {
            done = true;
          }
        }
      });
      setDataAtCell(0, 0, 'unexistent');
    });

    waitsFor(function () {
      return done;
    }, 1000);

    runs(function () {
      expect(getData()).toEqual([
        ['one', 'two'],
        ['three', 'four']
      ]);
      expect(count).toEqual(1); //1 for loadData (it is not called after failed edit)
    });

  });

  it('strict mode should use value if it matches the list (sync response)', function () {
    var count = 0;

    handsontable({
      data: [
        ['one', 'two'],
        ['three', 'four']
      ],
      columns: [
        {
          allowInvalid: false,
          type: Handsontable.AutocompleteCell,
          options: {items: 10}, //`options` overrides `defaults` defined in bootstrap typeahead
          source: ['Acura', 'BMW', 'Bentley'],
          strict: true
        },
        { type: 'text'}
      ],
      onChange: function () {
        count++;
      }
    });
    setDataAtCell(0, 0, 'unexistent');

    expect(getData()).toEqual([
      ['one', 'two'],
      ['three', 'four']
    ]);
    expect(count).toEqual(1); //1 for loadData
  });

  it('strict mode should use value if it matches the list (async response)', function () {
    var done = false
      , count = 0;

    var url;
    if (window.location.href.indexOf('test/jasmine/') > -1) {
      url = '../../demo/json/autocomplete.json';
    }
    else {
      url = 'demo/json/autocomplete.json';
    }

    runs(function () {
      handsontable({
        data: [
          ['one', 'two'],
          ['three', 'four']
        ],
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
                dataType: 'json',
                success: function (response) {
                  process(response);
                }
              });
            },
            strict: true
          },
          { type: 'text'}
        ],
        onChange: function (changes, source) {
          count++;
          if (source === 'edit') {
            done = true;
          }
        }
      });
      setDataAtCell(0, 0, 'Acura');
    });

    waitsFor(function () {
      return done;
    }, 1000);

    runs(function () {
      expect(getData()).toEqual([
        ['Acura', 'two'],
        ['three', 'four']
      ]);
      expect(count).toEqual(2); //1 for loadData, 1 for edit
    });

  });

  it('typing in textarea should refresh the lookup list', function () {
    handsontable({
      autoComplete: getAutocompleteConfig(false)
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

  it('should be able to use empty value ("")', function () {

    handsontable({
      data: [
        ['one', 'two'],
        ['three', 'four']
      ],
      columns: [
        {
          type: Handsontable.AutocompleteCell,
          source: ['', 'BMW', 'Bentley'],
          strict: true
        },
        { type: 'text'}
      ]
    });

    selectCell(0, 0);
    keyDownUp('enter');

    autocomplete().$menu.find('li:eq(0)').trigger('click');

    expect(getDataAtCell(0, 0)).toEqual('');

  });

  it('cancel editing (Esc) should restore the previous value', function () {
    handsontable({
      autoComplete: getAutocompleteConfig(false)
    });
    setDataAtCell(2, 2, 'black');
    selectCell(2, 2);
    keyDownUp('enter');

    autocomplete().$element.val("ye");
    keyUp(69); //e
    keyDownUp('esc');
    expect(getDataAtCell(2, 2)).toEqual('black');
  });

  it('finish editing should move the focus aways from textarea to table cell', function () {
    var last;
    var finishEdit = false;

    handsontable({
      autoComplete: getAutocompleteConfig(false)
    });

    setDataAtCell(2, 2, 'black');
    selectCell(2, 2);

    last = document.activeElement;

    keyDownUp('enter');

    autocomplete().$element.val("ye");
    keyDownUp(69); //e
    deselectCell();
    setTimeout(function(){
      keyDownUp('enter');
     finishEdit = true;
    },0);

    waitsFor(function(){
      return finishEdit;
    }, 'Edition finish', 1000);

    runs(function(){
      expect(document.activeElement.nodeName).toEqual(last.nodeName);
    });

  });
});