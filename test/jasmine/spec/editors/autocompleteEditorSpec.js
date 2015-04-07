describe('AutocompleteEditor', function () {
  var id = 'testContainer';

  var choices = ["yellow", "red", "orange", "green", "blue", "gray", "black", "white", "purple", "lime", "olive", "cyan"];

  var hot;

  beforeEach(function () {
    this.$container = $('<div id="' + id + '" style="width: 300px; height: 200px; overflow: auto"></div>').appendTo('body');
  });

  afterEach(function () {
    if (hot) {
      hot = null;
    }

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

    it("should NOT update choices list, after cursor leaves and enters the list (#1330)", function () {

      spyOn(Handsontable.editors.AutocompleteEditor.prototype, 'updateChoicesList').andCallThrough();
      var updateChoicesList = Handsontable.editors.AutocompleteEditor.prototype.updateChoicesList;

      var hot = handsontable({
        columns: [
          {
            editor: 'autocomplete',
            source: choices
          }
        ]
      });

      selectCell(0, 0);

      var editor = hot.getActiveEditor();

      keyDownUp('enter');

      waitsFor(function () {
        return updateChoicesList.calls.length > 0;
      }, 'Initial choices load', 100);

      runs(function () {
        updateChoicesList.reset();
        $(editor.htContainer).find('.htCore tr:eq(0) td:eq(0)').mouseenter();
        $(editor.htContainer).find('.htCore tr:eq(0) td:eq(0)').mouseleave();
        $(editor.htContainer).find('.htCore tr:eq(0) td:eq(0)').mouseenter();
      });

      waits(100);

      runs(function () {
        expect(updateChoicesList).not.toHaveBeenCalled();
      });

    });

    it("should update choices list exactly once after a key is pressed (#1330)", function () {

      spyOn(Handsontable.editors.AutocompleteEditor.prototype, 'updateChoicesList').andCallThrough();
      var updateChoicesList = Handsontable.editors.AutocompleteEditor.prototype.updateChoicesList;

      var hot = handsontable({
        columns: [
          {
            editor: 'autocomplete',
            source: choices
          }
        ]
      });

      selectCell(0, 0);

      var editor = hot.getActiveEditor();

      updateChoicesList.reset();

      keyDownUp('enter');

      waitsFor(function () {
        return updateChoicesList.calls.length > 0;
      }, 'Initial choices load', 1000);

      runs(function () {
        updateChoicesList.reset();
        editor.TEXTAREA.value = 'red';

        $(editor.TEXTAREA).simulate('keydown',{
          keyCode: 'd'.charCodeAt(0)
        });

      });

      waitsFor(function () {
        return updateChoicesList.calls.length > 0;
      }, 'Initial choices load', 100);

      runs(function () {
        expect(updateChoicesList.calls.length).toEqual(1);
      });

    });

    it("should not initialize the dropdown with unneeded scrollbars (scrollbar causing a scrollbar issue)", function () {
      spyOn(Handsontable.editors.AutocompleteEditor.prototype, 'updateChoicesList').andCallThrough();
      var updateChoicesList = Handsontable.editors.AutocompleteEditor.prototype.updateChoicesList;

      var hot = handsontable({
        data: [
          [
            "blue"
          ],
          [],
          [],
          []
        ],
        columns: [
          {
            editor: 'autocomplete',
            source: choices
          }
        ]
      });

      selectCell(0, 0);

      var editor = hot.getActiveEditor();

      updateChoicesList.reset();

      keyDownUp('enter');

      waitsFor(function () {
        return updateChoicesList.calls.length > 0;
      }, 'Initial choices load', 1000);

      runs(function () {
        expect(editor.htContainer.scrollWidth).toEqual(editor.htContainer.clientWidth);
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

    it('autocomplete textarea should have cell dimensions (after render)', function () {
      runs(function () {
        var data = [
          ["a", "b"],
          ["c", "d"]
        ];

        hot = handsontable({
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
          {},
          {},
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

    it("should not display all the choices from a long source list and not leave any unused space in the dropdown (YouTrack: #HOT-32)", function () {
      var hot = handsontable({
        columns: [
          {
            type: 'autocomplete',
            source: ["Acura","Audi","BMW","Buick","Cadillac","Chevrolet","Chrysler","Citroen","Dodge","Eagle","Ferrari","Ford","General Motors","GMC","Honda","Hummer","Hyundai","Infiniti","Isuzu","Jaguar","Jeep","Kia","Lamborghini","Land Rover","Lexus","Lincoln","Lotus","Mazda","Mercedes-Benz","Mercury","Mitsubishi","Nissan","Oldsmobile","Peugeot","Pontiac","Porsche","Regal","Renault","Saab","Saturn","Seat","Skoda","Subaru","Suzuki","Toyota","Volkswagen","Volvo"]
          }
        ]
      });

      selectCell(0, 0);
      keyDownUp('enter');
      var $autocomplete = autocomplete();
      var $autocompleteHolder = $autocomplete.find('.ht_master .wtHolder').first();

      waits(100);
      runs(function () {
        expect($autocomplete.find("td").first().text()).toEqual("Acura");
        $autocompleteHolder.scrollTop($autocompleteHolder[0].scrollHeight);
      });
      waits(100);
      runs(function () {
        expect($autocomplete.find("td").last().text()).toEqual("Volvo");
      });
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
        autocomplete().find('tbody td:eq(3)').simulate('mousedown');

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

      runs(function () {
        expect(autocompleteEditor().is(":visible")).toBe(true);

        $('body').simulate('mousedown');

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

        setTimeout(function () {
          keyDownUp('enter');
          finishEdit = true;
        });

      });

      waitsFor(function () {
        return finishEdit;
      }, 'Edition finish', 1000);

      runs(function () {
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

      selectCell(0, 0);

      keyDownUp('enter');

      waitsFor(function () {
        return syncSources.calls.length > 0;
      }, 'Source function call', 1000);

      runs(function () {

        var editor = $('.handsontableInput');
        editor.val('foo');

        keyDownUp('enter');

        expect(getDataAtCell(0, 0)).toEqual('foo');

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

      selectCell(0, 0);

      keyDownUp('enter');

      waitsFor(function () {
        return syncSources.calls.length > 0;
      }, 'Source function call', 1000);

      runs(function () {

        var editor = $('.handsontableInput');
        editor.val('foo');

        this.$container.find('tbody tr:eq(1) td:eq(0)').simulate('mousedown');

        expect(getDataAtCell(0, 0)).toEqual('foo');

      });
    });

    it("should save the value from textarea after hitting ENTER", function () {
      var syncSources = jasmine.createSpy('syncSources');

      syncSources.plan = function (query, process) {
        process(choices.filter(function (choice) {
          return choice.indexOf(query) != -1;
        }));
      };

      hot = handsontable({
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
        var ac = Handsontable.editors.getEditor('autocomplete', hot);
        var innerHot = ac.htEditor;

        expect(innerHot.getData()).toEqual([
          [ 'blue' ],
          ['black']
        ]);

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
        process(choices.filter(function (choice) {
          return choice.indexOf(query) != -1;
        }));
      };

      hot = handsontable({
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

        var ac = Handsontable.editors.getEditor('autocomplete', hot);
        var innerHot = ac.htEditor;

        expect(innerHot.getData()).toEqual([
          [ 'blue' ],
          ['black']
        ]);

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
        process(choices.filter(function (choice) {
          return choice.indexOf(query) != -1;
        }));
      };

      hot = handsontable({
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

        var ac = Handsontable.editors.getEditor('autocomplete', hot);
        var innerHot = ac.htEditor;

        expect(innerHot.getData()).toEqual([
          [ 'blue' ],
          ['black']
        ]);

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
        process(choices.filter(function (choice) {
          return choice.indexOf(query) != -1;
        }));
      };

      hot = handsontable({
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
        var ac = Handsontable.editors.getEditor('autocomplete', hot);
        var innerHot = ac.htEditor;

        expect(innerHot.getData()).toEqual([
           [ 'red' ],
          [ 'yellow' ],
          [ 'green' ],
          [ 'blue' ],
          [ 'lime'],
          [ 'white' ],
          [ 'olive'],
          [ 'orange' ],
          [ 'purple']
        ]);

        syncSources.reset();

        editorInput.val("ed");
        keyDownUp(68); //d
      });

      waitsFor(function () {
        return syncSources.calls.length > 0;
      }, 'Source function call', 1000);

      runs(function () {
        var ac = Handsontable.editors.getEditor('autocomplete', hot);
        var innerHot = ac.htEditor;

        expect(innerHot.getData()).toEqual([
          [ 'red' ]
        ]);
      });
    });
    it('default filtering should be case insensitive', function () {


      hot = handsontable({
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
        var ac = Handsontable.editors.getEditor('autocomplete', hot);
        var innerHot = ac.htEditor;

        expect(innerHot.getData()).toEqual([
		  [ 'red' ],
          [ 'yellow' ],
          [ 'green' ],
          [ 'blue' ],
          [ 'lime'],
          [ 'white' ],
          [ 'olive'],
          [ 'orange' ],
          [ 'purple']
        ]);

        editorInput.val("E");
        keyDownUp(69); //E (same as "e")
      });

      waits(50); //filtering is always async

      runs(function () {
        var ac = Handsontable.editors.getEditor('autocomplete', hot);
        var innerHot = ac.htEditor;

        expect(innerHot.getData()).toEqual([
          [ 'red' ],
          [ 'yellow' ],
          [ 'green' ],
          [ 'blue' ],
          [ 'lime'],
          [ 'white' ],
          [ 'olive'],
          [ 'orange' ],
          [ 'purple']
        ]);
      });
    });
    it('default filtering should be case sensitive when filteringCaseSensitive is false', function () {


      hot = handsontable({
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
        var ac = Handsontable.editors.getEditor('autocomplete', hot);
        var innerHot = ac.htEditor;

        expect(innerHot.getData()).toEqual([
          [ 'red' ],
          [ 'yellow' ],
          [ 'green' ],
          [ 'blue' ],
          [ 'lime'],
          [ 'white' ],
          [ 'olive'],
          [ 'orange' ],
          [ 'purple']
        ]);

        editorInput.val("E");
        keyDownUp(69); //E (same as "e")
      });

      waits(50); //filtering is always async

      runs(function () {
        var ac = Handsontable.editors.getEditor('autocomplete', hot);
        var innerHot = ac.htEditor;

        expect(innerHot.getData()).toEqual([ ]);
      });
    });
    it('typing in textarea should NOT filter the lookup list when filtering is disabled', function () {

      hot = handsontable({
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
        var ac = Handsontable.editors.getEditor('autocomplete', hot);
        var innerHot = ac.htEditor;

        expect(innerHot.getData()).toEqual(Handsontable.helper.pivot([choices]));

        editorInput.val("ed");
        keyDownUp("d".charCodeAt(0)); //d
      });

      waits(20);

      runs(function () {
        var ac = Handsontable.editors.getEditor('autocomplete', hot);
        var innerHot = ac.htEditor;

        expect(innerHot.getData()).toEqual(Handsontable.helper.pivot([choices]));
      });


    });

    it('typing in textarea should highlight the matching phrase', function () {

      var choices = ['Male', 'Female'];

      var syncSources = jasmine.createSpy('syncSources');

      syncSources.plan = function (query, process) {
        process(choices.filter(function (choice) {
          return choice.search(new RegExp(query, 'i')) != -1;
        }));
      };

      hot = handsontable({
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
        var ac = Handsontable.editors.getEditor('autocomplete', hot);
        var innerHot = ac.htEditor;
        var autocompleteList = $(innerHot.rootElement);

        expect(autocompleteList.find('td:eq(0)').html()).toMatch(/<(strong|STRONG)>Male<\/(strong|STRONG)>/); //IE8 makes the tag names UPPERCASE
        expect(autocompleteList.find('td:eq(1)').html()).toMatch(/Fe<(strong|STRONG)>male<\/(strong|STRONG)>/);

        syncSources.reset();
      });
    });

    it('text in textarea should not be interpreted as regexp', function () {
      spyOn(Handsontable.editors.AutocompleteEditor.prototype, 'queryChoices').andCallThrough();
      var queryChoices = Handsontable.editors.AutocompleteEditor.prototype.queryChoices;

      hot = handsontable({
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
        var ac = Handsontable.editors.getEditor('autocomplete', hot);
        var innerHot = ac.htEditor;

        expect(innerHot.getData().length).toEqual(0);
      });
    });

    it('text in textarea should not be interpreted as regexp when highlighting the matching phrase', function () {
      var choices = ['Male', 'Female'];

      var syncSources = jasmine.createSpy('syncSources');

      syncSources.plan = function (query, process) {
        process(choices.filter(function (choice) {
          return choice.search(new RegExp(query, 'i')) != -1;
        }));
      };

      hot = handsontable({
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
        var ac = Handsontable.editors.getEditor('autocomplete', hot);
        var innerHot = ac.htEditor;

        var autocompleteList = $(innerHot.rootElement);

        expect(autocompleteList.find('td:eq(0)').html()).toEqual('Male');
        expect(autocompleteList.find('td:eq(1)').html()).toEqual('Female');

        syncSources.reset();
      });
    });

    it("should allow any value if filter === false and allowInvalid === true", function () {
      spyOn(Handsontable.editors.AutocompleteEditor.prototype, 'queryChoices').andCallThrough();
      var queryChoices = Handsontable.editors.AutocompleteEditor.prototype.queryChoices;

      handsontable({
        columns: [
          {
            editor: 'autocomplete',
            source: choices,
            filter: false,
            strict: true,
            allowInvalid: true
          }
        ]
      });

      selectCell(0, 0);
      var editorInput = $('.handsontableInput');

      expect(getDataAtCell(0, 0)).toBeNull();

      keyDownUp('enter');

      waitsFor(function () {
        return queryChoices.calls.length > 0;
      }, 'queryChoices function call', 1000);

      runs(function () {

        queryChoices.reset();

        editorInput.val("foobar");
        keyDownUp(82); //r


      });

      waitsFor(function () {
        return queryChoices.calls.length > 0;
      }, 'queryChoices function call', 1000);

      runs(function () {

        keyDownUp(Handsontable.helper.keyCode.ENTER);

        expect(getDataAtCell(0, 0)).toEqual('foobar');
      });

    });

    it('typing in textarea should highlight best choice, if strict === true', function () {
      var choices = ['Male', 'Female'];

      var syncSources = jasmine.createSpy('syncSources');

      syncSources.plan = function (query, process) {
        process(choices.filter(function (choice) {
          return choice.search(new RegExp(query, 'i')) != -1;
        }));
      };

      var hot = handsontable({
        columns: [
          {
            editor: 'autocomplete',
            source: syncSources,
            filter: false,
            strict: true
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
        var ac = Handsontable.editors.getEditor('autocomplete', hot);
        var innerHot = ac.htEditor;
        expect(innerHot.getSelected()).toEqual([1, 0, 1, 0]);
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

      autocomplete().find('tbody td:eq(1)').simulate('mouseenter');
      autocomplete().find('tbody td:eq(1)').simulate('mouseleave');

      this.$container.simulate('mousedown');

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
          source: syncSources,
          filter: false
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

      autocomplete().find('tbody td:eq(0)').simulate('mousedown');

      expect(getDataAtCell(0, 0)).toEqual('');
    });
  });

  describe("Autocomplete helper functions:", function () {
    describe("sortByRelevance", function () {
      it("should sort the provided array, so items more relevant to the provided value are listed first", function () {
        var choices = [
          'Wayne',//0
          'Draven',//1
          'Banner',//2
          'Stark',//3
          'Parker',//4
          'Kent',//5
          'Gordon',//6
          'Kyle',//7
          'Simmons'//8
        ]
          , value = 'a';

        var sorted = Handsontable.editors.AutocompleteEditor.sortByRelevance(value, choices);

        expect(sorted).toEqual([
          0,
          2,
          4,
          3,
          1
        ]);

        value = 'o';
        sorted = Handsontable.editors.AutocompleteEditor.sortByRelevance(value, choices);
        expect(sorted).toEqual([
          6,
          8
        ]);

        value = 'er';
        sorted = Handsontable.editors.AutocompleteEditor.sortByRelevance(value, choices);
        expect(sorted).toEqual([
          2,
          4
        ]);

      });
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
      autocomplete().find('tbody td:eq(1)').simulate('mousedown');

      expect(getDataAtCell(0, 0)).toEqual('red');
      expect(onAfterChange.calls.length).toEqual(1);
      expect(onAfterChange).toHaveBeenCalledWith([
        [0, 0, null, 'red']
      ], 'edit', undefined, undefined, undefined, undefined);
    });

  });

  it("should not affect other cell values after clicking on autocomplete cell (#1021)", function () {

    var syncSources = jasmine.createSpy('syncSources');

    syncSources.plan = function (query, process) {
      process(choices);
    };

    handsontable({
      columns: [
        {},
        {},
        {
          editor: 'autocomplete',
          source: syncSources
        },
        {}
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

  it("should handle editor if cell data is a function", function () {

    spyOn(Handsontable.editors.AutocompleteEditor.prototype, 'updateChoicesList').andCallThrough();
    var updateChoicesList = Handsontable.editors.AutocompleteEditor.prototype.updateChoicesList;
    var afterValidateCallback = jasmine.createSpy('afterValidateCallbak');

    var hot = handsontable({
      data: [
        Model({
          id: 1,
          name: "Ted Right",
          address: ""
        }),
        Model({
          id: 2,
          name: "Frank Honest",
          address: ""
        }),
        Model({
          id: 3,
          name: "Joan Well",
          address: ""
        })],
      dataSchema: Model,
      colHeaders: ['ID', 'Name', 'Address'],
      columns: [
        {
          data: createAccessorForProperty("id"),
          type: 'autocomplete',
          source: ['1', '2', '3'],
          filter: false,
          strict: true
        },
        {
          data: createAccessorForProperty("name")
        },
        {
          data: createAccessorForProperty("address")
        }
      ],
      minSpareRows: 1,
      afterValidate: afterValidateCallback
    });

    selectCell(0, 0);
    expect(hot.getActiveEditor().isOpened()).toBe(false);

    keyDownUp('enter');

    waitsFor(function () {
      return updateChoicesList.calls.length > 0;
    }, 'UpdateChoicesList call', 1000);

    runs(function () {
      expect(hot.getActiveEditor().isOpened()).toBe(true);
      afterValidateCallback.reset();
      $(hot.getActiveEditor().htContainer).find('tr:eq(1) td:eq(0)').simulate('mousedown');
    });


    waitsFor(function () {
      return afterValidateCallback.calls.length > 0;
    }, 'Autocomplete validation', 1000);

    runs(function () {
      expect(getDataAtCell(0, 0)).toEqual('2');
    })

  });


  it("should not call the `source` has been selected", function () {

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
      cells: function (row, col) {

        var cellProperties = {};

        if (row === 0 && col == 0) {
          cellProperties.readOnly = true;
        }

        return cellProperties;
      }
    });


    expect(getCellMeta(0, 0).readOnly).toBe(true);
    expect(syncSources).not.toHaveBeenCalled();

    selectCell(0, 0);

    expect(syncSources).not.toHaveBeenCalled();

    expect(getCellMeta(1, 0).readOnly).toBeFalsy();

    selectCell(1, 0);

    expect(syncSources).not.toHaveBeenCalled();

  });

  it("should not call the `source` method if cell is read only and the arrow has been clicked", function () {

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
      cells: function (row, col) {

        var cellProperties = {};

        if (row === 0 && col == 0) {
          cellProperties.readOnly = true;
        }

        return cellProperties;
      }
    });


    expect(getCellMeta(0, 0).readOnly).toBe(true);
    expect(syncSources).not.toHaveBeenCalled();

    selectCell(0, 0);
    $(getCell(0, 0)).find('.htAutocompleteArrow').simulate('mousedown');


    waits(100);

    runs(function () {
      expect(syncSources).not.toHaveBeenCalled();

      syncSources.reset();
      expect(getCellMeta(1, 0).readOnly).toBeFalsy();

      selectCell(1, 0);
      $(getCell(1, 0)).find('.htAutocompleteArrow').simulate('mousedown');
    });

    waitsFor(function () {
      return syncSources.calls.length > 0;
    }, 'SyncSources call', 1000);

    runs(function () {
      expect(syncSources).toHaveBeenCalled();
      expect(syncSources.calls.length).toEqual(1);
    });


  });

  it("should add a scrollbar to the autocomplete dropdown, only if number of displayed choices exceeds 10", function () {

    var hot = handsontable({
      data: [
        ['', 'two', 'three'],
        ['four', 'five', 'six']
      ],
      columns: [
        {
          type: 'autocomplete',
          source: choices,
          allowInvalid: false,
          strict: false
        },
        {

        },
        {

        }
      ]
    });

    this.$container.css({
      height: 600
    });

    expect(choices.length).toBeGreaterThan(10);

    selectCell(0, 0);
    $(getCell(0, 0)).find('.htAutocompleteArrow').simulate('mousedown');

    var dropdown = hot.getActiveEditor().htContainer;
    var dropdownHolder = hot.getActiveEditor().htEditor.view.wt.wtTable.holder;

    waits(30);
    runs(function() {
      expect(dropdownHolder.scrollHeight).toBeGreaterThan(dropdownHolder.clientHeight);

      keyDownUp('esc');

      hot.getSettings().columns[0].source = hot.getSettings().columns[0].source.slice(0).splice(3);

      hot.updateSettings({});

      selectCell(0, 0);
      $(getCell(0, 0)).find('.htAutocompleteArrow').simulate('mousedown');
    });

    waits(30);

    runs(function() {
      expect(dropdownHolder.scrollHeight > dropdownHolder.clientHeight).toBe(false);
    });

  });

  it("should not close editor on scrolling", function () {
    var hot = handsontable({
      data: [
        ['', 'two', 'three'],
        ['four', 'five', 'six']
      ],
      columns: [
        {
          type: 'autocomplete',
          source: choices,
          allowInvalid: false,
          strict: false
        },
        {

        },
        {

        }
      ]
    });

    expect(choices.length).toBeGreaterThan(10);

    selectCell(0, 0);
    $(getCell(0, 0)).find('.htAutocompleteArrow').simulate('mousedown');
    $(getCell(0, 0)).find('.htAutocompleteArrow').simulate('mouseup');

    var dropdown = hot.getActiveEditor().htContainer;

    hot.view.wt.wtOverlays.topOverlay.scrollTo(1);

    waits(30);

    runs(function () {
      expect($(dropdown).is(':visible')).toBe(true);
      selectCell(0, 0);
    });

    waits(30);

    runs(function () {
      $(getCell(0, 0)).find('.htAutocompleteArrow').simulate('mousedown');
      $(getCell(0, 0)).find('.htAutocompleteArrow').simulate('mouseup');
      hot.view.wt.wtOverlays.topOverlay.scrollTo(3);
    });

    waits(30);

    runs(function () {
      expect($(dropdown).is(':visible')).toBe(true);
    });
  });

  it("should keep textarea caret position, after moving the selection to the suggestion list (pressing down arrow)", function () {
    var syncSources = jasmine.createSpy('syncSources');

    syncSources.plan = function (query, process) {
      process(choices.filter(function (choice) {
        return choice.indexOf(query) != -1;
      }));
    };

    handsontable({
      columns: [
        {
          type: 'autocomplete',
          source: syncSources,
          strict: false
        }
      ]
    });

    selectCell(0, 0);
    keyDownUp('enter');
    var $editorInput = $('.handsontableInput');
    $editorInput.val("an");
    keyDownUp(65); //a
    keyDownUp(78); //n
    Handsontable.Dom.setCaretPosition($editorInput[0],1);

    waitsFor(function () {
      return syncSources.calls.length > 0;
    }, 'Source function call', 1000);

    runs(function () {
      keyDownUp('arrow_down');
      expect(Handsontable.Dom.getCaretPosition($editorInput[0])).toEqual(1);
      keyDownUp('arrow_down');
      expect(Handsontable.Dom.getCaretPosition($editorInput[0])).toEqual(1);

    });
  });

  it("should keep textarea selection, after moving the selection to the suggestion list (pressing down arrow)", function () {
    var syncSources = jasmine.createSpy('syncSources');

    syncSources.plan = function (query, process) {
      process(choices.filter(function (choice) {
        return choice.indexOf(query) != -1;
      }));
    };

    handsontable({
      columns: [
        {
          type: 'autocomplete',
          source: syncSources,
          strict: false
        }
      ]
    });

    selectCell(0, 0);
    keyDownUp('enter');
    var $editorInput = $('.handsontableInput');
    $editorInput.val("an");
    keyDownUp(65); //a
    keyDownUp(78); //n
    Handsontable.Dom.setCaretPosition($editorInput[0],1,2);

    waitsFor(function () {
      return syncSources.calls.length > 0;
    }, 'Source function call', 1000);

    runs(function () {
      keyDownUp('arrow_down');
      expect(Handsontable.Dom.getCaretPosition($editorInput[0])).toEqual(1);
      expect(Handsontable.Dom.getSelectionEndPosition($editorInput[0])).toEqual(2);
      keyDownUp('arrow_down');
      expect(Handsontable.Dom.getCaretPosition($editorInput[0])).toEqual(1);
      expect(Handsontable.Dom.getSelectionEndPosition($editorInput[0])).toEqual(2);

    });
  });
});
