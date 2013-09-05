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
    var hot = handsontable({
      autoComplete: getAutocompleteConfig(false)
    });
    selectCell(2, 2);

    mouseDoubleClick(getCell(2,2));

    waitsFor(function(){
      return hot.autocompleteEditor.isMenuExpanded();
    }, 'Autocomplete menu open', 1000);

    runs(function(){
      expect(isAutocompleteVisible()).toEqual(true);

      keyDownUp('esc');

      expect(isAutocompleteVisible()).toEqual(false);
    });
  });

  it('should destroy editor when clicked outside the table', function () {
    var hot = handsontable({
      autoComplete: getAutocompleteConfig(false)
    });
    selectCell(2, 2);

    mouseDoubleClick(getCell(2,2));

    waitsFor(function(){
      return hot.autocompleteEditor.isMenuExpanded();
    }, 'Autocomplete menu open', 1000);

    runs(function(){
      expect(isAutocompleteVisible()).toEqual(true);

      $('body').mousedown();

      expect(isAutocompleteVisible()).toEqual(false);
    });


  });

  it('should restore the old value when hovered over a autocomplete menu item and then clicked outside of the table', function () {
    handsontable({
      autoComplete: getAutocompleteConfig(true)
    });

    selectCell(2, 2);

    expect(getDataAtCell(2,2)).toBeNull();

    keyDownUp('enter');

    autocomplete().$menu.find('li:eq(1)').mouseenter();
    autocomplete().$menu.find('li:eq(1)').mouseleave();

    this.$container.mousedown();

    expect(getDataAtCell(2,2)).toBeNull();
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

  it('should use value not in list, when in non strict mode', function () {
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
          strict: false
        },
        { type: 'text'}
      ]
    });

    selectCell(0, 0);
    keyDownUp('enter');
    $('.handsontableInput').val('unexistent');
    keyDownUp('enter');

    expect(getData()).toEqual([
      ['unexistent', 'two'],
      ['three', 'four']
    ]);
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

  it("should fire one afterChange event when value is changed", function () {
    var hot = handsontable({
      autoComplete: getAutocompleteConfig(false)
    });

    var afterChangeCallback = jasmine.createSpy('afterChangeCallback');
    hot.addHook('afterChange', afterChangeCallback);

    selectCell(0,2);

    keyDownUp('enter');

    autocomplete().$menu.find('li:eq(1)').mouseenter().click();

    expect(getDataAtCell(0,2)).toEqual('red');

    expect(afterChangeCallback.calls.length).toEqual(1);
    expect(afterChangeCallback).toHaveBeenCalledWith([[0, 2, null, 'red']], 'edit', undefined, undefined, undefined);
  });

  it("should allow any value in non strict mode (close editor with ENTER)", function () {
    var hot = handsontable({
      autoComplete: getAutocompleteConfig(false)
    });

    selectCell(0,2);

    keyDownUp('enter');


    var editor = $('.handsontableInput');
    editor.val('foo');

    keyDownUp('enter');

    expect(getDataAtCell(0,2)).toEqual('foo');
  });

  it("should allow any value in non strict mode (close editor by clicking on table)", function () {
    var hot = handsontable({
      autoComplete: getAutocompleteConfig(false)
    });

    selectCell(0,2);

    keyDownUp('enter');

    var editor = $('.handsontableInput');
    editor.val('foo');

    this.$container.find('tbody tr:eq(0) td:eq(0)').mousedown();

    expect(getDataAtCell(0,2)).toEqual('foo');
  });

  it("should invoke beginEditing only once after dobleclicking on a cell (#1011)", function () {
    var hot = handsontable({
      autoComplete: getAutocompleteConfig(false)
    });

    selectCell(0, 2);

    spyOn(hot.autocompleteEditor, 'beginEditing');

    expect(hot.autocompleteEditor.beginEditing.calls.length).toBe(0);

    mouseDoubleClick(getCell(0, 2));

    expect(hot.autocompleteEditor.beginEditing.calls.length).toBe(1);

    mouseDoubleClick(getCell(1, 2));

    expect(hot.autocompleteEditor.beginEditing.calls.length).toBe(2);

    mouseDoubleClick(getCell(2, 2));

    expect(hot.autocompleteEditor.beginEditing.calls.length).toBe(3);
  });

  it("should not affect other cell values after clicking on autocomplete cell (#1021)", function () {
    var hot = handsontable({
      autoComplete: getAutocompleteConfig(false),
      data: [
        [null, null, 'yellow', null],
        [null, null, 'red', null],
        [null, null, 'blue', null]
      ]
    });

    expect(getCell(0, 2).innerText).toMatch('yellow');

    mouseDoubleClick(getCell(0, 2));

    expect(getCell(1, 2).innerText).toMatch('red');

    mouseDoubleClick(getCell(1, 2));

    expect(getCell(2, 2).innerText).toMatch('blue');

    mouseDoubleClick(getCell(2, 2));

    expect(getDataAtCol(2)).toEqual(['yellow', 'red', 'blue']);
  });

});