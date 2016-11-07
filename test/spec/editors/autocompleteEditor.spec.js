describe('AutocompleteEditor', function() {
  var id = 'testContainer';

  var choices = ["yellow", "red", "orange", "green", "blue", "gray", "black", "white", "purple", "lime", "olive", "cyan"];

  var hot;

  beforeEach(function() {
    this.$container = $('<div id="' + id + '" style="width: 300px; height: 200px; overflow: auto"></div>').appendTo('body');
  });

  afterEach(function() {
    if (hot) {
      hot = null;
    }

    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  describe("open editor", function() {
    it("should display editor (after hitting ENTER)", function() {
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

    it("should display editor (after hitting F2)", function() {
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

    it("should display editor (after doubleclicking)", function() {
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

    // see https://github.com/handsontable/handsontable/issues/3380
    it("should not throw error while selecting the next cell by hitting enter key", function() {
      var spy = jasmine.createSpyObj('error', ['test']);
      var prevError = window.onerror;

      window.onerror = function(messageOrEvent, source, lineno, colno, error) {
        spy.test();
      };
      handsontable({
        columns: [{
          editor: 'autocomplete',
          source: choices
        }]
      });

      selectCell(0, 0);
      keyDownUp('enter');
      keyDownUp('enter');
      keyDownUp('enter');

      expect(spy.test.calls.count()).toBe(0);

      window.onerror = prevError;
    });
  });

  describe("choices", function() {
    it("should display given choices (array)", function(done) {
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

      setTimeout(function () {
        expect(editor.find('tbody td:eq(0)').text()).toEqual(choices[0]);
        expect(editor.find('tbody td:eq(1)').text()).toEqual(choices[1]);
        expect(editor.find('tbody td:eq(2)').text()).toEqual(choices[2]);
        expect(editor.find('tbody td:eq(3)').text()).toEqual(choices[3]);
        expect(editor.find('tbody td:eq(4)').text()).toEqual(choices[4]);
        done();
      }, 100);
    });

    it("should call source function with context set as cellProperties", function(done) {
      var source = jasmine.createSpy('source');
      var context;

      source.and.callFake(function(query, process) {
        process(choices);
        context = this;
      });
      var hot = handsontable({
        columns: [
          {
            editor: 'autocomplete',
            source: source
          }
        ]
      });
      selectCell(0, 0);
      source.calls.reset();
      keyDownUp('enter');

      setTimeout(function () {
        expect(context.instance).toBe(hot);
        expect(context.row).toBe(0);
        expect(context.col).toBe(0);
        done();
      }, 200);
    });

    it("should display given choices (sync function)", function(done) {
      var syncSources = jasmine.createSpy('syncSources');

      syncSources.and.callFake(function(query, process) {
        process(choices);
      });
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
      syncSources.calls.reset();
      keyDownUp('enter');

      setTimeout(function () {
        expect(editor.find('tbody td:eq(0)').text()).toEqual(choices[0]);
        expect(editor.find('tbody td:eq(1)').text()).toEqual(choices[1]);
        expect(editor.find('tbody td:eq(2)').text()).toEqual(choices[2]);
        expect(editor.find('tbody td:eq(3)').text()).toEqual(choices[3]);
        expect(editor.find('tbody td:eq(4)').text()).toEqual(choices[4]);
        done();
      }, 200);
    });

    it("should display given choices (async function)", function(done) {
      var asyncSources = jasmine.createSpy('asyncSources');

      asyncSources.and.callFake(function(process) {
        process(choices);
      });
      handsontable({
        columns: [
          {
            editor: 'autocomplete',
            source: function(query, process) {
              setTimeout(function() {
                asyncSources(process);
              }, 0);
            }
          }
        ]
      });
      selectCell(0, 0);
      var editor = $('.autocompleteEditor');

      keyDownUp('enter');

      setTimeout(function () {
        expect(asyncSources.calls.count()).toEqual(1);
        expect(editor.find('tbody td:eq(0)').text()).toEqual(choices[0]);
        expect(editor.find('tbody td:eq(1)').text()).toEqual(choices[1]);
        expect(editor.find('tbody td:eq(2)').text()).toEqual(choices[2]);
        expect(editor.find('tbody td:eq(3)').text()).toEqual(choices[3]);
        expect(editor.find('tbody td:eq(4)').text()).toEqual(choices[4]);
        done();
      }, 200);
    });

    it("should NOT update choices list, after cursor leaves and enters the list (#1330)", function(done) {
      spyOn(Handsontable.editors.AutocompleteEditor.prototype, 'updateChoicesList').and.callThrough();
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

      setTimeout(function () {
        updateChoicesList.calls.reset();
        $(editor.htContainer).find('.htCore tr:eq(0) td:eq(0)').mouseenter();
        $(editor.htContainer).find('.htCore tr:eq(0) td:eq(0)').mouseleave();
        $(editor.htContainer).find('.htCore tr:eq(0) td:eq(0)').mouseenter();
      }, 200);

      setTimeout(function () {
        expect(updateChoicesList).not.toHaveBeenCalled();
        done();
      }, 300);
    });

    it("should update choices list exactly once after a key is pressed (#1330)", function(done) {
      spyOn(Handsontable.editors.AutocompleteEditor.prototype, 'updateChoicesList').and.callThrough();
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
      updateChoicesList.calls.reset();

      keyDownUp('enter');

      setTimeout(function () {
        updateChoicesList.calls.reset();
        editor.TEXTAREA.value = 'red';

        $(editor.TEXTAREA).simulate('keydown', {
          keyCode: 'd'.charCodeAt(0)
        });
      }, 200);

      setTimeout(function () {
        expect(updateChoicesList.calls.count()).toEqual(1);
        done();
      }, 100);
    });

    it("should not initialize the dropdown with unneeded scrollbars (scrollbar causing a scrollbar issue)", function(done) {
      spyOn(Handsontable.editors.AutocompleteEditor.prototype, 'updateChoicesList').and.callThrough();
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
      updateChoicesList.calls.reset();

      keyDownUp('enter');

      setTimeout(function () {
        expect(editor.htContainer.scrollWidth).toEqual(editor.htContainer.clientWidth);
        done();
      }, 200);
    });

    it('autocomplete list should have textarea dimensions', function(done) {
      var syncSources = jasmine.createSpy('syncSources');

      syncSources.and.callFake(function(query, process) {
        process(choices);
      });

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

      syncSources.calls.reset();
      keyDownUp('enter');

      setTimeout(function () {
        // -2 for transparent borders
        expect(editor.find('.autocompleteEditor .htCore td').width()).toEqual(editor.find('.handsontableInput').width() - 2);
        expect(editor.find('.autocompleteEditor .htCore td').width()).toBeGreaterThan(187);
        done();
      }, 200);
    });

    it('autocomplete list should have the suggestion table dimensions, when trimDropdown option is set to false', function(done) {
      var syncSources = jasmine.createSpy('syncSources');

      syncSources.and.callFake(function(query, process) {
        process(["long text", "even longer text", "extremely long text in the suggestion list", "short text", "text", "another", "yellow", "black"]);
      });

      var hot = handsontable({
        colWidths: [200],
        columns: [
          {
            editor: 'autocomplete',
            source: syncSources
          }
        ],
        trimDropdown: false
      });


      selectCell(0, 0);
      var editor = $('.handsontableInputHolder');

      syncSources.calls.reset();
      keyDownUp('enter');

      setTimeout(function () {
        expect(editor.find('.autocompleteEditor .htCore td').eq(0).width()).toBeGreaterThan(editor.find('.handsontableInput').width());
        done();
      }, 200);
    });

    it('autocomplete textarea should have cell dimensions (after render)', function(done) {
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
        cells: function() {
          return {
            type: Handsontable.AutocompleteCell
          };
        }
      });

      selectCell(1, 1);
      keyDownUp('enter');

      data[1][1] = "dddddddddddddddddddd";
      render();

      setTimeout(function () {
        var $td = spec().$container.find('.htCore tbody tr:eq(1) td:eq(1)');

        expect(autocompleteEditor().width()).toEqual($td.width());
        done();
      }, 10);
    });

    it("should invoke beginEditing only once after dobleclicking on a cell (#1011)", function() {
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

      expect(hot.getActiveEditor().beginEditing.calls.count()).toBe(0);

      mouseDoubleClick(getCell(0, 2));

      expect(hot.getActiveEditor().beginEditing.calls.count()).toBe(1);

      mouseDoubleClick(getCell(1, 2));

      expect(hot.getActiveEditor().beginEditing.calls.count()).toBe(2);

      mouseDoubleClick(getCell(2, 2));

      expect(hot.getActiveEditor().beginEditing.calls.count()).toBe(3);
    });

    it("should not display all the choices from a long source list and not leave any unused space in the dropdown (YouTrack: #HOT-32)", function(done) {
      var hot = handsontable({
        columns: [
          {
            type: 'autocomplete',
            source: [
              "Acura", "Audi", "BMW", "Buick", "Cadillac", "Chevrolet", "Chrysler", "Citroen", "Dodge", "Eagle", "Ferrari", "Ford", "General Motors", "GMC", "Honda",
              "Hummer", "Hyundai", "Infiniti", "Isuzu", "Jaguar", "Jeep", "Kia", "Lamborghini", "Land Rover", "Lexus", "Lincoln", "Lotus", "Mazda", "Mercedes-Benz", "Mercury",
              "Mitsubishi", "Nissan", "Oldsmobile", "Peugeot", "Pontiac", "Porsche", "Regal", "Renault", "Saab", "Saturn", "Seat", "Skoda", "Subaru", "Suzuki", "Toyota", "Volkswagen", "Volvo"]
          }
        ]
      });

      selectCell(0, 0);
      keyDownUp('enter');
      var $autocomplete = autocomplete();
      var $autocompleteHolder = $autocomplete.find('.ht_master .wtHolder').first();

      setTimeout(function () {
        expect($autocomplete.find("td").first().text()).toEqual("Acura");
        $autocompleteHolder.scrollTop($autocompleteHolder[0].scrollHeight);
      }, 100);

      setTimeout(function () {
        expect($autocomplete.find("td").last().text()).toEqual("Volvo");
        done();
      }, 200);
    });

    it("should display the choices, regardless if they're declared as string or numeric", function(done) {
      handsontable({
        columns: [
          {
            editor: 'autocomplete',
            source: ["1", "2", 3, "4", 5, 6]
          }
        ]
      });

      selectCell(0, 0);

      var editor = $('.autocompleteEditor');

      keyDownUp('enter');

      setTimeout(function () {
        expect(editor.find('tbody td:eq(0)').text()).toEqual('1');
        expect(editor.find('tbody td:eq(1)').text()).toEqual('2');
        expect(editor.find('tbody td:eq(2)').text()).toEqual('3');
        expect(editor.find('tbody td:eq(3)').text()).toEqual('4');
        expect(editor.find('tbody td:eq(4)').text()).toEqual('5');
        expect(editor.find('tbody td:eq(5)').text()).toEqual('6');
        done();
      }, 100);
    });

    it("should display the choices, regardless if they're declared as string or numeric, when data is present", function(done) {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 1),
        columns: [
          {
            editor: 'autocomplete',
            source: ["1", "2", 3, "4", 5, 6]
          }
        ]
      });

      selectCell(0, 0);

      keyDownUp('backspace');

      var editor = $('.autocompleteEditor');

      keyDownUp('enter');

      setTimeout(function () {
        expect(editor.find('tbody td:eq(0)').text()).toEqual('1');
        expect(editor.find('tbody td:eq(1)').text()).toEqual('2');
        expect(editor.find('tbody td:eq(2)').text()).toEqual('3');
        expect(editor.find('tbody td:eq(3)').text()).toEqual('4');
        expect(editor.find('tbody td:eq(4)').text()).toEqual('5');
        expect(editor.find('tbody td:eq(5)').text()).toEqual('6');
        done();
      }, 100);
    });

    it("should display the dropdown above the editor, when there is not enough space below the cell AND there is more space above the cell", function(done) {
      var hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(30,30),
        columns: [
          {
            editor: 'autocomplete',
            source: choices
          },{}, {},{},{},{},{},{},{},{},{},{},{},{},{},{}
        ],
        width: 400,
        height: 400
      });

      setDataAtCell(29, 0, '');
      selectCell(29, 0);

      mouseDoubleClick($(getCell(29, 0)));

      setTimeout(function () {
        var autocompleteEditor = $('.autocompleteEditor');

        expect(autocompleteEditor.css('position')).toEqual('absolute');
        expect(autocompleteEditor.css('top')).toEqual((-1) * autocompleteEditor.height() + 'px');
        done();
      }, 200);
    });

    it("should flip the dropdown upwards when there is no more room left below the cell after filtering the choice list", function(done) {
      var hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(30,30),
        columns: [
          {
            editor: 'autocomplete',
            source: choices
          },{}, {},{},{},{},{},{},{},{},{},{},{},{},{},{}
        ],
        width: 400,
        height: 400
      });

      setDataAtCell(26, 0, 'b');
      selectCell(26, 0);

      hot.view.wt.wtTable.holder.scrollTop = 999;

      mouseDoubleClick($(getCell(26, 0)));

      var autocompleteEditor = $('.autocompleteEditor');

      setTimeout(function () {
        expect(autocompleteEditor.css('position')).toEqual('relative');

        autocompleteEditor.siblings('textarea').first().val('');
        keyDownUp('backspace');
      }, 20);

      setTimeout(function () {
        expect(autocompleteEditor.css('position')).toEqual('absolute');
        expect(autocompleteEditor.css('top')).toEqual((-1) * autocompleteEditor.height() + 'px');
        done();
      }, 100);
    });
  });

  describe("closing editor", function() {
    it('should destroy editor when value change with mouse click on suggestion', function(done) {
      var syncSources = jasmine.createSpy('syncSources');

      syncSources.and.callFake(function(query, process) {
        process(choices);
      });

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

      setTimeout(function () {
        autocomplete().find('tbody td:eq(3)').simulate('mousedown');

        expect(getDataAtCell(0, 0)).toEqual('green');
        done();
      }, 200);
    });

    it('should destroy editor when value change with Enter on suggestion', function(done) {
      var syncSources = jasmine.createSpy('syncSources');

      syncSources.and.callFake(function(query, process) {
        process(choices);
      });

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

      setTimeout(function () {
        keyDownUp('arrow_down');
        keyDownUp('arrow_down');
        keyDownUp('arrow_down');
        keyDownUp('arrow_down');
        keyDownUp('enter');

        expect(getDataAtCell(0, 0)).toEqual('green');
        done();
      }, 200);
    });

    it('should destroy editor when pressed Enter then Esc', function(done) {
      var syncSources = jasmine.createSpy('syncSources');

      syncSources.and.callFake(function(query, process) {
        process(choices);
      });

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

      setTimeout(function () {
        expect(autocompleteEditor().is(":visible")).toBe(true);

        keyDownUp('esc');

        expect(autocompleteEditor().is(":visible")).toBe(false);
        done();
      }, 200);
    });

    it('should destroy editor when mouse double clicked then Esc', function(done) {
      var syncSources = jasmine.createSpy('syncSources');

      syncSources.and.callFake(function(query, process) {
        process(choices);
      });

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

      setTimeout(function () {
        expect(autocompleteEditor().is(":visible")).toBe(true);

        keyDownUp('esc');

        expect(autocompleteEditor().is(":visible")).toBe(false);
        done();
      }, 200);
    });

    it('cancel editing (Esc) should restore the previous value', function(done) {
      var syncSources = jasmine.createSpy('syncSources');

      syncSources.and.callFake(function(query, process) {
        process(choices);
      });

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

      setTimeout(function () {
        autocomplete().siblings('.handsontableInput').val("ye");
        keyDownUp(69); //e
        keyDownUp('esc');

        expect(getDataAtCell(0, 0)).toEqual('black');
        done();
      }, 200);
    });

    it('should destroy editor when clicked outside the table', function(done) {
      var syncSources = jasmine.createSpy('syncSources');

      syncSources.and.callFake(function(query, process) {
        process(choices);
      });
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

      setTimeout(function () {
        expect(autocompleteEditor().is(":visible")).toBe(true);

        $('body').simulate('mousedown');

        expect(autocompleteEditor().is(":visible")).toBe(false);
        done();
      }, 200);
    });

    it("should show fillHandle element again after close editor", function(done) {
      var syncSources = jasmine.createSpy('syncSources');

      syncSources.plan = function(query, process) {
        process(choices.filter(function(choice) {
          return choice.indexOf(query) != -1;
        }));
      };

      var hot = handsontable({
        columns: [
          {
            type: 'autocomplete',
            source: syncSources,
            strict: false
          },
          {}
        ]
      });

      selectCell(1, 0);
      keyDownUp('x'); // Trigger quick edit mode
      keyDownUp('enter');

      setTimeout(function () {
        expect($('#testContainer.handsontable > .handsontable .wtBorder.current.corner:visible').length).toEqual(1);
        done();
      }, 200);
    });
  });

  describe("non strict mode", function() {
    it("should allow any value in non strict mode (close editor with ENTER)", function(done) {
      var syncSources = jasmine.createSpy('syncSources');

      syncSources.and.callFake(function(query, process) {
        process(choices);
      });

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

      setTimeout(function () {
        var editor = $('.handsontableInput');
        editor.val('foo');
        keyDownUp('enter');

        expect(getDataAtCell(0, 0)).toEqual('foo');
        done();
      }, 200);
    });

    it("should allow any value in non strict mode (close editor by clicking on table)", function(done) {
      var syncSources = jasmine.createSpy('syncSources');

      syncSources.and.callFake(function(query, process) {
        process(choices);
      });

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

      setTimeout(function () {
        var editor = $('.handsontableInput');
        editor.val('foo');
        spec().$container.find('tbody tr:eq(1) td:eq(0)').simulate('mousedown');

        expect(getDataAtCell(0, 0)).toEqual('foo');
        done();
      }, 200);
    });

    it("should save the value from textarea after hitting ENTER", function(done) {
      var syncSources = jasmine.createSpy('syncSources');

      syncSources.and.callFake(function(query, process) {
        process(choices.filter(function(choice) {
          return choice.indexOf(query) != -1;
        }));
      });

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

      setTimeout(function () {
        syncSources.calls.reset();

        editorInput.val("b");
        keyDownUp("b".charCodeAt(0));
      }, 200);

      setTimeout(function () {
        var ac = Handsontable.editors.getEditor('autocomplete', hot);
        var innerHot = ac.htEditor;

        expect(innerHot.getData()).toEqual([
          ['blue'],
          ['black']
        ]);

        var selected = innerHot.getSelected();

        expect(selected).toBeUndefined();

        keyDownUp('enter');

        expect(getDataAtCell(0, 0)).toEqual('b');
        done();
      }, 400);
    });
  });

  describe("strict mode", function() {
    it('strict mode should NOT use value if it DOES NOT match the list (sync reponse is empty)', function(done) {
      var onAfterValidate = jasmine.createSpy('onAfterValidate');
      var onAfterChange = jasmine.createSpy('onAfterChange');
      var syncSources = jasmine.createSpy('syncSources');

      syncSources.and.callFake(function(query, process) {
        process([]); // hardcoded empty result
      });

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
          {}
        ],
        afterValidate: onAfterValidate,
        afterChange: onAfterChange
      });

      setDataAtCell(0, 0, 'unexistent');

      setTimeout(function () {
        expect(getData()).toEqual([
          ['one', 'two'],
          ['three', 'four']
        ]);

        expect(syncSources.calls.count()).toEqual(1);
        expect(onAfterValidate.calls.count()).toEqual(1);
        expect(onAfterChange.calls.count()).toEqual(1); //1 for loadData (it is not called after failed edit)
        done();
      }, 200);
    });

    it('strict mode should use value if it DOES match the list (sync reponse is not empty)', function(done) {
      var onAfterValidate = jasmine.createSpy('onAfterValidate');
      var onAfterChange = jasmine.createSpy('onAfterChange');
      var syncSources = jasmine.createSpy('asyncSources');

      syncSources.and.callFake(function(query, process) {
        process(choices); // hardcoded empty result
      });

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
          {}
        ],
        afterValidate: onAfterValidate,
        afterChange: onAfterChange
      });

      setDataAtCell(0, 0, 'yellow');

      setTimeout(function () {
        expect(getData()).toEqual([
          ['yellow', 'two'],
          ['three', 'four']
        ]);

        expect(syncSources.calls.count()).toEqual(1);
        expect(onAfterValidate.calls.count()).toEqual(1);
        expect(onAfterChange.calls.count()).toEqual(2); //1 for loadData and 1 for setDataAtCell
        done();
      }, 200);
    });

    it('strict mode should NOT use value if it DOES NOT match the list (async reponse is empty)', function(done) {
      var onAfterValidate = jasmine.createSpy('onAfterValidate');
      var onAfterChange = jasmine.createSpy('onAfterChange');
      var asyncSources = jasmine.createSpy('asyncSources');

      asyncSources.and.callFake(function(query, process) {
        setTimeout(function() {
          process([]); // hardcoded empty result
        });
      });

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
          {}
        ],
        afterValidate: onAfterValidate,
        afterChange: onAfterChange
      });

      setDataAtCell(0, 0, 'unexistent');

      setTimeout(function () {
        expect(getData()).toEqual([
          ['one', 'two'],
          ['three', 'four']
        ]);

        expect(asyncSources.calls.count()).toEqual(1);
        expect(onAfterValidate.calls.count()).toEqual(1);
        expect(onAfterChange.calls.count()).toEqual(1); //1 for loadData (it is not called after failed edit)
        done();
      }, 200);
    });

    it('strict mode should use value if it DOES match the list (async reponse is not empty)', function(done) {
      var onAfterValidate = jasmine.createSpy('onAfterValidate');
      var onAfterChange = jasmine.createSpy('onAfterChange');
      var asyncSources = jasmine.createSpy('asyncSources');

      asyncSources.and.callFake(function(query, process) {
        setTimeout(function() {
          process(choices); // hardcoded empty result
        });
      });

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
          {}
        ],
        afterValidate: onAfterValidate,
        afterChange: onAfterChange
      });

      setDataAtCell(0, 0, 'yellow');

      setTimeout(function () {
        expect(getData()).toEqual([
          ['yellow', 'two'],
          ['three', 'four']
        ]);

        expect(asyncSources.calls.count()).toEqual(1);
        expect(onAfterValidate.calls.count()).toEqual(1);
        expect(onAfterChange.calls.count()).toEqual(2); //1 for loadData and 1 for setDataAtCell
        done();
      }, 200);
    });

    it('strict mode mark value as invalid if it DOES NOT match the list (sync reponse is empty)', function(done) {
      var onAfterValidate = jasmine.createSpy('onAfterValidate');
      var onAfterChange = jasmine.createSpy('onAfterChange');
      var syncSources = jasmine.createSpy('syncSources');

      syncSources.and.callFake(function(query, process) {
        process([]); // hardcoded empty result
      });

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
          {}
        ],
        afterValidate: onAfterValidate,
        afterChange: onAfterChange
      });

      expect(getCellMeta(0, 0).valid).not.toBe(false);
      expect($(getCell(0, 0)).hasClass('htInvalid')).toBe(false);

      setDataAtCell(0, 0, 'unexistent');

      setTimeout(function () {
        expect(getData()).toEqual([
          ['unexistent', 'two'],
          ['three', 'four']
        ]);

        expect(getCellMeta(0, 0).valid).toBe(false);
        expect($(getCell(0, 0)).hasClass('htInvalid')).toBe(true);
        done();
      }, 200);
    });

    it("should select the best matching option after hitting ENTER", function(done) {
      var onAfterValidate = jasmine.createSpy('onAfterValidate');
      var syncSources = jasmine.createSpy('syncSources');

      syncSources.and.callFake(function(query, process) {
        process(choices.filter(function(choice) {
          return choice.indexOf(query) != -1;
        }));
      });

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

      setTimeout(function () {
        syncSources.calls.reset();

        editorInput.val("b");
        keyDownUp("b".charCodeAt(0));
      }, 200);

      setTimeout(function () {
        var ac = Handsontable.editors.getEditor('autocomplete', hot);
        var innerHot = ac.htEditor;

        expect(innerHot.getData()).toEqual([
          ['blue'],
          ['black']
        ]);

        var selected = innerHot.getSelected();
        var selectedData = innerHot.getDataAtCell(selected[0], selected[1]);

        expect(selectedData).toEqual('blue');

        onAfterValidate.calls.reset();

        keyDownUp('enter');
      }, 400);

      setTimeout(function () {
        expect(getDataAtCell(0, 0)).toEqual('blue');
        done();
      }, 600);
    });

    it("should select the best matching option after hitting TAB", function(done) {
      var onAfterValidate = jasmine.createSpy('onAfterValidate');
      var syncSources = jasmine.createSpy('syncSources');

      syncSources.and.callFake(function(query, process) {
        process(choices.filter(function(choice) {
          return choice.indexOf(query) != -1;
        }));
      });

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

      setTimeout(function () {
        syncSources.calls.reset();

        editorInput.val("b");
        keyDownUp("b".charCodeAt(0));
      }, 200);

      setTimeout(function () {
        var ac = Handsontable.editors.getEditor('autocomplete', hot);
        var innerHot = ac.htEditor;

        expect(innerHot.getData()).toEqual([
          ['blue'],
          ['black']
        ]);

        var selected = innerHot.getSelected();
        var selectedData = innerHot.getDataAtCell(selected[0], selected[1]);

        expect(selectedData).toEqual('blue');

        onAfterValidate.calls.reset();

        keyDownUp('tab');
      }, 400);

      setTimeout(function () {
        expect(getDataAtCell(0, 0)).toEqual('blue');
        done();
      }, 600);
    });

    it("should mark list item corresponding to current cell value as selected", function(done) {
      var syncSources = jasmine.createSpy('syncSources');

      syncSources.and.callFake(function(query, process) {
        process(['red', 'dark-yellow', 'yellow', 'light-yellow', 'black']);
      });

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

      setTimeout(function () {
        expect(autocomplete().find('.current').text()).toEqual(getDataAtCell(0, 0));
        done();
      }, 200);
    });
  });

  describe("filtering", function() {
    it('typing in textarea should filter the lookup list', function(done) {
      var syncSources = jasmine.createSpy('syncSources');

      syncSources.and.callFake(function(query, process) {
        process(choices.filter(function(choice) {
          return choice.indexOf(query) != -1;
        }));
      });

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

      setTimeout(function () {
        syncSources.calls.reset();
        editorInput.val("e");
        keyDownUp(69); //e
      }, 200);

      setTimeout(function () {
        var ac = Handsontable.editors.getEditor('autocomplete', hot);
        var innerHot = ac.htEditor;

        expect(innerHot.getData()).toEqual([
          ['red'],
          ['yellow'],
          ['green'],
          ['blue'],
          ['lime'],
          ['white'],
          ['olive'],
          ['orange'],
          ['purple']
        ]);

        syncSources.calls.reset();
        editorInput.val("ed");
        keyDownUp(68); //d
      }, 400);

      setTimeout(function () {
        var ac = Handsontable.editors.getEditor('autocomplete', hot);
        var innerHot = ac.htEditor;

        expect(innerHot.getData()).toEqual([
          ['red']
        ]);
        done();
      }, 600);
    });
    it('default filtering should be case insensitive', function(done) {
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

      setTimeout(function () {
        var ac = Handsontable.editors.getEditor('autocomplete', hot);
        var innerHot = ac.htEditor;

        expect(innerHot.getData()).toEqual([
          ['red'],
          ['yellow'],
          ['green'],
          ['blue'],
          ['lime'],
          ['white'],
          ['olive'],
          ['orange'],
          ['purple']
        ]);

        editorInput.val("E");
        keyDownUp(69); //E (same as "e")
      }, 50);

      setTimeout(function () {
        var ac = Handsontable.editors.getEditor('autocomplete', hot);
        var innerHot = ac.htEditor;

        expect(innerHot.getData()).toEqual([
          ['red'],
          ['yellow'],
          ['green'],
          ['blue'],
          ['lime'],
          ['white'],
          ['olive'],
          ['orange'],
          ['purple']
        ]);
        done();
      }, 100);
    });

    it('default filtering should be case sensitive when filteringCaseSensitive is false', function(done) {
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

      setTimeout(function () {
        var ac = Handsontable.editors.getEditor('autocomplete', hot);
        var innerHot = ac.htEditor;

        expect(innerHot.getData()).toEqual([
          ['red'],
          ['yellow'],
          ['green'],
          ['blue'],
          ['lime'],
          ['white'],
          ['olive'],
          ['orange'],
          ['purple']
        ]);

        editorInput.val("E");
        keyDownUp(69); //E (same as "e")
      }, 50);

      setTimeout(function () {
        var ac = Handsontable.editors.getEditor('autocomplete', hot);
        var innerHot = ac.htEditor;

        expect(innerHot.getData()).toEqual([]);
        expect(innerHot.getSourceData()).toEqual([]);
        done();
      }, 200);
    });

    it('typing in textarea should NOT filter the lookup list when filtering is disabled', function(done) {
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

      setTimeout(function () {
        editorInput.val("e");
        keyDownUp("e".charCodeAt(0)); //e
      }, 20);

      setTimeout(function () {
        var ac = Handsontable.editors.getEditor('autocomplete', hot);
        var innerHot = ac.htEditor;

        expect(innerHot.getData()).toEqual(Handsontable.helper.pivot([choices]));

        editorInput.val("ed");
        keyDownUp("d".charCodeAt(0)); //d
      }, 40);

      setTimeout(function () {
        var ac = Handsontable.editors.getEditor('autocomplete', hot);
        var innerHot = ac.htEditor;

        expect(innerHot.getData()).toEqual(Handsontable.helper.pivot([choices]));
        done();
      }, 60);
    });

    it('typing in textarea should highlight the matching phrase', function(done) {
      var choices = ['Male', 'Female'];
      var syncSources = jasmine.createSpy('syncSources');

      syncSources.and.callFake(function(query, process) {
        process(choices.filter(function(choice) {
          return choice.search(new RegExp(query, 'i')) != -1;
        }));
      });

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

      setTimeout(function () {
        syncSources.calls.reset();

        editorInput.val("Male");
        keyDownUp(69); //e
      }, 200);

      setTimeout(function () {
        var ac = Handsontable.editors.getEditor('autocomplete', hot);
        var innerHot = ac.htEditor;
        var autocompleteList = $(innerHot.rootElement);

        expect(autocompleteList.find('td:eq(0)').html()).toMatch(/<(strong|STRONG)>Male<\/(strong|STRONG)>/); //IE8 makes the tag names UPPERCASE
        expect(autocompleteList.find('td:eq(1)').html()).toMatch(/Fe<(strong|STRONG)>male<\/(strong|STRONG)>/);
        done();
      }, 400);
    });

    it('text in textarea should not be interpreted as regexp', function(done) {
      spyOn(Handsontable.editors.AutocompleteEditor.prototype, 'queryChoices').and.callThrough();
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

      setTimeout(function () {
        queryChoices.calls.reset();
        editorInput.val("yellow|red");
        keyDownUp("d".charCodeAt(0));
      }, 200);

      setTimeout(function () {
        var ac = Handsontable.editors.getEditor('autocomplete', hot);
        var innerHot = ac.htEditor;

        expect(innerHot.getData().length).toEqual(0);
        done();
      }, 400);
    });

    it('text in textarea should not be interpreted as regexp when highlighting the matching phrase', function(done) {
      var choices = ['Male', 'Female'];
      var syncSources = jasmine.createSpy('syncSources');

      syncSources.and.callFake(function(query, process) {
        process(choices.filter(function(choice) {
          return choice.search(new RegExp(query, 'i')) != -1;
        }));
      });

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

      setTimeout(function () {
        syncSources.calls.reset();
        editorInput.val("M|F");
        keyDownUp('F'.charCodeAt(0));
      }, 200);

      setTimeout(function () {
        var ac = Handsontable.editors.getEditor('autocomplete', hot);
        var innerHot = ac.htEditor;

        var autocompleteList = $(innerHot.rootElement);

        expect(autocompleteList.find('td:eq(0)').html()).toEqual('Male');
        expect(autocompleteList.find('td:eq(1)').html()).toEqual('Female');
        done();
      }, 400);
    });

    it("should allow any value if filter === false and allowInvalid === true", function(done) {
      spyOn(Handsontable.editors.AutocompleteEditor.prototype, 'queryChoices').and.callThrough();
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

      setTimeout(function () {
        queryChoices.calls.reset();
        editorInput.val("foobar");
        keyDownUp(82); //r
      }, 200);

      setTimeout(function () {
        keyDownUp(Handsontable.helper.KEY_CODES.ENTER);

        expect(getDataAtCell(0, 0)).toEqual('foobar');
        done()
      }, 400);
    });

    it('typing in textarea should highlight best choice, if strict === true', function(done) {
      var choices = ['Male', 'Female'];
      var syncSources = jasmine.createSpy('syncSources');

      syncSources.and.callFake(function(query, process) {
        process(choices.filter(function(choice) {
          return choice.search(new RegExp(query, 'i')) != -1;
        }));
      });

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

      setTimeout(function () {
        syncSources.calls.reset();
        editorInput.val("e");
        keyDownUp(69); //e
      }, 200);

      setTimeout(function () {
        var ac = Handsontable.editors.getEditor('autocomplete', hot);
        var innerHot = ac.htEditor;

        expect(innerHot.getSelected()).toEqual([1, 0, 1, 0]);
        done();
      }, 400);
    });
  });

  it('should restore the old value when hovered over a autocomplete menu item and then clicked outside of the table', function(done) {
    var syncSources = jasmine.createSpy('syncSources');

    syncSources.and.callFake(function(query, process) {
      process(choices);
    });

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

    setTimeout(function () {
      autocomplete().find('tbody td:eq(1)').simulate('mouseenter');
      autocomplete().find('tbody td:eq(1)').simulate('mouseleave');

      spec().$container.simulate('mousedown');

      expect(getDataAtCell(0, 0)).toBeNull();
      done();
    }, 200);
  });

  it('should be able to use empty value ("")', function(done) {
    var syncSources = jasmine.createSpy('syncSources');

    syncSources.and.callFake(function(query, process) {
      process(['', 'BMW', 'Bentley']);
    });

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

    setTimeout(function () {
      expect(getDataAtCell(0, 0)).toEqual('one');

      autocomplete().find('tbody td:eq(0)').simulate('mousedown');

      expect(getDataAtCell(0, 0)).toEqual('');
      done();
    }, 200);
  });

  describe("allow html mode", function() {
    it('should allow inject html items (async mode)', function(done) {
      hot = handsontable({
        columns: [
          {
            type: 'autocomplete',
            source: function (query, cb) {
              cb(['<b>foo <span>zip</span></b>', '<i>bar</i>', '<strong>baz</strong>']);
            },
            allowHtml: true,
          }
        ]
      });

      selectCell(0, 0);
      var editorInput = $('.handsontableInput');

      expect(getDataAtCell(0, 0)).toBeNull();

      keyDownUp('enter');

      setTimeout(function () {
        editorInput.val("b");
        keyDownUp('b'.charCodeAt(0));
      }, 200);

      setTimeout(function () {
        var ac = Handsontable.editors.getEditor('autocomplete', hot);
        var innerHot = ac.htEditor;

        expect(innerHot.getData()).toEqual([
          ['<i>bar</i>'],
          ['<strong>baz</strong>'],
        ]);

        editorInput.val("bar");
        keyDownUp('a'.charCodeAt(0));
        keyDownUp('r'.charCodeAt(0));
      }, 400);

      setTimeout(function () {
        var ac = Handsontable.editors.getEditor('autocomplete', hot);
        var innerHot = ac.htEditor;

        expect(innerHot.getData()).toEqual([
          ['<i>bar</i>']
        ]);

        keyDownUp('arrow_down');
        keyDownUp('enter');
      }, 600);

      setTimeout(function () {
        expect(getCell(0, 0).querySelector('i').textContent).toBe('bar');
        done();
      }, 700);
    });

    it('should allow inject html items (sync mode)', function(done) {
      hot = handsontable({
        columns: [
          {
            type: 'autocomplete',
            source: ['<b>foo <span>zip</span></b>', '<i>bar</i>', '<strong>baz</strong>'],
            allowHtml: true,
          }
        ]
      });

      selectCell(0, 0);
      var editorInput = $('.handsontableInput');

      expect(getDataAtCell(0, 0)).toBeNull();

      keyDownUp('enter');

      setTimeout(function () {
        editorInput.val("b");
        keyDownUp('b'.charCodeAt(0));
      }, 200);

      setTimeout(function () {
        var ac = Handsontable.editors.getEditor('autocomplete', hot);
        var innerHot = ac.htEditor;

        expect(innerHot.getData()).toEqual([
          ['<i>bar</i>'],
          ['<strong>baz</strong>'],
        ]);

        editorInput.val("bar");
        keyDownUp('a'.charCodeAt(0));
        keyDownUp('r'.charCodeAt(0));
      }, 400);

      setTimeout(function () {
        var ac = Handsontable.editors.getEditor('autocomplete', hot);
        var innerHot = ac.htEditor;

        expect(innerHot.getData()).toEqual([
          ['<i>bar</i>']
        ]);

        keyDownUp('arrow_down');
        keyDownUp('enter');
      }, 600);

      setTimeout(function () {
        expect(getCell(0, 0).querySelector('i').textContent).toBe('bar');
        done();
      }, 700);
    });
  });

  describe("disallow html mode", function() {
    it('should be disabled by default', function() {
      hot = handsontable({
        columns: [
          {
            type: 'autocomplete',
            source: function (query, cb) {
              cb(['<b>foo <span>zip</span></b>', '<i>bar</i>', '<strong>baz</strong>']);
            },
            allowHtml: false,
          }
        ]
      });

      expect(hot.getCellMeta(0, 0).allowHtml).toBeFalsy();
    });

    it('should strip html from strings provided in source (async mode)', function(done) {
      hot = handsontable({
        columns: [
          {
            type: 'autocomplete',
            source: function (query, cb) {
              cb(['<b>foo <span>zip</span></b>', '<i>bar</i>', '<strong>baz</strong>']);
            },
            allowHtml: false,
          }
        ]
      });

      selectCell(0, 0);
      var editorInput = $('.handsontableInput');

      expect(getDataAtCell(0, 0)).toBeNull();

      keyDownUp('enter');

      setTimeout(function () {
        editorInput.val("b");
        keyDownUp('b'.charCodeAt(0));
      }, 200);

      setTimeout(function () {
        var ac = Handsontable.editors.getEditor('autocomplete', hot);
        var innerHot = ac.htEditor;

        expect(innerHot.getData()).toEqual([
          ['bar'],
          ['baz'],
        ]);

        editorInput.val("bar");
        keyDownUp('a'.charCodeAt(0));
        keyDownUp('r'.charCodeAt(0));
      }, 400);

      setTimeout(function () {
        var ac = Handsontable.editors.getEditor('autocomplete', hot);
        var innerHot = ac.htEditor;

        expect(innerHot.getData()).toEqual([
          ['bar']
        ]);

        keyDownUp('arrow_down');
        keyDownUp('enter');
      }, 600);

      setTimeout(function () {
        expect(getCell(0, 0).querySelector('i')).toBeNull()
        expect(getCell(0, 0).textContent).toMatch('bar');
        done();
      }, 700);
    });

    it('should strip html from strings provided in source (sync mode)', function(done) {
      hot = handsontable({
        columns: [
          {
            type: 'autocomplete',
            source: ['<b>foo <span>zip</span></b>', '<i>bar</i>', '<strong>baz</strong>'],
            allowHtml: false,
          }
        ]
      });

      selectCell(0, 0);
      var editorInput = $('.handsontableInput');

      expect(getDataAtCell(0, 0)).toBeNull();

      keyDownUp('enter');

      setTimeout(function () {
        editorInput.val("b");
        keyDownUp('b'.charCodeAt(0));
      }, 200);

      setTimeout(function () {
        var ac = Handsontable.editors.getEditor('autocomplete', hot);
        var innerHot = ac.htEditor;

        expect(innerHot.getData()).toEqual([
          ['bar'],
          ['baz'],
        ]);

        editorInput.val("bar");
        keyDownUp('a'.charCodeAt(0));
        keyDownUp('r'.charCodeAt(0));
      }, 400);

      setTimeout(function () {
        var ac = Handsontable.editors.getEditor('autocomplete', hot);
        var innerHot = ac.htEditor;

        expect(innerHot.getData()).toEqual([
          ['bar']
        ]);

        keyDownUp('arrow_down');
        keyDownUp('enter');
      }, 600);

      setTimeout(function () {
        expect(getCell(0, 0).querySelector('i')).toBeNull()
        expect(getCell(0, 0).textContent).toMatch('bar');
        done();
      }, 700);
    });
  });

  describe("Autocomplete helper functions:", function() {
    describe("sortByRelevance", function() {
      it("should sort the provided array, so items more relevant to the provided value are listed first", function() {
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

        expect(sorted).toEqual([0, 2, 4, 3, 1]);

        value = 'o';
        sorted = Handsontable.editors.AutocompleteEditor.sortByRelevance(value, choices);

        expect(sorted).toEqual([6, 8]);

        value = 'er';
        sorted = Handsontable.editors.AutocompleteEditor.sortByRelevance(value, choices);

        expect(sorted).toEqual([2, 4]);
      });
    });
  });

  it("should not modify the suggestion lists' order, when the sortByRelevance option is set to false", function(done) {
    var choices = [
      'Wayne','Draven','Banner','Stark','Parker','Kent','Gordon','Kyle','Simmons'
    ];
    var hot = handsontable({
      columns: [
        {
          editor: 'autocomplete',
          source: choices,
          sortByRelevance: false
        }
      ]
    });

    selectCell(0, 0);
    keyDownUp('enter');
    var $editorInput = $('.handsontableInput');
    $editorInput.val('a');
    keyDownUp('a'.charCodeAt(0));
    Handsontable.Dom.setCaretPosition($editorInput[0], 1);

    setTimeout(function () {
      var dropdownList = $('.autocompleteEditor tbody').first();
      var listLength = dropdownList.find('tr').size();

      expect(listLength).toBe(9);

      for (var i = 1; i <= listLength; i++) {
        expect(dropdownList.find('tr:nth-child(' + i + ') td').text()).toEqual(choices[i - 1]);
      }
      done();
    }, 30);
  });

  it("should fire one afterChange event when value is changed", function(done) {
    var onAfterChange = jasmine.createSpy('onAfterChange');
    var syncSources = jasmine.createSpy('syncSources');

    syncSources.and.callFake(function(query, process) {
      process(choices);
    });

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

    setTimeout(function () {
      onAfterChange.calls.reset();
      autocomplete().find('tbody td:eq(1)').simulate('mousedown');

      expect(getDataAtCell(0, 0)).toEqual('red');
      expect(onAfterChange.calls.count()).toEqual(1);
      expect(onAfterChange).toHaveBeenCalledWith([[0, 0, null, 'red']], 'edit', undefined, undefined, undefined, undefined);
      done();
    }, 200);
  });

  it("should not affect other cell values after clicking on autocomplete cell (#1021)", function(done) {
    var syncSources = jasmine.createSpy('syncSources');

    syncSources.and.callFake(function(query, process) {
      process(choices);
    });

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

    setTimeout(function () {
      expect(getDataAtCol(2)).toEqual(['yellow', 'red', 'blue']);
      done();
    }, 200);
  });

  it("should handle editor if cell data is a function", function(done) {
    spyOn(Handsontable.editors.AutocompleteEditor.prototype, 'updateChoicesList').and.callThrough();
    var updateChoicesList = Handsontable.editors.AutocompleteEditor.prototype.updateChoicesList;
    var afterValidateCallback = jasmine.createSpy('afterValidateCallbak');

    var hot = handsontable({
      data: [
        new Model({
          id: 1,
          name: "Ted Right",
          address: ""
        }),
        new Model({
          id: 2,
          name: "Frank Honest",
          address: ""
        }),
        new Model({
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

    setTimeout(function () {
      expect(hot.getActiveEditor().isOpened()).toBe(true);
      afterValidateCallback.calls.reset();
      $(hot.getActiveEditor().htContainer).find('tr:eq(1) td:eq(0)').simulate('mousedown');
    }, 200);

    setTimeout(function () {
      expect(getDataAtCell(0, 0)).toEqual('2');
      done();
    }, 400);
  });

  it("should not call the `source` has been selected", function() {
    var syncSources = jasmine.createSpy('syncSources');

    syncSources.and.callFake(function(query, process) {
      process([]); // hardcoded empty result
    });

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
        {}
      ],
      cells: function(row, col) {
        var cellProperties = {};

        if (row === 0 && col === 0) {
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

  it("should not call the `source` method if cell is read only and the arrow has been clicked", function(done) {
    var syncSources = jasmine.createSpy('syncSources');

    syncSources.and.callFake(function(query, process) {
      process([]); // hardcoded empty result
    });

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
        {}
      ],
      cells: function(row, col) {
        var cellProperties = {};

        if (row === 0 && col === 0) {
          cellProperties.readOnly = true;
        }

        return cellProperties;
      }
    });

    expect(getCellMeta(0, 0).readOnly).toBe(true);
    expect(syncSources).not.toHaveBeenCalled();

    selectCell(0, 0);
    $(getCell(0, 0)).find('.htAutocompleteArrow').simulate('mousedown');

    setTimeout(function () {
      expect(syncSources).not.toHaveBeenCalled();

      syncSources.calls.reset();
      expect(getCellMeta(1, 0).readOnly).toBeFalsy();

      selectCell(1, 0);
      $(getCell(1, 0)).find('.htAutocompleteArrow').simulate('mousedown');
    }, 100);

    setTimeout(function () {
      expect(syncSources).toHaveBeenCalled();
      expect(syncSources.calls.count()).toEqual(1);
      done();
    }, 200);
  });

  it("should add a scrollbar to the autocomplete dropdown, only if number of displayed choices exceeds 10", function(done) {
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
        {},
        {}
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

    setTimeout(function () {
      expect(dropdownHolder.scrollHeight).toBeGreaterThan(dropdownHolder.clientHeight);

      keyDownUp('esc');

      hot.getSettings().columns[0].source = hot.getSettings().columns[0].source.slice(0).splice(3);
      hot.updateSettings({});

      selectCell(0, 0);
      $(getCell(0, 0)).find('.htAutocompleteArrow').simulate('mousedown');
    }, 30);

    setTimeout(function () {
      expect(dropdownHolder.scrollHeight > dropdownHolder.clientHeight).toBe(false);
      done()
    }, 60);
  });

  it("should not close editor on scrolling", function(done) {
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
        {},
        {}
      ]
    });

    expect(choices.length).toBeGreaterThan(10);

    selectCell(0, 0);
    $(getCell(0, 0)).find('.htAutocompleteArrow').simulate('mousedown');
    $(getCell(0, 0)).find('.htAutocompleteArrow').simulate('mouseup');

    var dropdown = hot.getActiveEditor().htContainer;

    hot.view.wt.wtOverlays.topOverlay.scrollTo(1);

    setTimeout(function () {
      expect($(dropdown).is(':visible')).toBe(true);
      selectCell(0, 0);
    }, 30);

    setTimeout(function () {
      $(getCell(0, 0)).find('.htAutocompleteArrow').simulate('mousedown');
      $(getCell(0, 0)).find('.htAutocompleteArrow').simulate('mouseup');
      hot.view.wt.wtOverlays.topOverlay.scrollTo(3);
    }, 80);

    setTimeout(function () {
      expect($(dropdown).is(':visible')).toBe(true);
      done();
    }, 120);
  });

  it("should keep textarea caret position, after moving the selection to the suggestion list (pressing down arrow)", function(done) {
    var syncSources = jasmine.createSpy('syncSources');

    syncSources.and.callFake(function(query, process) {
      process(choices.filter(function(choice) {
        return choice.indexOf(query) != -1;
      }));
    });

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
    Handsontable.Dom.setCaretPosition($editorInput[0], 1);

    setTimeout(function () {
      keyDownUp('arrow_down');
      expect(Handsontable.Dom.getCaretPosition($editorInput[0])).toEqual(1);
      keyDownUp('arrow_down');
      expect(Handsontable.Dom.getCaretPosition($editorInput[0])).toEqual(1);
      done();
    }, 200);
  });

  it("should keep textarea selection, after moving the selection to the suggestion list (pressing down arrow)", function(done) {
    var syncSources = jasmine.createSpy('syncSources');

    syncSources.and.callFake(function(query, process) {
      process(choices.filter(function(choice) {
        return choice.indexOf(query) != -1;
      }));
    });

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
    Handsontable.Dom.setCaretPosition($editorInput[0], 1, 2);

    setTimeout(function () {
      keyDownUp('arrow_down');
      expect(Handsontable.Dom.getCaretPosition($editorInput[0])).toEqual(1);
      expect(Handsontable.Dom.getSelectionEndPosition($editorInput[0])).toEqual(2);
      keyDownUp('arrow_down');
      expect(Handsontable.Dom.getCaretPosition($editorInput[0])).toEqual(1);
      expect(Handsontable.Dom.getSelectionEndPosition($editorInput[0])).toEqual(2);
      done();
    }, 200);
  });

  it("should jump to the sibling cell, after pressing up key in quick edit mode", function(done) {
    var syncSources = jasmine.createSpy('syncSources');

    syncSources.and.callFake(function(query, process) {
      process(choices.filter(function(choice) {
        return choice.indexOf(query) != -1;
      }));
    });

    handsontable({
      columns: [
        {
          type: 'autocomplete',
          source: syncSources,
          strict: false
        },
        {}
      ]
    });

    selectCell(1, 0);
    keyDownUp('x'); // trigger quick edit mode
    var $editorInput = $('.handsontableInput');
    $editorInput.val("an");
    keyDownUp(65); //a
    keyDownUp(78); //n

    setTimeout(function () {
      keyDownUp('arrow_up');

      expect(getSelected()).toEqual([0, 0, 0, 0]);
      done();
    }, 200);
  });

  it("should jump to the next cell, after pressing right key in quick edit mode", function(done) {
    var syncSources = jasmine.createSpy('syncSources');

    syncSources.plan = function(query, process) {
      process(choices.filter(function(choice) {
        return choice.indexOf(query) != -1;
      }));
    };

    handsontable({
      columns: [
        {
          type: 'autocomplete',
          source: syncSources,
          strict: false
        },
        {}
      ]
    });

    selectCell(1, 0);
    keyDownUp('x'); // trigger quick edit mode
    var $editorInput = $('.handsontableInput');
    $editorInput.val("an");
    keyDownUp(65); //a
    keyDownUp(78); //n

    setTimeout(function () {
      keyDownUp('arrow_right');

      expect(getSelected()).toEqual([1, 1, 1, 1]);
      done();
    }, 200);
  });

  it("should jump to the next cell, after pressing left key in quick edit mode", function(done) {
    var syncSources = jasmine.createSpy('syncSources');

    syncSources.and.callFake(function(query, process) {
      process(choices.filter(function(choice) {
        return choice.indexOf(query) != -1;
      }));
    });

    handsontable({
      columns: [
        {},
        {
          type: 'autocomplete',
          source: syncSources,
          strict: false
        }
      ]
    });

    selectCell(1, 1);
    keyDownUp('x'); // trigger quick edit mode
    var $editorInput = $('.handsontableInput');
    $editorInput.val("an");
    keyDownUp(65); //a
    keyDownUp(78); //n
    // put caret on the end of the text to ensure that editor will be closed after hit left arrow key
    Handsontable.Dom.setCaretPosition($editorInput[0], 2, 2);

    setTimeout(function () {
      keyDownUp('arrow_left');

      expect(getSelected()).toEqual([1, 0, 1, 0]);
      done();
    }, 200);
  });

  it("should jump to the next cell, after pressing down key in quick edit mode", function(done) {
    var syncSources = jasmine.createSpy('syncSources');

    syncSources.and.callFake(function(query, process) {
      process(choices.filter(function(choice) {
        return choice.indexOf(query) != -1;
      }));
    });

    handsontable({
      columns: [
        {
          type: 'autocomplete',
          source: syncSources,
          strict: false
        },
        {}
      ]
    });
    selectCell(1, 0);
    keyDownUp('x'); // trigger quick edit mode
    var $editorInput = $('.handsontableInput');
    $editorInput.val("an");
    keyDownUp(65); //a
    keyDownUp(78); //n

    setTimeout(function () {
      keyDownUp('arrow_down');

      expect(getSelected()).toEqual([1, 0, 1, 0]);
      done();
    }, 200);
  });

  it("should jump to the next cell, after pressing down key in quick edit mode when no matching option list found", function(done) {
    var syncSources = jasmine.createSpy('syncSources');

    syncSources.and.callFake(function(query, process) {
      process(choices.filter(function(choice) {
        return choice.indexOf(query) != -1;
      }));
    });

    handsontable({
      columns: [
        {
          type: 'autocomplete',
          source: syncSources,
          strict: false
        },
        {}
      ]
    });
    selectCell(1, 0);
    keyDownUp('x'); // trigger quick edit mode
    var $editorInput = $('.handsontableInput');
    $editorInput.val("anananan");
    keyDownUp(65); //a
    keyDownUp(78); //n
    keyDownUp(65); //a
    keyDownUp(78); //n
    keyDownUp(65); //a
    keyDownUp(78); //n
    keyDownUp(65); //a
    keyDownUp(78); //n

    setTimeout(function () {
      keyDownUp('arrow_down');

      expect(getSelected()).toEqual([2, 0, 2, 0]);
      done();
    }, 200);
  });

  it("shouldn\'t jump to the next cell, after pressing down key in quick edit mode when options list was opened", function(done) {
    var syncSources = jasmine.createSpy('syncSources');

    syncSources.and.callFake(function(query, process) {
      process(choices.filter(function(choice) {
        return choice.indexOf(query) != -1;
      }));
    });

    handsontable({
      columns: [
        {
          type: 'autocomplete',
          source: syncSources,
          strict: false
        },
        {}
      ]
    });
    selectCell(1, 0);
    keyDownUp('x'); // trigger quick edit mode
    var $editorInput = $('.handsontableInput');
    $editorInput.val("an");
    keyDownUp(65); //a
    keyDownUp(78); //n

    setTimeout(function () {
      keyDownUp('arrow_down');

      expect(getSelected()).toEqual([1, 0, 1, 0]);
      done();
    }, 200);
  });

  it("should select option in opened editor after pressing down key in quick edit mode", function(done) {
    var syncSources = jasmine.createSpy('syncSources');

    syncSources.and.callFake(function(query, process) {
      process(choices.filter(function(choice) {
        return choice.indexOf(query) != -1;
      }));
    });

    var hot = handsontable({
      columns: [
        {
          type: 'autocomplete',
          source: syncSources,
          strict: false
        },
        {}
      ]
    });

    selectCell(1, 0);
    keyDownUp('x'); // Trigger quick edit mode

    setTimeout(function () {
      keyDownUp('arrow_down');

      expect(hot.getActiveEditor().htEditor.getSelected()).toEqual([0, 0, 0, 0]);

      keyDownUp('arrow_down');

      expect(hot.getActiveEditor().htEditor.getSelected()).toEqual([1, 0, 1, 0]);

      keyDownUp('arrow_down');

      expect(hot.getActiveEditor().htEditor.getSelected()).toEqual([2, 0, 2, 0]);
      done();
    }, 200);
  });

  it("should select option in opened editor after pressing up key in quick edit mode", function(done) {
    var syncSources = jasmine.createSpy('syncSources');

    syncSources.and.callFake(function(query, process) {
      process(choices.filter(function(choice) {
        return choice.indexOf(query) != -1;
      }));
    });

    var hot = handsontable({
      columns: [
        {
          type: 'autocomplete',
          source: syncSources,
          strict: false
        },
        {}
      ]
    });

    selectCell(1, 0);
    keyDownUp('x'); // Trigger quick edit mode

    setTimeout(function () {
      hot.getActiveEditor().htEditor.selectCell(2, 0);

      expect(hot.getActiveEditor().htEditor.getSelected()).toEqual([2, 0, 2, 0]);

      keyDownUp('arrow_up');

      expect(hot.getActiveEditor().htEditor.getSelected()).toEqual([1, 0, 1, 0]);

      keyDownUp('arrow_up');

      expect(hot.getActiveEditor().htEditor.getSelected()).toEqual([0, 0, 0, 0]);

      keyDownUp('arrow_up');

      expect(hot.getActiveEditor().htEditor.getSelected()).toEqual([0, 0, 0, 0]);
      done();
    }, 200);
  });

  it("shouldn\'t close editor in quick edit mode after pressing down key when last option is selected", function(done) {
    var syncSources = jasmine.createSpy('syncSources');

    syncSources.and.callFake(function(query, process) {
      process(choices.filter(function(choice) {
        return choice.indexOf(query) != -1;
      }));
    });

    var hot = handsontable({
      columns: [
        {
          type: 'autocomplete',
          source: syncSources,
          strict: false
        },
        {}
      ]
    });

    selectCell(1, 0);
    keyDownUp('x'); // Trigger quick edit mode

    setTimeout(function () {
      hot.getActiveEditor().htEditor.selectCell(7, 0);
      hot.listen();

      keyDownUp('arrow_down');
      keyDownUp('arrow_down');
      keyDownUp('arrow_down');
      keyDownUp('arrow_down');
      keyDownUp('arrow_down');

      expect(hot.getActiveEditor().isOpened()).toBe(true);
      done();
    }, 200);
  });

  it("should close editor in quick edit mode after pressing up key when no option is selected", function(done) {
    var syncSources = jasmine.createSpy('syncSources');

    syncSources.and.callFake(function(query, process) {
      process(choices.filter(function(choice) {
        return choice.indexOf(query) != -1;
      }));
    });

    var hot = handsontable({
      columns: [
        {
          type: 'autocomplete',
          source: syncSources,
          strict: false
        },
        {}
      ]
    });

    selectCell(1, 0);
    keyDownUp('x'); // Trigger quick edit mode

    setTimeout(function () {
      hot.getActiveEditor().htEditor.selectCell(1, 0);
      hot.listen();

      keyDownUp('arrow_up');
      keyDownUp('arrow_up');
      keyDownUp('arrow_up');

      expect(getSelected()).toEqual([0, 0, 0, 0]);
      done();
    }, 200);
  });
});
