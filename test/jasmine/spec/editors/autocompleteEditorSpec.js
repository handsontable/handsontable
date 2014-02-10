describe('AutocompleteEditor', function () {
  var id = 'testContainer';

  var choices = ["yellow", "red", "orange", "green", "blue", "gray", "black", "white"];

  beforeEach(function () {
    this.$container = $('<div id="' + id + '"></div>').appendTo('body');
  });

  afterEach(function () {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  describe("open editor", function () {
    it("should display editor (after hitting ENTER)", function () {

      handsontable({
        columns: [
          {
            editor: 'autocomplete',
            source: choices
          }
        ]
      });

      selectCell(0, 0);

      var editor = $('.autocompleteEditor');

      expect(editor.is(':visible')).toBe(false);

      keyDownUp('enter');

      expect(editor.is(':visible')).toBe(true);

    });

    it("should display editor (after hitting F2)", function () {

      handsontable({
        columns: [
          {
            editor: 'autocomplete',
            source: choices
          }
        ]
      });

      selectCell(0, 0);

      var editor = $('.autocompleteEditor');

      expect(editor.is(':visible')).toBe(false);

      keyDownUp('f2');

      expect(editor.is(':visible')).toBe(true);

    });

    it("should display editor (after doubleclicking)", function () {

      handsontable({
        columns: [
          {
            editor: 'autocomplete',
            source: choices
          }
        ]
      });

      selectCell(0, 0);

      var editor = $('.autocompleteEditor');

      expect(editor.is(':visible')).toBe(false);

      mouseDoubleClick($(getCell(0, 0)));

      expect(editor.is(':visible')).toBe(true);

    });
  });

  describe("choices", function () {

    it("should display given choices (array)", function () {

      handsontable({
        columns: [
          {
            editor: 'autocomplete',
            source: choices
          }
        ]
      });

      selectCell(0, 0);

      var editor = $('.autocompleteEditor');

      keyDownUp('enter');

      waits(100); //List filtering in async

      runs(function () {
        expect(editor.find('tbody td:eq(0)').text()).toEqual(choices[0]);
        expect(editor.find('tbody td:eq(1)').text()).toEqual(choices[1]);
        expect(editor.find('tbody td:eq(2)').text()).toEqual(choices[2]);
        expect(editor.find('tbody td:eq(3)').text()).toEqual(choices[3]);
        expect(editor.find('tbody td:eq(4)').text()).toEqual(choices[4]);
      });

    });

    it("should display given choices (sync function)", function () {

      var syncSources = jasmine.createSpy('syncSources');

      syncSources.plan = function (query, process) {
        process(choices);
      };

      handsontable({
        columns: [
          {
            editor: 'autocomplete',
            source: syncSources
          }
        ]
      });

      selectCell(0, 0);

      var editor = $('.autocompleteEditor');

      syncSources.reset();
      keyDownUp('enter');

      waitsFor(function () {
        return syncSources.calls.length > 0;
      }, 'Source function call', 1000);

      runs(function () {
        expect(editor.find('tbody td:eq(0)').text()).toEqual(choices[0]);
        expect(editor.find('tbody td:eq(1)').text()).toEqual(choices[1]);
        expect(editor.find('tbody td:eq(2)').text()).toEqual(choices[2]);
        expect(editor.find('tbody td:eq(3)').text()).toEqual(choices[3]);
        expect(editor.find('tbody td:eq(4)').text()).toEqual(choices[4]);
      });

    });

    it("should display given choices (async function)", function () {

      var asyncSources = jasmine.createSpy('asyncSources');

      asyncSources.plan = function (process) {
        process(choices);
      };

      handsontable({
        columns: [
          {
            editor: 'autocomplete',
            source: function (query, process) {
              setTimeout(function () {
                asyncSources(process);
              }, 0);
            }
          }
        ]
      });

      selectCell(0, 0);

      var editor = $('.autocompleteEditor');

      keyDownUp('enter');

      waitsFor(function () {
        return asyncSources.calls.length > 0;
      }, 'asyncSources call', 1000);

      runs(function () {
        expect(asyncSources.calls.length).toEqual(1);
        expect(editor.find('tbody td:eq(0)').text()).toEqual(choices[0]);
        expect(editor.find('tbody td:eq(1)').text()).toEqual(choices[1]);
        expect(editor.find('tbody td:eq(2)').text()).toEqual(choices[2]);
        expect(editor.find('tbody td:eq(3)').text()).toEqual(choices[3]);
        expect(editor.find('tbody td:eq(4)').text()).toEqual(choices[4]);
      });

    });


    it('autocomplete list should have textarea dimensions', function () {
      var syncSources = jasmine.createSpy('syncSources');

      syncSources.plan = function (query, process) {
        process(choices);
      };

      handsontable({
        colWidths: [200],
        columns: [
          {
            editor: 'autocomplete',
            source: syncSources
          }
        ]
      });

      selectCell(0, 0);

      var editor = $('.handsontableInputHolder');

      syncSources.reset();
      keyDownUp('enter');

      waitsFor(function () {
        return syncSources.calls.length > 0;
      }, 'Source function call', 1000);

      runs(function () {
        expect(editor.find('.autocompleteEditor .htCore td').width()).toEqual(editor.find('.handsontableInput').width());
        expect(editor.find('.autocompleteEditor .htCore td').width()).toBeGreaterThan(188);
      });
    });

    xit('autocomplete textarea should have cell dimensions (after render)', function () {
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

    it("should invoke beginEditing only once after dobleclicking on a cell (#1011)", function () {
      var hot = handsontable({
        columns: [
          {},{},
          {
            type: 'autocomplete',
            source: choices
          }
        ]
      });

      selectCell(0, 2);

      spyOn(hot.getActiveEditor(), 'beginEditing');

      expect(hot.getActiveEditor().beginEditing.calls.length).toBe(0);

      mouseDoubleClick(getCell(0, 2));

      expect(hot.getActiveEditor().beginEditing.calls.length).toBe(1);

      mouseDoubleClick(getCell(1, 2));

      expect(hot.getActiveEditor().beginEditing.calls.length).toBe(2);

      mouseDoubleClick(getCell(2, 2));

      expect(hot.getActiveEditor().beginEditing.calls.length).toBe(3);
    });

  });

  describe("closing editor", function () {
    it('should destroy editor when value change with mouse click on suggestion', function () {
      var syncSources = jasmine.createSpy('syncSources');

      syncSources.plan = function (query, process) {
        process(choices);
      };

      handsontable({
        columns: [
          {
            editor: 'autocomplete',
            source: syncSources
          }
        ]
      });

      selectCell(0, 0);
      keyDownUp('enter');

      waitsFor(function () {
        return syncSources.calls.length > 0;
      }, 'Source function call', 1000);

      runs(function () {
        autocomplete().find('tbody td:eq(3)').mousedown();

        expect(getDataAtCell(0, 0)).toEqual('green');
      });

    });

    it('should destroy editor when value change with Enter on suggestion', function () {
      var syncSources = jasmine.createSpy('syncSources');

      syncSources.plan = function (query, process) {
        process(choices);
      };

      handsontable({
        columns: [
          {
            editor: 'autocomplete',
            source: syncSources
          }
        ]
      });

      selectCell(0, 0);
      keyDownUp('enter');

      waitsFor(function () {
        return syncSources.calls.length > 0;
      }, 'Source function call', 1000);

      runs(function () {
        keyDownUp('arrow_down');
        keyDownUp('arrow_down');
        keyDownUp('arrow_down');
        keyDownUp('arrow_down');
        keyDownUp('enter');

        expect(getDataAtCell(0, 0)).toEqual('green')
      });


    });

    it('should destroy editor when pressed Enter then Esc', function () {
      var syncSources = jasmine.createSpy('syncSources');

      syncSources.plan = function (query, process) {
        process(choices);
      };

      handsontable({
        columns: [
          {
            editor: 'autocomplete',
            source: syncSources
          }
        ]
      });

      selectCell(0, 0);

      keyDownUp('enter');


      waitsFor(function () {
        return syncSources.calls.length > 0;
      }, 'Source function call', 1000);

      runs(function () {

        expect(autocompleteEditor().is(":visible")).toBe(true);

        keyDownUp('esc');

        expect(autocompleteEditor().is(":visible")).toBe(false);
      });


    });

    it('should destroy editor when mouse double clicked then Esc', function () {
      var syncSources = jasmine.createSpy('syncSources');

      syncSources.plan = function (query, process) {
        process(choices);
      };

      handsontable({
        columns: [
          {
            editor: 'autocomplete',
            source: syncSources
          }
        ]
      });

      selectCell(0, 0);
      mouseDoubleClick(getCell(0, 0));

      waitsFor(function () {
        return syncSources.calls.length > 0;
      }, 'Source function call', 1000);

      runs(function () {

        expect(autocompleteEditor().is(":visible")).toBe(true);

        keyDownUp('esc');

        expect(autocompleteEditor().is(":visible")).toBe(false);
      });

    });

    it('cancel editing (Esc) should restore the previous value', function () {
      var syncSources = jasmine.createSpy('syncSources');

      syncSources.plan = function (query, process) {
        process(choices);
      };

      handsontable({
        columns: [
          {
            editor: 'autocomplete',
            source: syncSources
          }
        ]
      });

      setDataAtCell(0, 0, 'black');
      selectCell(0, 0);
      keyDownUp('enter');

      waitsFor(function () {
        return syncSources.calls.length > 0;
      }, 'Source function call', 1000);

      runs(function () {

        autocomplete().siblings('.handsontableInput').val("ye");
        keyDownUp(69); //e
        keyDownUp('esc');
        expect(getDataAtCell(0, 0)).toEqual('black');

      });


    });

    it('should destroy editor when clicked outside the table', function () {
      var syncSources = jasmine.createSpy('syncSources');

      syncSources.plan = function (query, process) {
        process(choices);
      };

      handsontable({
        columns: [
          {
            editor: 'autocomplete',
            source: syncSources
          }
        ]
      });

      selectCell(0, 0);
      mouseDoubleClick(getCell(0, 0));

      waitsFor(function () {
        return syncSources.calls.length > 0;
      }, 'Source function call', 1000);

      runs(function(){
        expect(autocompleteEditor().is(":visible")).toBe(true);

        $('body').mousedown();

        expect(autocompleteEditor().is(":visible")).toBe(false);
      });


    });

    it('finish editing should move the focus aways from textarea to table cell', function () {
      var last;
      var finishEdit = false;

      var syncSources = jasmine.createSpy('syncSources');

      syncSources.plan = function (query, process) {
        process(choices);
      };

      handsontable({
        columns: [
          {
            editor: 'autocomplete',
            source: syncSources
          }
        ]
      });

      setDataAtCell(0, 0, 'black');
      selectCell(0, 0);

      last = document.activeElement;

      keyDownUp('enter');

      waitsFor(function () {
        return syncSources.calls.length > 0;
      }, 'Source function call', 1000);

      runs(function () {

        autocomplete().siblings('.handsontableInput').val("ye");
        keyDownUp(69); //e
        deselectCell();

        setTimeout(function(){
          keyDownUp('enter');
          finishEdit = true;
        });

      });

      waitsFor(function(){
        return finishEdit;
      }, 'Edition finish', 1000);

      runs(function(){
        expect(document.activeElement.nodeName).toEqual(last.nodeName);
      });

    });

  });

  describe("non strict mode", function () {

    it("should allow any value in non strict mode (close editor with ENTER)", function () {
      var syncSources = jasmine.createSpy('syncSources');

      syncSources.plan = function (query, process) {
        process(choices);
      };

      handsontable({
        columns: [
          {
            editor: 'autocomplete',
            source: syncSources
          }
        ]
      });

      selectCell(0,0);

      keyDownUp('enter');

      waitsFor(function () {
        return syncSources.calls.length > 0;
      }, 'Source function call', 1000);

      runs(function () {

        var editor = $('.handsontableInput');
        editor.val('foo');

        keyDownUp('enter');

        expect(getDataAtCell(0,0)).toEqual('foo');

      });

    });

    it("should allow any value in non strict mode (close editor by clicking on table)", function () {
      var syncSources = jasmine.createSpy('syncSources');

      syncSources.plan = function (query, process) {
        process(choices);
      };

      handsontable({
        columns: [
          {
            editor: 'autocomplete',
            source: syncSources
          }
        ]
      });

      selectCell(0,0);

      keyDownUp('enter');

      waitsFor(function () {
        return syncSources.calls.length > 0;
      }, 'Source function call', 1000);

      runs(function () {

        var editor = $('.handsontableInput');
        editor.val('foo');

        this.$container.find('tbody tr:eq(1) td:eq(0)').mousedown();

        expect(getDataAtCell(0,0)).toEqual('foo');

      });
    });

    it("should save the value from textarea after hitting ENTER", function () {
      var syncSources = jasmine.createSpy('syncSources');

      syncSources.plan = function (query, process) {
        process(choices.filter(function(choice){
          return choice.indexOf(query) != -1;
        }));
      };

      handsontable({
        columns: [
          {
            editor: 'autocomplete',
            source: syncSources
          }
        ]
      });

      selectCell(0, 0);
      var editorInput = $('.handsontableInput');

      expect(getDataAtCell(0, 0)).toBeNull();

      keyDownUp('enter');

      waitsFor(function () {
        return syncSources.calls.length > 0;
      }, 'Source function call', 1000);

      runs(function () {
        syncSources.reset();

        editorInput.val("b");
        keyDownUp("b".charCodeAt(0));
      });

      waitsFor(function () {
        return syncSources.calls.length > 0;
      }, 'Source function call', 1000);

      runs(function () {

        var innerHot = autocomplete().handsontable('getInstance');

        expect(innerHot.getData()).toEqual([ [ 'blue' ], ['black'] ]);

        var selected = innerHot.getSelected();

        expect(selected).toBeUndefined();

        keyDownUp('enter');

        expect(getDataAtCell(0, 0)).toEqual('b');
      });

    });

    });

  describe("strict mode", function () {

    it('strict mode should NOT use value if it DOES NOT match the list (sync reponse is empty)', function () {

      var onAfterValidate = jasmine.createSpy('onAfterValidate');
      var onAfterChange = jasmine.createSpy('onAfterChange');
      var syncSources = jasmine.createSpy('syncSources');

      syncSources.plan = function (query, process) {
        process([]); // hardcoded empty result
      };

      handsontable({
        data: [
          ['one', 'two'],
          ['three', 'four']
        ],
        columns: [
          {
            type: 'autocomplete',
            source: syncSources,
            allowInvalid: false,
            strict: true
          },
          {

          }
        ],
        afterValidate: onAfterValidate,
        afterChange: onAfterChange
      });

      setDataAtCell(0, 0, 'unexistent');

      waitsFor(function () {
        return onAfterValidate.calls.length > 0;
      }, 'Cell validation', 1000);

      runs(function () {

        expect(getData()).toEqual([
          ['one', 'two'],
          ['three', 'four']
        ]);

        expect(syncSources.calls.length).toEqual(1);
        expect(onAfterValidate.calls.length).toEqual(1);
        expect(onAfterChange.calls.length).toEqual(1); //1 for loadData (it is not called after failed edit)

      });
    });

    it('strict mode should use value if it DOES match the list (sync reponse is not empty)', function () {

      var onAfterValidate = jasmine.createSpy('onAfterValidate');
      var onAfterChange = jasmine.createSpy('onAfterChange');
      var syncSources = jasmine.createSpy('asyncSources');

      syncSources.plan = function (query, process) {
        process(choices); // hardcoded empty result
      };

      handsontable({
        data: [
          ['one', 'two'],
          ['three', 'four']
        ],
        columns: [
          {
            type: 'autocomplete',
            source: syncSources,
            allowInvalid: false,
            strict: true
          },
          {

          }
        ],
        afterValidate: onAfterValidate,
        afterChange: onAfterChange
      });

      setDataAtCell(0, 0, 'yellow');

      waitsFor(function () {
        return onAfterValidate.calls.length > 0;
      }, 'Cell validation', 1000);

      runs(function () {

        expect(getData()).toEqual([
          ['yellow', 'two'],
          ['three', 'four']
        ]);

        expect(syncSources.calls.length).toEqual(1);
        expect(onAfterValidate.calls.length).toEqual(1);
        expect(onAfterChange.calls.length).toEqual(2); //1 for loadData and 1 for setDataAtCell

      });
    });

    it('strict mode should NOT use value if it DOES NOT match the list (async reponse is empty)', function () {

      var onAfterValidate = jasmine.createSpy('onAfterValidate');
      var onAfterChange = jasmine.createSpy('onAfterChange');
      var asyncSources = jasmine.createSpy('asyncSources');

      asyncSources.plan = function (query, process) {
        setTimeout(function () {
          process([]); // hardcoded empty result
        });
      };

      handsontable({
        data: [
          ['one', 'two'],
          ['three', 'four']
        ],
        columns: [
          {
            type: 'autocomplete',
            source: asyncSources,
            allowInvalid: false,
            strict: true
          },
          {

          }
        ],
        afterValidate: onAfterValidate,
        afterChange: onAfterChange
      });

      setDataAtCell(0, 0, 'unexistent');

      waitsFor(function () {
        return onAfterValidate.calls.length > 0;
      }, 'Cell validation', 1000);

      runs(function () {

        expect(getData()).toEqual([
          ['one', 'two'],
          ['three', 'four']
        ]);

        expect(asyncSources.calls.length).toEqual(1);
        expect(onAfterValidate.calls.length).toEqual(1);
        expect(onAfterChange.calls.length).toEqual(1); //1 for loadData (it is not called after failed edit)

      });
    });

    it('strict mode should use value if it DOES match the list (async reponse is not empty)', function () {

      var onAfterValidate = jasmine.createSpy('onAfterValidate');
      var onAfterChange = jasmine.createSpy('onAfterChange');
      var asyncSources = jasmine.createSpy('asyncSources');

      asyncSources.plan = function (query, process) {
        setTimeout(function () {
          process(choices); // hardcoded empty result
        });
      };

      handsontable({
        data: [
          ['one', 'two'],
          ['three', 'four']
        ],
        columns: [
          {
            type: 'autocomplete',
            source: asyncSources,
            allowInvalid: false,
            strict: true
          },
          {

          }
        ],
        afterValidate: onAfterValidate,
        afterChange: onAfterChange
      });

      setDataAtCell(0, 0, 'yellow');

      waitsFor(function () {
        return onAfterValidate.calls.length > 0;
      }, 'Cell validation', 1000);

      runs(function () {

        expect(getData()).toEqual([
          ['yellow', 'two'],
          ['three', 'four']
        ]);

        expect(asyncSources.calls.length).toEqual(1);
        expect(onAfterValidate.calls.length).toEqual(1);
        expect(onAfterChange.calls.length).toEqual(2); //1 for loadData and 1 for setDataAtCell

      });
    });

    it('strict mode mark value as invalid if it DOES NOT match the list (sync reponse is empty)', function () {

      var onAfterValidate = jasmine.createSpy('onAfterValidate');
      var onAfterChange = jasmine.createSpy('onAfterChange');
      var syncSources = jasmine.createSpy('syncSources');

      syncSources.plan = function (query, process) {
        process([]); // hardcoded empty result
      };

      handsontable({
        data: [
          ['one', 'two'],
          ['three', 'four']
        ],
        columns: [
          {
            type: 'autocomplete',
            source: syncSources,
            allowInvalid: true,
            strict: true
          },
          {

          }
        ],
        afterValidate: onAfterValidate,
        afterChange: onAfterChange
      });

      expect(getCellMeta(0, 0).valid).not.toBe(false);
      expect($(getCell(0, 0)).hasClass('htInvalid')).toBe(false);

      setDataAtCell(0, 0, 'unexistent');

      waitsFor(function () {
        return onAfterValidate.calls.length > 0;
      }, 'Cell validation', 1000);

      runs(function () {

        expect(getData()).toEqual([
          ['unexistent', 'two'],
          ['three', 'four']
        ]);

        expect(getCellMeta(0, 0).valid).toBe(false);
        expect($(getCell(0, 0)).hasClass('htInvalid')).toBe(true);

      });
    });

    it("should select the best matching option after hitting ENTER", function () {
      var onAfterValidate = jasmine.createSpy('onAfterValidate');
      var syncSources = jasmine.createSpy('syncSources');

      syncSources.plan = function (query, process) {
        process(choices.filter(function(choice){
          return choice.indexOf(query) != -1;
        }));
      };

      handsontable({
        columns: [
          {
            editor: 'autocomplete',
            source: syncSources,
            strict: true
          }
        ],
        afterValidate: onAfterValidate
      });

      selectCell(0, 0);
      var editorInput = $('.handsontableInput');

      expect(getDataAtCell(0, 0)).toBeNull();

      keyDownUp('enter');

      waitsFor(function () {
        return syncSources.calls.length > 0;
      }, 'Source function call', 1000);

      runs(function () {
        syncSources.reset();

        editorInput.val("b");
        keyDownUp("b".charCodeAt(0));
      });

      waitsFor(function () {
        return syncSources.calls.length > 0;
      }, 'Source function call', 1000);

      runs(function () {

        var innerHot = autocomplete().handsontable('getInstance');

        expect(innerHot.getData()).toEqual([ [ 'blue' ], ['black'] ]);

        var selected = innerHot.getSelected();
        var selectedData = innerHot.getDataAtCell(selected[0], selected[1]);

        expect(selectedData).toEqual('blue');

        onAfterValidate.reset();

        keyDownUp('enter');

      });

      waitsFor(function () {
        return onAfterValidate.call.length > 0;
      }, 'Cell validation', 1000);

      runs(function () {
         expect(getDataAtCell(0, 0)).toEqual('blue');
      });

    });

    it("should select the best matching option after hitting TAB", function () {
      var onAfterValidate = jasmine.createSpy('onAfterValidate');
      var syncSources = jasmine.createSpy('syncSources');

      syncSources.plan = function (query, process) {
        process(choices.filter(function(choice){
          return choice.indexOf(query) != -1;
        }));
      };

      handsontable({
        columns: [
          {
            editor: 'autocomplete',
            source: syncSources,
            strict: true
          }
        ],
        afterValidate: onAfterValidate
      });

      selectCell(0, 0);
      var editorInput = $('.handsontableInput');

      expect(getDataAtCell(0, 0)).toBeNull();

      keyDownUp('enter');

      waitsFor(function () {
        return syncSources.calls.length > 0;
      }, 'Source function call', 1000);

      runs(function () {
        syncSources.reset();

        editorInput.val("b");
        keyDownUp("b".charCodeAt(0));
      });

      waitsFor(function () {
        return syncSources.calls.length > 0;
      }, 'Source function call', 1000);

      runs(function () {

        var innerHot = autocomplete().handsontable('getInstance');

        expect(innerHot.getData()).toEqual([ [ 'blue' ], ['black'] ]);

        var selected = innerHot.getSelected();
        var selectedData = innerHot.getDataAtCell(selected[0], selected[1]);

        expect(selectedData).toEqual('blue');

        onAfterValidate.reset();

        keyDownUp('tab');

      });

      waitsFor(function () {
        return onAfterValidate.call.length > 0;
      }, 'Cell validation', 1000);

      runs(function () {
        expect(getDataAtCell(0, 0)).toEqual('blue');
      });

    });

    it("should mark list item corresponding to current cell value as selected", function () {
      var syncSources = jasmine.createSpy('syncSources');

      syncSources.plan = function (query, process) {
        process(['red', 'dark-yellow', 'yellow', 'light-yellow', 'black']);
      };

      handsontable({
        columns: [
          {
            editor: 'autocomplete',
            source: syncSources,
            strict: true
          }
        ],
        data: [
          ['yellow'],
          ['red'],
          ['blue']
        ]
      });

      selectCell(0, 0);

      keyDownUp('enter');

      waitsFor(function () {
        return syncSources.calls.length > 0;
      }, 'Source function call', 1000);

      runs(function () {
        expect(autocomplete().find('.current').text()).toEqual(getDataAtCell(0, 0));
      });

    });


  });

  describe("filtering", function () {

    it('typing in textarea should filter the lookup list', function () {
      var syncSources = jasmine.createSpy('syncSources');

      syncSources.plan = function (query, process) {
        process(choices.filter(function(choice){
          return choice.indexOf(query) != -1;
        }));
      };

      handsontable({
        columns: [
          {
            editor: 'autocomplete',
            source: syncSources
          }
        ]
      });

      selectCell(0, 0);
      var editorInput = $('.handsontableInput');

      expect(getDataAtCell(0, 0)).toBeNull();

      keyDownUp('enter');

      waitsFor(function () {
        return syncSources.calls.length > 0;
      }, 'Source function call', 1000);

      runs(function () {

        syncSources.reset();

        editorInput.val("e");
        keyDownUp(69); //e


      });

      waitsFor(function () {
        return syncSources.calls.length > 0;
      }, 'Source function call', 1000);

      runs(function () {
        expect(autocomplete().handsontable('getData')).toEqual([ [ 'yellow' ], [ 'red' ], [ 'orange' ], [ 'green' ], [ 'blue' ], [ 'white' ] ]);

        syncSources.reset();

        editorInput.val("ed");
        keyDownUp(68); //d
      });

      waitsFor(function () {
        return syncSources.calls.length > 0;
      }, 'Source function call', 1000);

      runs(function () {
        expect(autocomplete().handsontable('getData')).toEqual([ [ 'red' ] ]);
      });
    });
    it('default filtering should be case insensitive', function () {


      handsontable({
        columns: [
          {
            editor: 'autocomplete',
            source: choices
          }
        ]
      });

      selectCell(0, 0);
      var editorInput = $('.handsontableInput');

      expect(getDataAtCell(0, 0)).toBeNull();

      keyDownUp('enter');


      editorInput.val("e");
      keyDownUp(69); //e



      waits(50); //filtering is always async

      runs(function () {
        expect(autocomplete().handsontable('getData')).toEqual([ [ 'yellow' ], [ 'red' ], [ 'orange' ], [ 'green' ], [ 'blue' ], [ 'white' ] ]);

        editorInput.val("E");
        keyDownUp(69); //E (same as "e")
      });

      waits(50); //filtering is always async

      runs(function () {
        expect(autocomplete().handsontable('getData')).toEqual([ [ 'yellow' ], [ 'red' ], [ 'orange' ], [ 'green' ], [ 'blue' ], [ 'white' ] ]);
      });
    });
    it('default filtering should be case sensitive when filteringCaseSensitive is false', function () {


      handsontable({
        columns: [
          {
            editor: 'autocomplete',
            source: choices,
            filteringCaseSensitive: true
          }
        ]
      });

      selectCell(0, 0);
      var editorInput = $('.handsontableInput');

      expect(getDataAtCell(0, 0)).toBeNull();

      keyDownUp('enter');


      editorInput.val("e");
      keyDownUp(69); //e



      waits(50); //filtering is always async

      runs(function () {
        expect(autocomplete().handsontable('getData')).toEqual([ [ 'yellow' ], [ 'red' ], [ 'orange' ], [ 'green' ], [ 'blue' ], [ 'white' ] ]);

        editorInput.val("E");
        keyDownUp(69); //E (same as "e")
      });

      waits(50); //filtering is always async

      runs(function () {
        expect(autocomplete().handsontable('getData')).toEqual([ ]);
      });
    });
    it('typing in textarea should NOT filter the lookup list when filtering is disabled', function () {

      handsontable({
        columns: [
          {
            editor: 'autocomplete',
            source: choices,
            filter: false
          }
        ]
      });

      selectCell(0, 0);
      var editorInput = $('.handsontableInput');

      expect(getDataAtCell(0, 0)).toBeNull();

      keyDownUp('enter');

      waits(20);

      runs(function () {

        editorInput.val("e");
        keyDownUp("e".charCodeAt(0)); //e

      });

      waits(20);

      runs(function () {
        expect(autocomplete().handsontable('getData')).toEqual(Handsontable.helper.pivot([choices]));

        editorInput.val("ed");
        keyDownUp("d".charCodeAt(0)); //d
      });

      waits(20);

      runs(function () {
        expect(autocomplete().handsontable('getData')).toEqual(Handsontable.helper.pivot([choices]));
      });




    });

    it('typing in textarea should highlight the matching phrase', function () {
      var choices = ['Male', 'Female'];

      var syncSources = jasmine.createSpy('syncSources');

      syncSources.plan = function (query, process) {
        process(choices.filter(function(choice){
          return choice.search(new RegExp(query, 'i')) != -1;
        }));
      };

      handsontable({
        columns: [
          {
            editor: 'autocomplete',
            source: syncSources,
            filter: false
          }
        ]
      });

      selectCell(0, 0);
      var editorInput = $('.handsontableInput');

      expect(getDataAtCell(0, 0)).toBeNull();

      keyDownUp('enter');

      waitsFor(function () {
        return syncSources.calls.length > 0;
      }, 'Source function call', 1000);

      runs(function () {

        syncSources.reset();

        editorInput.val("Male");
        keyDownUp(69); //e


      });

      waitsFor(function () {
        return syncSources.calls.length > 0;
      }, 'Source function call', 1000);

      runs(function () {
        var autocompleteList = autocomplete().handsontable('getInstance').rootElement;
        expect(autocompleteList.find('td:eq(0)').html()).toMatch(/<(strong|STRONG)>Male<\/(strong|STRONG)>/); //IE8 makes the tag names UPPERCASE
        expect(autocompleteList.find('td:eq(1)').html()).toMatch(/Fe<(strong|STRONG)>male<\/(strong|STRONG)>/);

        syncSources.reset();
      });
    });

    it('text in textarea should not be interpreted as regexp', function () {
      spyOn(Handsontable.editors.AutocompleteEditor.prototype, 'queryChoices').andCallThrough();
      var queryChoices = Handsontable.editors.AutocompleteEditor.prototype.queryChoices;

      handsontable({
        columns: [
          {
            editor: 'autocomplete',
            source: choices
          }
        ]
      });

      selectCell(0, 0);
      var editorInput = $('.handsontableInput');

      expect(getDataAtCell(0, 0)).toBeNull();

      keyDownUp('enter');

      waitsFor(function () {
        return queryChoices.calls.length > 0;
      }, 'Source function call', 1000);

      runs(function () {

        queryChoices.reset();

        editorInput.val("yellow|red");
        keyDownUp("d".charCodeAt(0));


      });

      waitsFor(function () {
        return queryChoices.calls.length > 0;
      }, 'Source function call', 1000);

      runs(function () {
        expect(autocomplete().handsontable('getData').length).toEqual(0);
      });
    });

    it('text in textarea should not be interpreted as regexp when highlighting the matching phrase', function () {
      var choices = ['Male', 'Female'];

      var syncSources = jasmine.createSpy('syncSources');

      syncSources.plan = function (query, process) {
        process(choices.filter(function(choice){
          return choice.search(new RegExp(query, 'i')) != -1;
        }));
      };

      handsontable({
        columns: [
          {
            editor: 'autocomplete',
            source: syncSources,
            filter: false
          }
        ]
      });

      selectCell(0, 0);
      var editorInput = $('.handsontableInput');

      expect(getDataAtCell(0, 0)).toBeNull();

      keyDownUp('enter');

      waitsFor(function () {
        return syncSources.calls.length > 0;
      }, 'Source function call', 1000);

      runs(function () {

        syncSources.reset();

        editorInput.val("M|F");
        keyDownUp('F'.charCodeAt(0));


      });

      waitsFor(function () {
        return syncSources.calls.length > 0;
      }, 'Source function call', 1000);

      runs(function () {
        var autocompleteList = autocomplete().handsontable('getInstance').rootElement;
        expect(autocompleteList.find('td:eq(0)').html()).toEqual('Male');
        expect(autocompleteList.find('td:eq(1)').html()).toEqual('Female');

        syncSources.reset();
      });
    });

  });

  it('should restore the old value when hovered over a autocomplete menu item and then clicked outside of the table', function () {
    var syncSources = jasmine.createSpy('syncSources');

    syncSources.plan = function (query, process) {
      process(choices);
    };

    handsontable({
      columns: [
        {
          editor: 'autocomplete',
          source: syncSources
        }
      ]
    });

    selectCell(0, 0);

    expect(getDataAtCell(0, 0)).toBeNull();

    keyDownUp('enter');

    waitsFor(function () {
      return syncSources.calls.length > 0;
    }, 'Source function call', 1000);

    runs(function () {

      autocomplete().find('tbody td:eq(1)').mouseenter();
      autocomplete().find('tbody td:eq(1)').mouseleave();

      this.$container.mousedown();

      expect(getDataAtCell(0, 0)).toBeNull();

    });


  });

  it('should be able to use empty value ("")', function () {

    var syncSources = jasmine.createSpy('syncSources');

    syncSources.plan = function (query, process) {
      process(['', 'BMW', 'Bentley']);
    };

    handsontable({
      data: [
        ['one', 'two'],
        ['three', 'four']
      ],
      columns: [
        {
          editor: 'autocomplete',
          source: syncSources
        }
      ]
    });

    selectCell(0, 0);
    keyDownUp('enter');

    waitsFor(function () {
      return syncSources.calls.length > 0;
    }, 'Source function call', 1000);

    runs(function () {

      expect(getDataAtCell(0, 0)).toEqual('one');

      autocomplete().find('tbody td:eq(0)').mousedown();

      expect(getDataAtCell(0, 0)).toEqual('');
    });


  });

  it("should fire one afterChange event when value is changed", function () {
    var onAfterChange = jasmine.createSpy('onAfterChange');
    var syncSources = jasmine.createSpy('syncSources');

    syncSources.plan = function (query, process) {
      process(choices);
    };

    handsontable({
      columns: [
        {
          editor: 'autocomplete',
          source: syncSources
        }
      ],
      afterChange: onAfterChange
    });

    selectCell(0, 0);

    keyDownUp('enter');

    waitsFor(function () {
      return syncSources.calls.length > 0;
    }, 'Source function call', 1000);

    runs(function () {
      onAfterChange.reset();
      autocomplete().find('tbody td:eq(1)').mousedown();

      expect(getDataAtCell(0,0)).toEqual('red');
      expect(onAfterChange.calls.length).toEqual(1);
      expect(onAfterChange).toHaveBeenCalledWith([[0, 0, null, 'red']], 'edit', undefined, undefined, undefined);
    });

  });

  it("should not affect other cell values after clicking on autocomplete cell (#1021)", function () {

    var syncSources = jasmine.createSpy('syncSources');

    syncSources.plan = function (query, process) {
      process(choices);
    };

    handsontable({
      columns: [
        {},{},
        {
          editor: 'autocomplete',
          source: syncSources
        },{}
      ],
      data: [
        [null, null, 'yellow', null],
        [null, null, 'red', null],
        [null, null, 'blue', null]
      ]
    });

    expect($(getCell(0, 2)).text()).toMatch('yellow');

    mouseDoubleClick(getCell(0, 2));

    expect($(getCell(1, 2)).text()).toMatch('red');

    mouseDoubleClick(getCell(1, 2));

    expect($(getCell(2, 2)).text()).toMatch('blue');

    mouseDoubleClick(getCell(2, 2));

    waitsFor(function () {
      return syncSources.calls.length == 3;
    }, 'Source function call', 1000);

    runs(function () {
      expect(getDataAtCol(2)).toEqual(['yellow', 'red', 'blue']);
    });

  });

});