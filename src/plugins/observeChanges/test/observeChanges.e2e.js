describe('HandsontableObserveChanges', () => {
  const id = 'testContainer';

  beforeEach(function() {
    this.$container = $(`<div id="${id}"></div>`).appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  function createHOT(data, observeChanges) {
    return handsontable({
      data,
      width: 200,
      height: 200,
      observeChanges
    });
  }

  describe('refreshing table after changes have been detected', () => {
    describe('array data', () => {
      it('should render newly added row', (done) => {
        const data = Handsontable.helper.createSpreadsheetData(2, 2);
        createHOT(data, true);

        data.push(['A3', 'B3']);

        const htCore = getHtCore();

        setTimeout(() => {
          expect(htCore.find('tr').length).toEqual(3);
          expect(htCore.find('col').length).toEqual(2);
          done();
        }, 200);
      });

      it('should render newly added column', (done) => {
        const data = Handsontable.helper.createSpreadsheetData(2, 2);
        createHOT(data, true);
        const htCore = getHtCore();

        data[0].push('C1');
        data[1].push('C2');

        setTimeout(() => {
          expect(htCore.find('tr').length).toEqual(2);
          expect(htCore.find('col').length).toEqual(3);
          done();
        }, 200);
      });

      it('should render removed row', (done) => {
        const data = Handsontable.helper.createSpreadsheetData(2, 2);
        createHOT(data, true);
        const htCore = getHtCore();

        data.splice(0, 1); // removes one row at index 0

        setTimeout(() => {
          expect(htCore.find('tr').length).toEqual(1);
          expect(htCore.find('col').length).toEqual(2);
          done();
        }, 200);
      });

      it('should render removed column', (done) => {
        const data = Handsontable.helper.createSpreadsheetData(2, 2);
        createHOT(data, true);
        const htCore = getHtCore();

        data[0].splice(0, 1); // removes one column at index 0 in first row
        data[1].splice(0, 1); // removes one column at index 0 in second row

        setTimeout(() => {
          expect(htCore.find('tr').length).toEqual(2);
          expect(htCore.find('col').length).toEqual(1);
          done();
        }, 200);
      });

      it('should render cell change from string to string', (done) => {
        const data = Handsontable.helper.createSpreadsheetData(2, 2);
        createHOT(data, true);
        const htCore = getHtCore();

        data[0][0] = 'new string';

        setTimeout(() => {
          expect(htCore.find('td:eq(0)').html()).toEqual('new string');
          done();
        }, 200);
      });

      it('should render cell change in a new row', (done) => {
        const data = Handsontable.helper.createSpreadsheetData(2, 2);
        createHOT(data, true);
        const htCore = getHtCore();

        data.push(['A3', 'B3']);

        setTimeout(() => {
          expect(htCore.find('tr:eq(2) td:eq(0)').html()).toEqual('A3');
          data[2][0] = 'new string';
        }, 200);

        setTimeout(() => {
          expect(htCore.find('tr:eq(2) td:eq(0)').html()).toEqual('new string');
          done();
        }, 1200);
      });

      it('should not render cell change when turned off (`observeChanges: false`)', (done) => {
        const data = Handsontable.helper.createSpreadsheetData(2, 2);
        createHOT(data, false);
        const htCore = getHtCore();

        data[0][0] = 'new string';

        setTimeout(() => {
          expect(htCore.find('td:eq(0)').html()).toEqual('A1');
          done();
        }, 100);
      });
    });
    describe('object data', () => {
      it('should render newly added row', (done) => {
        const data = Handsontable.helper.createSpreadsheetObjectData(2, 2);
        createHOT(data, true);
        const htCore = getHtCore();

        data.push({ prop0: 'A3', prop1: 'B3' });

        setTimeout(() => {
          expect(htCore.find('tr').length).toEqual(3);
          expect(htCore.find('col').length).toEqual(2);
          done();
        }, 200);
      });

      it('should render removed row', (done) => {
        const data = Handsontable.helper.createSpreadsheetObjectData(2, 2);
        createHOT(data, true);
        const htCore = getHtCore();

        data.splice(0, 1); // removes one row at index 0

        setTimeout(() => {
          expect(htCore.find('tr').length).toEqual(1);
          expect(htCore.find('col').length).toEqual(2);
          done();
        }, 200);
      });

      it('should render cell change from string to string', (done) => {
        const data = Handsontable.helper.createSpreadsheetObjectData(2, 2);
        createHOT(data, true);
        const htCore = getHtCore();

        data[0].prop0 = 'new string';

        setTimeout(() => {
          expect(htCore.find('td:eq(0)').html()).toEqual('new string');
          done();
        }, 200);
      });

      it('should render cell change in a new row', (done) => {
        const data = Handsontable.helper.createSpreadsheetObjectData(2, 2);
        createHOT(data, true);
        const htCore = getHtCore();

        data.push({ prop0: 'A3', prop1: 'B3' });

        setTimeout(() => {
          expect(htCore.find('tr:eq(2) td:eq(0)').html()).toEqual('A3');
          data[2].prop0 = 'new string';
        }, 200);

        setTimeout(() => {
          expect(htCore.find('tr:eq(2) td:eq(0)').html()).toEqual('new string');
          done();
        }, 1200);
      });

      it('should not break with undefined data properties', () => {
        const data = Handsontable.helper.createSpreadsheetObjectData(2, 2);
        data[0].prop0 = undefined;

        expect(() => {
          createHOT(data, true);
          getHtCore();
        }).not.toThrow();
      });

      it('should not render cell change when turned off (`observeChanges: false`)', (done) => {
        const data = Handsontable.helper.createSpreadsheetObjectData(2, 2);
        createHOT(data, false);
        const htCore = getHtCore();

        data[0].prop0 = 'new string';

        setTimeout(() => {
          expect(htCore.find('td:eq(0)').html()).toEqual('A1');
          done();
        }, 200);
      });
    });
  });

  describe('enabling/disabling plugin', () => {
    it('should be possible to enable plugin using updateSettings', (done) => {
      const data = Handsontable.helper.createSpreadsheetData(2, 2);
      createHOT(data, false);
      const htCore = getHtCore();

      data[0][0] = 'new string';

      setTimeout(() => {
        expect(htCore.find('td:eq(0)').html()).toEqual('A1');

        updateSettings({
          observeChanges: true
        });
        data[1][0] = 'another new string';
      }, 200);

      setTimeout(() => {
        expect(htCore.find('tr:eq(1) td:eq(0)').html()).toEqual('another new string');
        done();
      }, 400);
    });

    it('should be possible to disable plugin using updateSettings', (done) => {
      const data = Handsontable.helper.createSpreadsheetData(2, 2);
      const hot = createHOT(data, true);
      const htCore = getHtCore();

      data[0][0] = 'new string';

      setTimeout(() => {
        expect(htCore.find('tbody tr:eq(0) td:eq(0)').html()).toEqual('new string');
        expect(htCore.find('tbody tr:eq(1) td:eq(0)').html()).toEqual('A2');

        updateSettings({
          observeChanges: false
        });

        data[1][0] = 'another new string';
      }, 200);

      setTimeout(() => {
        expect(htCore.find('tbody tr:eq(0) td:eq(0)').html()).toEqual('new string');
        expect(htCore.find('tbody tr:eq(1) td:eq(0)').html()).toEqual('A2');

        hot.render();

        expect(htCore.find('tbody tr:eq(0) td:eq(0)').html()).toEqual('new string');
        expect(htCore.find('tbody tr:eq(1) td:eq(0)').html()).toEqual('another new string');
        done();
      }, 300);
    });

    it('should be possible to pause observing changes without disabling the plugin', (done) => {
      const data = Handsontable.helper.createSpreadsheetData(2, 2);
      const hot = createHOT(data, true);
      const htCore = getHtCore();

      data[0][0] = 'new string';

      setTimeout(() => {
        expect(htCore.find('tbody tr:eq(0) td:eq(0)').html()).toEqual('new string');
        expect(htCore.find('tbody tr:eq(1) td:eq(0)').html()).toEqual('A2');

        hot.pauseObservingChanges();

        data[1][0] = 'another new string';
      }, 200);

      setTimeout(() => {
        expect(htCore.find('tbody tr:eq(0) td:eq(0)').html()).toEqual('new string');
        expect(htCore.find('tbody tr:eq(1) td:eq(0)').html()).toEqual('A2');

        hot.render();

        expect(htCore.find('tbody tr:eq(0) td:eq(0)').html()).toEqual('new string');
        expect(htCore.find('tbody tr:eq(1) td:eq(0)').html()).toEqual('another new string');
        done();
      }, 300);
    });

    it('should be possible to resume observing changes after it was paused', (done) => {
      const data = Handsontable.helper.createSpreadsheetData(2, 2);
      const hot = createHOT(data, true);
      const htCore = getHtCore();

      hot.pauseObservingChanges();

      data[0][0] = 'new string';

      setTimeout(() => {
        expect(htCore.find('tbody tr:eq(0) td:eq(0)').html()).toEqual('A1');
        expect(htCore.find('tbody tr:eq(1) td:eq(0)').html()).toEqual('A2');

        hot.resumeObservingChanges();
        data[1][0] = 'another new string';
      }, 100);

      setTimeout(() => {
        expect(htCore.find('tbody tr:eq(0) td:eq(0)').html()).toEqual('new string');
        expect(htCore.find('tbody tr:eq(1) td:eq(0)').html()).toEqual('another new string');
        done();
      }, 1200);
    });
  });

  describe('observeChanges fires appropriate events when changes are detected', () => {
    describe('array data', () => {
      it('should fire afterChangesObserved event after changes has been noticed', (done) => {
        const data = Handsontable.helper.createSpreadsheetData(2, 2);
        const hot = createHOT(data, true);

        const afterChangesObservedCallback = jasmine.createSpy('afterChangesObservedCallback');
        hot.addHook('afterChangesObserved', afterChangesObservedCallback);

        data[0][0] = 'new string';

        setTimeout(() => {
          expect(afterChangesObservedCallback.calls.count()).toEqual(1);
          done();
        }, 200);
      });

      it('should fire afterCreateRow event after detecting that new row has been added', (done) => {
        const data = Handsontable.helper.createSpreadsheetData(2, 2);
        const hot = createHOT(data, true);

        const afterCreateRowCallback = jasmine.createSpy('afterCreateRowCallback');
        hot.addHook('afterCreateRow', afterCreateRowCallback);

        data.push(['A2', 'B2']);

        setTimeout(() => {
          expect(afterCreateRowCallback.calls.count()).toEqual(1);
          expect(afterCreateRowCallback).toHaveBeenCalledWith(2, 1, 'ObserveChanges.change', undefined, undefined, undefined);
          done();
        }, 200);
      });

      it('should fire afterRemoveRow event after detecting that row has been removed', (done) => {
        const data = Handsontable.helper.createSpreadsheetData(2, 2);
        const hot = createHOT(data, true);

        const afterRemoveRowCallback = jasmine.createSpy('afterRemoveRowCallback');
        hot.addHook('afterRemoveRow', afterRemoveRowCallback);

        data.pop();

        setTimeout(() => {
          expect(afterRemoveRowCallback.calls.count()).toEqual(1);
          expect(afterRemoveRowCallback).toHaveBeenCalledWith(1, 1, 'ObserveChanges.change', undefined, undefined, undefined);
          done();
        }, 200);
      });

      it('should fire afterRemoveRow event after detecting that multiple rows have been removed', (done) => {
        const data = Handsontable.helper.createSpreadsheetData(2, 2);
        const hot = createHOT(data, true);

        const afterRemoveRowCallback = jasmine.createSpy('afterRemoveRowCallback');
        hot.addHook('afterRemoveRow', afterRemoveRowCallback);

        data.splice(0, 2);

        setTimeout(() => {
          expect(afterRemoveRowCallback.calls.count()).toEqual(2);

          // The order of run hooks depends on whether objectObserve uses native Object.observe or a shim
          const args = [];
          args.push(afterRemoveRowCallback.calls.argsFor(0));
          args.push(afterRemoveRowCallback.calls.argsFor(1));
          expect(args).toContain([1, 1, 'ObserveChanges.change', undefined, undefined, undefined]);
          expect(args).toContain([0, 1, 'ObserveChanges.change', undefined, undefined, undefined]);
          done();
        }, 200);
      });

      it('should fire afterCreateCol event after detecting that new col has been added', (done) => {
        const data = Handsontable.helper.createSpreadsheetData(2, 2);
        const hot = createHOT(data, true);

        const afterCreateColCallback = jasmine.createSpy('afterCreateColCallback');
        hot.addHook('afterCreateCol', afterCreateColCallback);

        data[0].push('C1');
        data[1].push('C2');

        setTimeout(() => {
          expect(afterCreateColCallback.calls.count()).toEqual(1);
          expect(afterCreateColCallback.calls.argsFor(0)).toEqual([2, 1, 'ObserveChanges.change', undefined, undefined, undefined]);
          done();
        }, 200);
      });

      it('should fire afterRemoveCol event after detecting that col has been removed', (done) => {
        const data = Handsontable.helper.createSpreadsheetData(2, 2);
        const hot = createHOT(data, true);

        const afterRemoveColCallback = jasmine.createSpy('afterRemoveColCallback');
        hot.addHook('afterRemoveCol', afterRemoveColCallback);

        data[0].pop();
        data[1].pop();

        setTimeout(() => {
          expect(afterRemoveColCallback.calls.count()).toEqual(1);
          expect(afterRemoveColCallback.calls.argsFor(0)).toEqual([1, 1, 'ObserveChanges.change', undefined, undefined, undefined]);
          done();
        }, 200);
      });

      it('should fire afterRemoveCol event after detecting that multiple cols have been removed', (done) => {
        const data = Handsontable.helper.createSpreadsheetData(2, 2);
        const hot = createHOT(data, true);

        const afterRemoveColCallback = jasmine.createSpy('afterRemoveColCallback');
        hot.addHook('afterRemoveCol', afterRemoveColCallback);

        data[0].pop();
        data[0].pop();
        data[1].pop();
        data[1].pop();

        setTimeout(() => {
          expect(afterRemoveColCallback.calls.count()).toEqual(2);

          // The order of run hooks depends on whether objectObserve uses native Object.observe or a shim
          const args = [];
          args.push(afterRemoveColCallback.calls.argsFor(0));
          args.push(afterRemoveColCallback.calls.argsFor(1));
          expect(args).toContain([1, 1, 'ObserveChanges.change', undefined, undefined, undefined]);
          expect(args).toContain([0, 1, 'ObserveChanges.change', undefined, undefined, undefined]);
          done();
        }, 200);
      });

      it('should fire afterChange event after detecting that table data has changed', async() => {
        const data = Handsontable.helper.createSpreadsheetData(2, 2);
        const hot = createHOT(data, true);

        const afterChangeCallback = jasmine.createSpy('afterChangeCallback');
        hot.addHook('afterChange', afterChangeCallback);

        data[0][0] = 'new string';

        await sleep(300);

        expect(afterChangeCallback.calls.count()).toEqual(1);
        expect(afterChangeCallback).toHaveBeenCalledWith([[0, 0, null, 'new string']], 'ObserveChanges.change', undefined, undefined, undefined, undefined);
      });
    });
    describe('object data', () => {
      it('should fire afterChangesObserved event after changes has been noticed', (done) => {
        const data = Handsontable.helper.createSpreadsheetObjectData(2, 2);
        const hot = createHOT(data, true);

        const afterChangesObservedCallback = jasmine.createSpy('afterChangesObservedCallback');
        hot.addHook('afterChangesObserved', afterChangesObservedCallback);

        data[0].prop0 = 'new string';

        setTimeout(() => {
          expect(afterChangesObservedCallback.calls.count()).toEqual(1);
          done();
        }, 200);
      });

      it('should fire afterCreateRow event after detecting that new row has been added', (done) => {
        const data = Handsontable.helper.createSpreadsheetObjectData(2, 2);
        const hot = createHOT(data, true);

        const afterCreateRowCallback = jasmine.createSpy('afterCreateRowCallback');
        hot.addHook('afterCreateRow', afterCreateRowCallback);

        data.push({ prop0: 'A2', prop1: 'B2' });

        setTimeout(() => {
          expect(afterCreateRowCallback.calls.count()).toEqual(1);
          expect(afterCreateRowCallback).toHaveBeenCalledWith(2, 1, 'ObserveChanges.change', undefined, undefined, undefined);
          done();
        }, 200);
      });

      it('should fire afterRemoveRow event after detecting that row has been removed', (done) => {
        const data = Handsontable.helper.createSpreadsheetObjectData(2, 2);
        const hot = createHOT(data, true);

        const afterRemoveRowCallback = jasmine.createSpy('afterRemoveRowCallback');
        hot.addHook('afterRemoveRow', afterRemoveRowCallback);

        data.pop();

        setTimeout(() => {
          expect(afterRemoveRowCallback.calls.count()).toEqual(1);
          expect(afterRemoveRowCallback).toHaveBeenCalledWith(1, 1, 'ObserveChanges.change', undefined, undefined, undefined);
          done();
        }, 200);
      });

      it('should fire afterRemoveRow event after detecting that multiple rows have been removed', (done) => {
        const data = Handsontable.helper.createSpreadsheetObjectData(2, 2);
        const hot = createHOT(data, true);

        const afterRemoveRowCallback = jasmine.createSpy('afterRemoveRowCallback');
        hot.addHook('afterRemoveRow', afterRemoveRowCallback);

        data.splice(0, 2);

        setTimeout(() => {
          expect(afterRemoveRowCallback.calls.count()).toEqual(2);

          // The order of run hooks depends on whether objectObserve uses native Object.observe or a shim
          const args = [];
          args.push(afterRemoveRowCallback.calls.argsFor(0));
          args.push(afterRemoveRowCallback.calls.argsFor(1));
          expect(args).toContain([1, 1, 'ObserveChanges.change', undefined, undefined, undefined]);
          expect(args).toContain([0, 1, 'ObserveChanges.change', undefined, undefined, undefined]);
          done();
        }, 200);
      });

      it('should fire afterChange event after detecting that table data has changed', async() => {
        const data = Handsontable.helper.createSpreadsheetObjectData(2, 2);
        const hot = createHOT(data, true);

        const afterChangeCallback = jasmine.createSpy('afterChangeCallback');
        hot.addHook('afterChange', afterChangeCallback);

        data[0].prop0 = 'new string';

        await sleep(300);

        expect(afterChangeCallback.calls.count()).toEqual(1);
        expect(afterChangeCallback).toHaveBeenCalledWith([[0, 'prop0', null, 'new string']], 'ObserveChanges.change', undefined, undefined, undefined, undefined);
      });
    });
  });

  describe('using HOT data manipulation methods, when observeChanges plugin is enabled', () => {
    describe('array data', () => {
      it('should run render ONCE after detecting that new row has been added', (done) => {
        const data = Handsontable.helper.createSpreadsheetData(2, 2);
        const hot = createHOT(data, true);

        const afterRenderSpy = jasmine.createSpy('afterRenderSpy');
        hot.addHook('afterRender', afterRenderSpy);

        alter('insert_row');

        setTimeout(() => {
          expect(countRows()).toEqual(3);
          expect(afterRenderSpy.calls.count()).toEqual(1);
          done();
        }, 200);
      });

      it('should run render ONCE after detecting that row has been removed', (done) => {
        const data = Handsontable.helper.createSpreadsheetData(2, 2);
        const hot = createHOT(data, true);

        const afterRenderSpy = jasmine.createSpy('afterRenderSpy');
        hot.addHook('afterRender', afterRenderSpy);

        const afterChangesObservedCallback = jasmine.createSpy('afterChangesObservedCallback');
        hot.addHook('afterChangesObserved', afterChangesObservedCallback);

        alter('remove_row');

        setTimeout(() => {
          expect(countRows()).toEqual(1);
          expect(afterChangesObservedCallback.calls.count()).toEqual(1);
          expect(afterRenderSpy.calls.count()).toEqual(1);
          done();
        }, 200);
      });

      it('should run render ONCE after detecting that new column has been added', (done) => {
        const data = Handsontable.helper.createSpreadsheetData(2, 2);
        const hot = createHOT(data, true);

        const afterRenderSpy = jasmine.createSpy('afterRenderSpy');
        hot.addHook('afterRender', afterRenderSpy);

        alter('insert_col');

        setTimeout(() => {
          expect(countCols()).toEqual(3);
          expect(afterRenderSpy.calls.count()).toEqual(1);
          done();
        }, 200);
      });

      it('should run render ONCE after detecting that column has been removed', (done) => {
        const data = Handsontable.helper.createSpreadsheetData(2, 2);
        const hot = createHOT(data, true);

        const afterRenderSpy = jasmine.createSpy('afterRenderSpy');
        hot.addHook('afterRender', afterRenderSpy);

        const afterChangesObservedCallback = jasmine.createSpy('afterChangesObservedCallback');
        hot.addHook('afterChangesObserved', afterChangesObservedCallback);

        alter('remove_col');

        setTimeout(() => {
          expect(countCols()).toEqual(1);
          expect(afterChangesObservedCallback.calls.count()).toEqual(1);
          expect(afterRenderSpy.calls.count()).toEqual(1);
          done();
        }, 200);
      });

      it('should run render ONCE after detecting that table data has changed', (done) => {
        const data = Handsontable.helper.createSpreadsheetData(2, 2);
        const hot = createHOT(data, true);
        const htCore = getHtCore();

        const afterRenderSpy = jasmine.createSpy('afterRenderSpy');
        hot.addHook('afterRender', afterRenderSpy);

        const afterChangesObservedCallback = jasmine.createSpy('afterChangesObservedCallback');
        hot.addHook('afterChangesObserved', afterChangesObservedCallback);

        setDataAtCell(0, 0, 'new value');

        setTimeout(() => {
          expect(htCore.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('new value');
          expect(afterChangesObservedCallback.calls.count()).toEqual(1);
          expect(afterRenderSpy.calls.count()).toEqual(1);
          done();
        }, 200);
      });
    });
    describe('object data', () => {
      it('should run render ONCE after detecting that new row has been added', (done) => {
        const data = Handsontable.helper.createSpreadsheetObjectData(2, 2);
        const hot = createHOT(data, true);

        const afterRenderSpy = jasmine.createSpy('afterRenderSpy');
        hot.addHook('afterRender', afterRenderSpy);

        alter('insert_row');

        setTimeout(() => {
          expect(countRows()).toEqual(3);
          expect(afterRenderSpy.calls.count()).toEqual(1);
          done();
        }, 200);
      });

      it('should run render ONCE after detecting that row has been removed', (done) => {
        const data = Handsontable.helper.createSpreadsheetObjectData(2, 2);
        const hot = createHOT(data, true);

        const afterRenderSpy = jasmine.createSpy('afterRenderSpy');
        hot.addHook('afterRender', afterRenderSpy);

        const afterChangesObservedCallback = jasmine.createSpy('afterChangesObservedCallback');
        hot.addHook('afterChangesObserved', afterChangesObservedCallback);

        alter('remove_row');

        setTimeout(() => {
          expect(countRows()).toEqual(1);
          expect(afterChangesObservedCallback.calls.count()).toEqual(1);
          expect(afterRenderSpy.calls.count()).toEqual(1);
          done();
        }, 200);
      });

      it('should run render ONCE after detecting that table data has changed', (done) => {
        const data = Handsontable.helper.createSpreadsheetObjectData(2, 2);
        const hot = createHOT(data, true);

        const afterRenderSpy = jasmine.createSpy('afterRenderSpy');
        hot.addHook('afterRender', afterRenderSpy);

        const afterChangesObservedCallback = jasmine.createSpy('afterChangesObservedCallback');
        hot.addHook('afterChangesObserved', afterChangesObservedCallback);

        setDataAtRowProp(0, 'prop0', 'new value');

        setTimeout(() => {
          expect(spec().$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('new value');
          expect(afterChangesObservedCallback.calls.count()).toEqual(1);
          expect(afterRenderSpy.calls.count()).toEqual(1);
          done();
        }, 200);
      });
    });
  });

  describe('refreshing table after changes have been detected', () => {
    it('should observe changes to new data bound using loadData', (done) => {
      const data = Handsontable.helper.createSpreadsheetData(2, 2);
      const newData = Handsontable.helper.createSpreadsheetData(2, 2);
      const hot = createHOT(data, true);
      const htCore = getHtCore();
      hot.loadData(newData);

      const afterRenderSpy = jasmine.createSpy('afterRenderSpy');
      hot.addHook('afterRender', afterRenderSpy);

      newData.push(['A3', 'B3']);

      setTimeout(() => {
        expect(afterRenderSpy.calls.count()).toBe(1);
        expect(htCore.find('tr').length).toEqual(3);
        expect(htCore.find('col').length).toEqual(2);
        done();
      }, 200);
    });

    it('should not observe changes to old data after it was replaced using loadData', (done) => {
      const data = Handsontable.helper.createSpreadsheetData(2, 2);
      const newData = Handsontable.helper.createSpreadsheetData(2, 2);
      const hot = createHOT(data, true);
      const htCore = getHtCore();
      hot.loadData(newData);

      const afterRenderSpy = jasmine.createSpy('afterRenderSpy');
      hot.addHook('afterRender', afterRenderSpy);

      data.push(['A3', 'B3']);

      setTimeout(() => {
        expect(afterRenderSpy.calls.count()).toBe(0);
        expect(htCore.find('tr').length).toEqual(2);
        expect(htCore.find('col').length).toEqual(2);
        done();
      }, 1000);
    });
  });
});
