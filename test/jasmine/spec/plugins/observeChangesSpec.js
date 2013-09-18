describe('HandsontableObserveChanges', function () {
  var id = 'testContainer';

  beforeEach(function () {
    this.$container = $('<div id="' + id + '"></div>').appendTo('body');
  });

  afterEach(function () {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  function createHOT(data, observeChanges) {
    return handsontable({
      data: data,
      width: 200,
      height: 200,
      observeChanges: observeChanges
    });
  }

  describe("refreshing table after changes have been detected", function () {
    describe("array data", function () {
      it('should render newly added row', function () {
        var data = createSpreadsheetData(2, 2);
        var hot = createHOT(data, true);

        var afterRenderSpy = jasmine.createSpy('afterRenderSpy');
        hot.addHook('afterRender', afterRenderSpy);

        data.push(["A3", "B3"]);

        waitsFor(function () {
          return afterRenderSpy.callCount > 0;
        }, 'Table render', 1000);

        runs(function () {
          expect(this.$container.find('tr').length).toEqual(3);
          expect(this.$container.find('col').length).toEqual(2);
        });
      });

      it('should render newly added column', function () {
        var data = createSpreadsheetData(2, 2);
        var hot = createHOT(data, true);

        var afterRenderSpy = jasmine.createSpy('afterRenderSpy');
        hot.addHook('afterRender', afterRenderSpy);

        data[0].push("C1");
        data[1].push("C2");

        waitsFor(function () {
          return afterRenderSpy.callCount > 0;
        }, 'Table render', 1000);

        runs(function () {
          expect(this.$container.find('tr').length).toEqual(2);
          expect(this.$container.find('col').length).toEqual(3);
        });
      });

      it('should render removed row', function () {
        var data = createSpreadsheetData(2, 2);
        var hot = createHOT(data, true);

        var afterRenderSpy = jasmine.createSpy('afterRenderSpy');
        hot.addHook('afterRender', afterRenderSpy);

        data.splice(0, 1); //removes one row at index 0

        waitsFor(function () {
          return afterRenderSpy.callCount > 0;
        }, 'Table render', 1000);

        runs(function () {
          expect(this.$container.find('tr').length).toEqual(1);
          expect(this.$container.find('col').length).toEqual(2);
        });
      });

      it('should render removed column', function () {
        var data = createSpreadsheetData(2, 2);
        var hot = createHOT(data, true);

        var afterRenderSpy = jasmine.createSpy('afterRenderSpy');
        hot.addHook('afterRender', afterRenderSpy);

        data[0].splice(0, 1); //removes one column at index 0 in first row
        data[1].splice(0, 1); //removes one column at index 0 in second row

        waitsFor(function () {
          return afterRenderSpy.callCount > 0;
        }, 'Table render', 1000);

        runs(function () {
          expect(this.$container.find('tr').length).toEqual(2);
          expect(this.$container.find('col').length).toEqual(1);
        });
      });

      it('should render cell change from string to string', function () {
        var data = createSpreadsheetData(2, 2);
        var hot = createHOT(data, true);

        var afterRenderSpy = jasmine.createSpy('afterRenderSpy');
        hot.addHook('afterRender', afterRenderSpy);

        data[0][0] = 'new string';

        waitsFor(function () {
          return afterRenderSpy.callCount > 0;
        }, 'Table render', 1000);

        runs(function () {
          expect(this.$container.find('td:eq(0)').html()).toEqual('new string');
        });
      });

      it('should render cell change in a new row', function () {
        var data = createSpreadsheetData(2, 2);
        var hot = createHOT(data, true);

        var afterRenderSpy = jasmine.createSpy('afterRenderSpy');
        hot.addHook('afterRender', afterRenderSpy);

        data.push(["A3", "B3"]);

        waitsFor(function () {
          return afterRenderSpy.callCount > 0;
        }, 'Table render', 1000);

        runs(function () {
          expect(this.$container.find('tr:eq(2) td:eq(0)').html()).toEqual('A3');
          afterRenderSpy.reset();
          data[2][0] = 'new string';
        });

        waitsFor(function () {
          return afterRenderSpy.callCount > 0;
        }, 'Table render', 1000);

        runs(function () {
          expect(this.$container.find('tr:eq(2) td:eq(0)').html()).toEqual('new string');
        });
      });

      it('should not render cell change when turned off (`observeChanges: false`)', function () {
        var data = createSpreadsheetData(2, 2);
        createHOT(data, false);

        data[0][0] = 'new string';

        waits(100); //Object.observe is async

        runs(function () {
          expect(this.$container.find('td:eq(0)').html()).toEqual('A0');
        });
      });
    });
    describe("object data", function () {
      it('should render newly added row', function () {
        var data = createSpreadsheetObjectData(2, 2);
        var hot = createHOT(data, true);

        var afterRenderSpy = jasmine.createSpy('afterRenderSpy');
        hot.addHook('afterRender', afterRenderSpy);

        data.push({prop0 : "A3", prop1: "B3"});

        waitsFor(function () {
          return afterRenderSpy.callCount > 0;
        }, 'Table render', 1000);

        runs(function () {
          expect(this.$container.find('tr').length).toEqual(3);
          expect(this.$container.find('col').length).toEqual(2);
        });
      });

      it('should render removed row', function () {
        var data = createSpreadsheetObjectData(2, 2);
        var hot = createHOT(data, true);

        var afterRenderSpy = jasmine.createSpy('afterRenderSpy');
        hot.addHook('afterRender', afterRenderSpy);

        data.splice(0, 1); //removes one row at index 0

        waitsFor(function () {
          return afterRenderSpy.callCount > 0;
        }, 'Table render', 1000);

        runs(function () {
          expect(this.$container.find('tr').length).toEqual(1);
          expect(this.$container.find('col').length).toEqual(2);
        });
      });

      it('should render cell change from string to string', function () {
        var data = createSpreadsheetObjectData(2, 2);
        var hot = createHOT(data, true);

        var afterRenderSpy = jasmine.createSpy('afterRenderSpy');
        hot.addHook('afterRender', afterRenderSpy);

        data[0]['prop0'] = 'new string';

        waitsFor(function () {
          return afterRenderSpy.callCount > 0;
        }, 'Table render', 1000);

        runs(function () {
          expect(this.$container.find('td:eq(0)').html()).toEqual('new string');
        });
      });

      it('should render cell change in a new row', function () {
        var data = createSpreadsheetObjectData(2, 2);
        var hot = createHOT(data, true);

        var afterRenderSpy = jasmine.createSpy('afterRenderSpy');
        hot.addHook('afterRender', afterRenderSpy);

        data.push({prop0 : "A3", prop1: "B3"});

        waitsFor(function () {
          return afterRenderSpy.callCount > 0;
        }, 'Table render', 1000);

        runs(function () {
          expect(this.$container.find('tr:eq(2) td:eq(0)').html()).toEqual('A3');
          afterRenderSpy.reset();
          data[2]['prop0'] = 'new string';
        });

        waitsFor(function () {
          return afterRenderSpy.callCount > 0;
        }, 'Table render', 1000);

        runs(function () {
          expect(this.$container.find('tr:eq(2) td:eq(0)').html()).toEqual('new string');
        });
      });

      it('should not render cell change when turned off (`observeChanges: false`)', function () {
        var data = createSpreadsheetObjectData(2, 2);
        createHOT(data, false);

        data[0]['prop0'] = 'new string';

        waits(100); //Object.observe is async

        runs(function () {
          expect(this.$container.find('td:eq(0)').html()).toEqual('A0');
        });
      });
    });
  });

  describe("enabling/disabling plugin", function () {
    it("should be possible to enable plugin using updateSettings", function () {
      var data = createSpreadsheetData(2, 2);
      var hot = createHOT(data, false);

      data[0][0] = 'new string';

      waits(100); //Object.observe is async

      runs(function () {
        expect(this.$container.find('td:eq(0)').html()).toEqual('A0');

        updateSettings({
          observeChanges: true
        });

        var afterRenderSpy = jasmine.createSpy('afterRenderSpy');
        hot.addHook('afterRender', afterRenderSpy);

        data[1][0] = 'another new string';

        waitsFor(function () {
          return afterRenderSpy.callCount > 0;
        }, 'Table render', 1000);

        runs(function () {
          expect(this.$container.find('tr:eq(1) td:eq(0)').html()).toEqual('another new string');
        });

      });
    });

    it("should be possible to disable plugin using updateSettings", function () {
      var data = createSpreadsheetData(2, 2);
      var hot = createHOT(data, true);

      var afterRenderSpy = jasmine.createSpy('afterRenderSpy');
      hot.addHook('afterRender', afterRenderSpy);

      data[0][0] = 'new string';

      waitsFor(function () {
        return afterRenderSpy.callCount > 0;
      }, 'Table render', 1000);

      runs(function () {
        expect(this.$container.find('tbody tr:eq(0) td:eq(0)').html()).toEqual('new string');
        expect(this.$container.find('tbody tr:eq(1) td:eq(0)').html()).toEqual('A1');
      });

      runs(function () {
        updateSettings({
          observeChanges: false
        });

        data[1][0] = 'another new string';
      });

      waits(100);


      runs(function () {
        expect(this.$container.find('tbody tr:eq(0) td:eq(0)').html()).toEqual('new string');
        expect(this.$container.find('tbody tr:eq(1) td:eq(0)').html()).toEqual('A1');
      });


      runs(function () {
        hot.render();

        expect(this.$container.find('tbody tr:eq(0) td:eq(0)').html()).toEqual('new string');
        expect(this.$container.find('tbody tr:eq(1) td:eq(0)').html()).toEqual('another new string');
      });

    });

    it("should be possible to pause observing changes without disabling the plugin", function () {
      var data = createSpreadsheetData(2, 2);
      var hot = createHOT(data, true);

      var afterRenderSpy = jasmine.createSpy('afterRenderSpy');
      hot.addHook('afterRender', afterRenderSpy);

      data[0][0] = 'new string';

      waitsFor(function () {
        return afterRenderSpy.callCount > 0;
      }, 'Table render', 1000);

      runs(function () {
        expect(this.$container.find('tbody tr:eq(0) td:eq(0)').html()).toEqual('new string');
        expect(this.$container.find('tbody tr:eq(1) td:eq(0)').html()).toEqual('A1');
      });

      runs(function () {
        hot.pauseObservingChanges();

        data[1][0] = 'another new string';
      });

      waits(100);


      runs(function () {
        expect(this.$container.find('tbody tr:eq(0) td:eq(0)').html()).toEqual('new string');
        expect(this.$container.find('tbody tr:eq(1) td:eq(0)').html()).toEqual('A1');
      });


      runs(function () {
        hot.render();

        expect(this.$container.find('tbody tr:eq(0) td:eq(0)').html()).toEqual('new string');
        expect(this.$container.find('tbody tr:eq(1) td:eq(0)').html()).toEqual('another new string');
      });

    });

    it("should be possible to resume observing changes after it was paused", function () {
      var data = createSpreadsheetData(2, 2);
      var hot = createHOT(data, true);

      var afterRenderSpy = jasmine.createSpy('afterRenderSpy');
      hot.addHook('afterRender', afterRenderSpy);

      hot.pauseObservingChanges();

      data[0][0] = 'new string';

      waits(100);

      runs(function () {
        expect(this.$container.find('tbody tr:eq(0) td:eq(0)').html()).toEqual('A0');
        expect(this.$container.find('tbody tr:eq(1) td:eq(0)').html()).toEqual('A1');
      });

      runs(function () {
        hot.resumeObservingChanges();
        data[1][0] = 'another new string';
        afterRenderSpy.reset();
      });

      waitsFor(function () {
        return afterRenderSpy.calls.length > 0;
      }, 'Table render', 1000);


      runs(function () {
        expect(this.$container.find('tbody tr:eq(0) td:eq(0)').html()).toEqual('new string');
        expect(this.$container.find('tbody tr:eq(1) td:eq(0)').html()).toEqual('another new string');
      });
    });
  });

  describe('observeChanges fires appropriate events when changes are detected', function () {
    describe("array data", function () {
      it("should fire afterChangesObserved event after changes has been noticed", function () {
        var data = createSpreadsheetData(2, 2);
        var hot = createHOT(data, true);

        var afterChangesObservedCallback = jasmine.createSpy('afterChangesObservedCallback');
        hot.addHook('afterChangesObserved', afterChangesObservedCallback);

        data[0][0] = 'new string';

        waitsFor(function () {
          return afterChangesObservedCallback.calls.length > 0;
        }, 'afterChangesObserved event fire', 1000);


        runs(function () {
          expect(afterChangesObservedCallback.calls.length).toEqual(1);
        });
      });

      it("should fire afterCreateRow event after detecting that new row has been added", function () {
        var data = createSpreadsheetData(2, 2);
        var hot = createHOT(data, true);

        var afterCreateRowCallback = jasmine.createSpy('afterCreateRowCallback');
        hot.addHook('afterCreateRow', afterCreateRowCallback);

        data.push(['A2', 'B2']);

        waitsFor(function () {
          return afterCreateRowCallback.calls.length > 0;
        }, 'afterCreateRow event fire', 1000);


        runs(function () {
          expect(afterCreateRowCallback.calls.length).toEqual(1);
          expect(afterCreateRowCallback).toHaveBeenCalledWith(2, undefined, undefined, undefined, undefined);
        });
      });

      it("should fire afterRemoveRow event after detecting that row has been removed", function () {
        var data = createSpreadsheetData(2, 2);
        var hot = createHOT(data, true);

        var afterRemoveRowCallback = jasmine.createSpy('afterRemoveRowCallback');
        hot.addHook('afterRemoveRow', afterRemoveRowCallback);

        data.pop();

        waitsFor(function () {
          return afterRemoveRowCallback.calls.length > 0;
        }, 'afterCreateRow event fire', 1000);


        runs(function () {
          expect(afterRemoveRowCallback.calls.length).toEqual(1);
          expect(afterRemoveRowCallback).toHaveBeenCalledWith(1, 1, undefined, undefined, undefined);
        });
      });

      it("should fire afterRemoveRow event after detecting that multiple rows have been removed", function () {
        var data = createSpreadsheetData(2, 2);
        var hot = createHOT(data, true);

        var afterRemoveRowCallback = jasmine.createSpy('afterRemoveRowCallback');
        hot.addHook('afterRemoveRow', afterRemoveRowCallback);

        data.splice(0, 2);

        waitsFor(function () {
          return afterRemoveRowCallback.calls.length > 0;
        }, 'afterRemoveRow event fire', 1000);


        runs(function () {
          expect(afterRemoveRowCallback.calls.length).toEqual(2);

          //The order of run hooks depends on whether objectObserve uses native Object.observe or a shim
          var args = [];
          args.push(afterRemoveRowCallback.calls[0].args);
          args.push(afterRemoveRowCallback.calls[1].args);
          expect(args).toContain([1, 1, undefined, undefined, undefined]);
          expect(args).toContain([0, 1, undefined, undefined, undefined]);
        });
      });

      it("should fire afterCreateCol event after detecting that new col has been added", function () {
        var data = createSpreadsheetData(2, 2);
        var hot = createHOT(data, true);

        var afterCreateColCallback = jasmine.createSpy('afterCreateColCallback');
        hot.addHook('afterCreateCol', afterCreateColCallback);

        data[0].push("C1");
        data[1].push("C2");

        waitsFor(function () {
          return afterCreateColCallback.calls.length > 0;
        }, 'afterCreateCol event fire', 1000);


        runs(function () {
          expect(afterCreateColCallback.calls.length).toEqual(1);
          expect(afterCreateColCallback.calls[0].args).toEqual([2, undefined, undefined, undefined, undefined]);
        });
      });

      it("should fire afterRemoveCol event after detecting that col has been removed", function () {
        var data = createSpreadsheetData(2, 2);
        var hot = createHOT(data, true);

        var afterRemoveColCallback = jasmine.createSpy('afterRemoveColCallback');
        hot.addHook('afterRemoveCol', afterRemoveColCallback);

        data[0].pop();
        data[1].pop();

        waitsFor(function () {
          return afterRemoveColCallback.calls.length > 0;
        }, 'afterRemoveCol event fire', 1000);


        runs(function () {
          expect(afterRemoveColCallback.calls.length).toEqual(1);
          expect(afterRemoveColCallback.calls[0].args).toEqual([1, 1, undefined, undefined, undefined]);
        });
      });

      it("should fire afterRemoveCol event after detecting that multiple cols have been removed", function () {
        var data = createSpreadsheetData(2, 2);
        var hot = createHOT(data, true);

        var afterRemoveColCallback = jasmine.createSpy('afterRemoveColCallback');
        hot.addHook('afterRemoveCol', afterRemoveColCallback);

        data[0].pop();
        data[0].pop();
        data[1].pop();
        data[1].pop();

        waitsFor(function () {
          return afterRemoveColCallback.calls.length > 0;
        }, 'afterRemoveCol event fire', 1000);


        runs(function () {
          expect(afterRemoveColCallback.calls.length).toEqual(2);

          //The order of run hooks depends on whether objectObserve uses native Object.observe or a shim
          var args = [];
          args.push(afterRemoveColCallback.calls[0].args);
          args.push(afterRemoveColCallback.calls[1].args);
          expect(args).toContain([1, 1, undefined, undefined, undefined]);
          expect(args).toContain([0, 1, undefined, undefined, undefined]);
        });
      });

      it("should fire afterChange event after detecting that table data has changed", function () {
        var data = createSpreadsheetData(2, 2);
        var hot = createHOT(data, true);

        var afterChangeCallback = jasmine.createSpy('afterChangeCallback');
        hot.addHook('afterChange', afterChangeCallback);

        data[0][0] = "new string";

        waitsFor(function () {
          return afterChangeCallback.calls.length > 0;
        }, 'afterChange event fire', 1000);


        runs(function () {
          expect(afterChangeCallback.calls.length).toEqual(1);
          expect(afterChangeCallback).toHaveBeenCalledWith([0, 0, null, "new string"], 'external', undefined, undefined, undefined);
        });
      });
    });
    describe("object data", function () {
      it("should fire afterChangesObserved event after changes has been noticed", function () {
        var data = createSpreadsheetObjectData(2, 2);
        var hot = createHOT(data, true);

        var afterChangesObservedCallback = jasmine.createSpy('afterChangesObservedCallback');
        hot.addHook('afterChangesObserved', afterChangesObservedCallback);

        data[0]['prop0'] = 'new string';

        waitsFor(function () {
          return afterChangesObservedCallback.calls.length > 0;
        }, 'afterChangesObserved event fire', 1000);


        runs(function () {
          expect(afterChangesObservedCallback.calls.length).toEqual(1);
        });
      });

      it("should fire afterCreateRow event after detecting that new row has been added", function () {
        var data = createSpreadsheetObjectData(2, 2);
        var hot = createHOT(data, true);

        var afterCreateRowCallback = jasmine.createSpy('afterCreateRowCallback');
        hot.addHook('afterCreateRow', afterCreateRowCallback);

        data.push({prop0: 'A2', prop1: 'B2'});

        waitsFor(function () {
          return afterCreateRowCallback.calls.length > 0;
        }, 'afterCreateRow event fire', 1000);


        runs(function () {
          expect(afterCreateRowCallback.calls.length).toEqual(1);
          expect(afterCreateRowCallback).toHaveBeenCalledWith(2, undefined, undefined, undefined, undefined);
        });
      });

      it("should fire afterRemoveRow event after detecting that row has been removed", function () {
        var data = createSpreadsheetObjectData(2, 2);
        var hot = createHOT(data, true);

        var afterRemoveRowCallback = jasmine.createSpy('afterRemoveRowCallback');
        hot.addHook('afterRemoveRow', afterRemoveRowCallback);

        data.pop();

        waitsFor(function () {
          return afterRemoveRowCallback.calls.length > 0;
        }, 'afterCreateRow event fire', 1000);


        runs(function () {
          expect(afterRemoveRowCallback.calls.length).toEqual(1);
          expect(afterRemoveRowCallback).toHaveBeenCalledWith(1, 1, undefined, undefined, undefined);
        });
      });

      it("should fire afterRemoveRow event after detecting that multiple rows have been removed", function () {
        var data = createSpreadsheetObjectData(2, 2);
        var hot = createHOT(data, true);

        var afterRemoveRowCallback = jasmine.createSpy('afterRemoveRowCallback');
        hot.addHook('afterRemoveRow', afterRemoveRowCallback);

        data.splice(0, 2);

        waitsFor(function () {
          return afterRemoveRowCallback.calls.length > 0;
        }, 'afterRemoveRow event fire', 1000);


        runs(function () {
          expect(afterRemoveRowCallback.calls.length).toEqual(2);

          //The order of run hooks depends on whether objectObserve uses native Object.observe or a shim
          var args = [];
          args.push(afterRemoveRowCallback.calls[0].args);
          args.push(afterRemoveRowCallback.calls[1].args);
          expect(args).toContain([1, 1, undefined, undefined, undefined]);
          expect(args).toContain([0, 1, undefined, undefined, undefined]);
        });
      });

      it("should fire afterChange event after detecting that table data has changed", function () {
        var data = createSpreadsheetObjectData(2, 2);
        var hot = createHOT(data, true);

        var afterChangeCallback = jasmine.createSpy('afterChangeCallback');
        hot.addHook('afterChange', afterChangeCallback);

        data[0]['prop0'] = "new string";

        waitsFor(function () {
          return afterChangeCallback.calls.length > 0;
        }, 'afterChange event fire', 1000);


        runs(function () {
          expect(afterChangeCallback.calls.length).toEqual(1);
          expect(afterChangeCallback).toHaveBeenCalledWith([0, 'prop0', null, "new string"], 'external', undefined, undefined, undefined);
        });
      });
    });
  });

  describe("using HOT data manipulation methods, when observeChanges plugin is enabled", function () {
    describe("array data", function () {
      it("should run render ONCE after detecting that new row has been added", function () {
        var data = createSpreadsheetData(2, 2);
        var hot = createHOT(data, true);

        var afterRenderSpy = jasmine.createSpy('afterRenderSpy');
        hot.addHook('afterRender', afterRenderSpy);

        var afterChangesObservedCallback = jasmine.createSpy('afterChangesObservedCallback');
        hot.addHook('afterChangesObserved', afterChangesObservedCallback);

        alter('insert_row');

        waitsFor(function () {
          return afterChangesObservedCallback.calls.length > 0;
        }, 'afterChangesObserved event fire', 1000);

        runs(function () {
          expect(countRows()).toEqual(3);
          expect(afterRenderSpy.calls.length).toEqual(1);
        });
      });

      it("should run render ONCE after detecting that row has been removed", function () {
        var data = createSpreadsheetData(2, 2);
        var hot = createHOT(data, true);

        var afterRenderSpy = jasmine.createSpy('afterRenderSpy');
        hot.addHook('afterRender', afterRenderSpy);

        var afterChangesObservedCallback = jasmine.createSpy('afterChangesObservedCallback');
        hot.addHook('afterChangesObserved', afterChangesObservedCallback);

        alter('remove_row');

        waitsFor(function () {
          return afterChangesObservedCallback.calls.length > 0;
        }, 'afterChangesObserved event fire', 1000);


        runs(function () {
          expect(countRows()).toEqual(1);
          expect(afterChangesObservedCallback.calls.length).toEqual(1);
          expect(afterRenderSpy.calls.length).toEqual(1);
        });
      });

      it("should run render ONCE after detecting that new column has been added", function () {
        var data = createSpreadsheetData(2, 2);
        var hot = createHOT(data, true);

        var afterRenderSpy = jasmine.createSpy('afterRenderSpy');
        hot.addHook('afterRender', afterRenderSpy);

        var afterChangesObservedCallback = jasmine.createSpy('afterChangesObservedCallback');
        hot.addHook('afterChangesObserved', afterChangesObservedCallback);

        alter('insert_col');

        waitsFor(function () {
          return afterChangesObservedCallback.calls.length > 0;
        }, 'afterChangesObserved event fire', 1000);

        runs(function () {
          expect(countCols()).toEqual(3);
          expect(afterRenderSpy.calls.length).toEqual(1);
        });
      });

      it("should run render ONCE after detecting that column has been removed", function () {
        var data = createSpreadsheetData(2, 2);
        var hot = createHOT(data, true);

        var afterRenderSpy = jasmine.createSpy('afterRenderSpy');
        hot.addHook('afterRender', afterRenderSpy);

        var afterChangesObservedCallback = jasmine.createSpy('afterChangesObservedCallback');
        hot.addHook('afterChangesObserved', afterChangesObservedCallback);

        alter('remove_col');

        waitsFor(function () {
          return afterChangesObservedCallback.calls.length > 0;
        }, 'afterChangesObserved event fire', 1000);


        runs(function () {
          expect(countCols()).toEqual(1);
          expect(afterChangesObservedCallback.calls.length).toEqual(1);
          expect(afterRenderSpy.calls.length).toEqual(1);
        });
      });

      it("should run render ONCE after detecting that table data has changed", function () {
        var data = createSpreadsheetData(2, 2);
        var hot = createHOT(data, true);

        var afterRenderSpy = jasmine.createSpy('afterRenderSpy');
        hot.addHook('afterRender', afterRenderSpy);

        var afterChangesObservedCallback = jasmine.createSpy('afterChangesObservedCallback');
        hot.addHook('afterChangesObserved', afterChangesObservedCallback);

        setDataAtCell(0, 0, 'new value');

        waitsFor(function () {
          return afterChangesObservedCallback.calls.length > 0;
        }, 'afterChangesObserved event fire', 1000);


        runs(function () {
          expect(this.$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('new value');
          expect(afterChangesObservedCallback.calls.length).toEqual(1);
          expect(afterRenderSpy.calls.length).toEqual(1);
        });
      });
    });
    describe("object data", function () {
      it("should run render ONCE after detecting that new row has been added", function () {
        var data = createSpreadsheetObjectData(2, 2);
        var hot = createHOT(data, true);

        var afterRenderSpy = jasmine.createSpy('afterRenderSpy');
        hot.addHook('afterRender', afterRenderSpy);

        var afterChangesObservedCallback = jasmine.createSpy('afterChangesObservedCallback');
        hot.addHook('afterChangesObserved', afterChangesObservedCallback);

        alter('insert_row');

        waitsFor(function () {
          return afterChangesObservedCallback.calls.length > 0;
        }, 'afterChangesObserved event fire', 1000);

        runs(function () {
          expect(countRows()).toEqual(3);
          expect(afterRenderSpy.calls.length).toEqual(1);
        });
      });

      it("should run render ONCE after detecting that row has been removed", function () {
        var data = createSpreadsheetObjectData(2, 2);
        var hot = createHOT(data, true);

        var afterRenderSpy = jasmine.createSpy('afterRenderSpy');
        hot.addHook('afterRender', afterRenderSpy);

        var afterChangesObservedCallback = jasmine.createSpy('afterChangesObservedCallback');
        hot.addHook('afterChangesObserved', afterChangesObservedCallback);

        alter('remove_row');

        waitsFor(function () {
          return afterChangesObservedCallback.calls.length > 0;
        }, 'afterChangesObserved event fire', 1000);


        runs(function () {
          expect(countRows()).toEqual(1);
          expect(afterChangesObservedCallback.calls.length).toEqual(1);
          expect(afterRenderSpy.calls.length).toEqual(1);
        });
      });

      it("should run render ONCE after detecting that table data has changed", function () {
        var data = createSpreadsheetObjectData(2, 2);
        var hot = createHOT(data, true);

        var afterRenderSpy = jasmine.createSpy('afterRenderSpy');
        hot.addHook('afterRender', afterRenderSpy);

        var afterChangesObservedCallback = jasmine.createSpy('afterChangesObservedCallback');
        hot.addHook('afterChangesObserved', afterChangesObservedCallback);

        setDataAtRowProp(0, 'prop0', 'new value');

        waitsFor(function () {
          return afterChangesObservedCallback.calls.length > 0;
        }, 'afterChangesObserved event fire', 1000);


        runs(function () {
          expect(this.$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('new value');
          expect(afterChangesObservedCallback.calls.length).toEqual(1);
          expect(afterRenderSpy.calls.length).toEqual(1);
        });
      });
    });
  });
});