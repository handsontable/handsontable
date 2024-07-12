import HyperFormula, {
  FunctionPlugin
} from 'hyperformula';
import plPL from 'hyperformula/es/i18n/languages/plPL';

describe('Formulas general', () => {
  const debug = false;

  beforeEach(function() {
    this.$container = $('<div id="testContainer"></div>').appendTo('body');
    this.$container2 = $('<div id="testContainer-2"></div>').appendTo('body');
    this.$container3 = $('<div id="testContainer-3"></div>').appendTo('body');
  });

  afterEach(function() {
    if (debug) {
      return;
    }

    if (this.$container) {
      try {
        if (this.$container.handsontable('getInstance')) {
          destroy();
        }
      } catch (e) {
        // In some of the test cases we're manually destroying the Handsontable instances, so 'getInstance' may
        // throw a post-mortem error.
        if (!e.message.includes('instance has been destroyed')) {
          throw e;
        }
      }

      this.$container.remove();
    }

    if (this.$container2) {
      try {
        if (this.$container2.handsontable('getInstance')) {
          this.$container2.handsontable('getInstance').destroy();
        }
      } catch (e) {
        // In some of the test cases we're manually destroying the Handsontable instances, so 'getInstance' may
        // throw a post-mortem error.
        if (!e.message.includes('instance has been destroyed')) {
          throw e;
        }
      }
      this.$container2.remove();
    }

    if (this.$container3) {
      try {
        if (this.$container3.handsontable('getInstance')) {
          this.$container3.handsontable('getInstance').destroy();
        }
      } catch (e) {
        // In some of the test cases we're manually destroying the Handsontable instances, so 'getInstance' may
        // throw a post-mortem error.
        if (!e.message.includes('instance has been destroyed')) {
          throw e;
        }
      }
      this.$container3.remove();
    }
  });

  describe('Single Handsontable setup', () => {
    it('should reset static registry while enabling and disabling the plugin using updateSettings (HF as class)', () => {
      const hot = handsontable({
        data: getDataSimpleExampleFormulas(),
        width: 500,
        height: 300,
        formulas: {
          engine: HyperFormula
        }
      });

      const staticRegister = hot.getPlugin('formulas').staticRegister;
      const hotInstances = staticRegister.getItem('engine_relationship');
      const sharedHotIds = staticRegister.getItem('shared_engine_usage');

      expect(hotInstances.size).toBe(1);
      expect(sharedHotIds.size).toBe(1);

      hot.updateSettings({
        formulas: false
      });

      expect(hotInstances.size).toBe(0);
      expect(sharedHotIds.size).toBe(0);

      hot.updateSettings({
        formulas: {
          engine: HyperFormula
        }
      });

      expect(hotInstances.size).toBe(1);
      expect(sharedHotIds.size).toBe(1);

      hot.updateSettings({
        formulas: false
      });

      expect(hotInstances.size).toBe(0);
      expect(sharedHotIds.size).toBe(0);
    });

    it('should reset static registry while enabling and disabling the plugin using updateSettings (HF as instance)', () => {
      const hfInstance = HyperFormula.buildEmpty({ licenseKey: 'internal-use-in-handsontable' });
      const hot = handsontable({
        data: getDataSimpleExampleFormulas(),
        width: 500,
        height: 300,
        formulas: {
          engine: hfInstance
        }
      });

      const staticRegister = hot.getPlugin('formulas').staticRegister;
      const hotInstances = staticRegister.getItem('engine_relationship');
      const sharedHotIds = staticRegister.getItem('shared_engine_usage');

      expect(hotInstances.size).toBe(1);
      expect(sharedHotIds.size).toBe(0);

      hot.updateSettings({
        formulas: false
      });

      expect(hotInstances.size).toBe(0);
      expect(sharedHotIds.size).toBe(0);

      hot.updateSettings({
        formulas: {
          engine: hfInstance
        }
      });

      expect(hotInstances.size).toBe(1);
      expect(sharedHotIds.size).toBe(0);

      hot.updateSettings({
        formulas: false
      });

      expect(hotInstances.size).toBe(0);
      expect(sharedHotIds.size).toBe(0);
    });

    it('should throw a warning, when no `hyperformula` key was passed to the `formulas` settings', () => {
      spyOn(console, 'warn');

      const hot = handsontable({
        data: getDataSimpleExampleFormulas(),
        formulas: true,
      });

      // eslint-disable-next-line no-console
      expect(console.warn).toHaveBeenCalledWith('Missing the required `engine` key in the Formulas settings. ' +
        'Please fill it with either an engine class or an engine instance.');
      expect(hot.getPlugin('formulas').enabled).toBe(false);
    });

    it('should initialize a single working Handsontable instance and a single HyperFormula instance, when HF class' +
      ' was passed to the `formulas` settings', () => {
      const hot = handsontable({
        data: getDataSimpleExampleFormulas(),
        formulas: {
          engine: HyperFormula
        },
      });
      const staticRegister = hot.getPlugin('formulas').staticRegister;
      const hotInstances = staticRegister.getItem('engine_relationship');
      const sharedHotIds = staticRegister.getItem('shared_engine_usage');
      const relatedHotInstanceEntry = hotInstances.get(hot.getPlugin('formulas').engine);
      const sharedHotIdsEntry = sharedHotIds.get(hot.getPlugin('formulas').engine);

      expect(getDataAtCell(4, 1)).toBe(8042);
      expect(hotInstances.size).toBe(1);
      expect(sharedHotIds.size).toBe(1);
      expect(relatedHotInstanceEntry.length).toBe(1);
      expect(relatedHotInstanceEntry[0]).toBe(hot);
      expect(sharedHotIdsEntry.length).toBe(1);
      expect(sharedHotIdsEntry[0]).toBe(hot.guid);
    });

    it('should initialize a single working Handsontable instance, when an external HyperFormula instance was passed' +
      ' to the `formulas` settings', () => {
      const hfInstance = HyperFormula.buildEmpty({ licenseKey: 'internal-use-in-handsontable' });
      const hot = handsontable({
        data: getDataSimpleExampleFormulas(),
        formulas: {
          engine: hfInstance
        },
      });

      const staticRegister = hot.getPlugin('formulas').staticRegister;
      const hotInstances = staticRegister.getItem('engine_relationship');
      const sharedHotIds = staticRegister.getItem('shared_engine_usage');
      const relatedHotInstanceEntry = hotInstances.get(hot.getPlugin('formulas').engine);
      const sharedHotIdsEntry = sharedHotIds ?
        sharedHotIds.get(hot.getPlugin('formulas').engine) :
        undefined;
      // The registry (for the related HF instance) can be empty or undefined, depending on the context:
      // - if it's the first HOT instance on the page, it will be undefined (no registry will be ever created, because
      //   there's no need for it
      // - if it's not the first HOT instance (which will be usually the case with the test cases), the registry can be
      //   already created, but there should be no entry for the provided HyperFormula instance.
      const noEntryInRegistry = sharedHotIds === undefined || sharedHotIdsEntry === undefined;

      expect(getDataAtCell(4, 1)).toBe(8042);
      expect(noEntryInRegistry).toBe(true);
      expect(hotInstances.size).toBe(1);
      expect(relatedHotInstanceEntry.length).toBe(1);
      expect(relatedHotInstanceEntry[0]).toBe(hot);
    });
  });

  describe('Multiple Handsontable setup', () => {
    it('should reset static registry while enabling and disabling the plugin using updateSettings (HF as class)', () => {
      const hot1 = handsontable({
        data: getDataSimpleExampleFormulas(),
        formulas: {
          engine: HyperFormula
        },
      });

      const hot2 = spec().$container2.handsontable({
        data: getDataSimpleExampleFormulas(),
        formulas: {
          engine: HyperFormula
        },
      }).data('handsontable');

      const formulasPlugin1 = hot1.getPlugin('formulas');
      const staticRegister = formulasPlugin1.staticRegister;
      const hotInstances = staticRegister.getItem('engine_relationship');
      const sharedHotIds = staticRegister.getItem('shared_engine_usage');

      expect(hotInstances.size).toBe(2);
      expect(sharedHotIds.size).toBe(2);

      hot1.updateSettings({
        formulas: false
      });
      hot2.updateSettings({
        formulas: false
      });

      expect(hotInstances.size).toBe(0);
      expect(sharedHotIds.size).toBe(0);

      hot1.updateSettings({
        formulas: {
          engine: HyperFormula
        }
      });
      hot2.updateSettings({
        formulas: {
          engine: HyperFormula
        }
      });

      expect(hotInstances.size).toBe(2);
      expect(sharedHotIds.size).toBe(2);

      hot2.updateSettings({
        formulas: false
      });

      expect(hotInstances.size).toBe(1);
      expect(sharedHotIds.size).toBe(1);
    });

    it('should reset static registry while enabling and disabling the plugin using updateSettings (HF as instance)', () => {
      const hfInstance1 = HyperFormula.buildEmpty({ licenseKey: 'internal-use-in-handsontable' });
      const hfInstance2 = HyperFormula.buildEmpty({ licenseKey: 'internal-use-in-handsontable' });
      const hot1 = handsontable({
        data: getDataSimpleExampleFormulas(),
        formulas: {
          engine: hfInstance1
        },
      });

      const hot2 = spec().$container2.handsontable({
        data: getDataSimpleExampleFormulas(),
        formulas: {
          engine: hfInstance2
        },
      }).data('handsontable');

      const formulasPlugin1 = hot1.getPlugin('formulas');
      const staticRegister = formulasPlugin1.staticRegister;
      const hotInstances = staticRegister.getItem('engine_relationship');
      const sharedHotIds = staticRegister.getItem('shared_engine_usage');

      expect(hotInstances.size).toBe(2);
      expect(sharedHotIds.size).toBe(0);

      hot1.updateSettings({
        formulas: false
      });
      hot2.updateSettings({
        formulas: false
      });

      expect(hotInstances.size).toBe(0);
      expect(sharedHotIds.size).toBe(0);

      hot1.updateSettings({
        formulas: {
          engine: hfInstance1
        }
      });
      hot2.updateSettings({
        formulas: {
          engine: hfInstance2
        }
      });

      expect(hotInstances.size).toBe(2);
      expect(sharedHotIds.size).toBe(0);

      hot2.updateSettings({
        formulas: false
      });

      expect(hotInstances.size).toBe(1);
      expect(sharedHotIds.size).toBe(0);
    });

    describe('with separate HF instances', () => {
      it('should create separate HF instances, when multiple HOT instances are initialized with HF classes passed' +
        ' to the `formulas` settings.', () => {
        const hot1 = handsontable({
          data: getDataSimpleExampleFormulas(),
          formulas: {
            engine: HyperFormula
          },
        });

        const hot2 = spec().$container2.handsontable({
          data: getDataSimpleExampleFormulas(),
          formulas: {
            engine: HyperFormula
          },
        }).data('handsontable');

        const formulasPlugin1 = hot1.getPlugin('formulas');
        const formulasPlugin2 = hot2.getPlugin('formulas');
        const staticRegister = formulasPlugin1.staticRegister;
        const hotInstances = staticRegister.getItem('engine_relationship');
        const sharedHotIds = staticRegister.getItem('shared_engine_usage');
        const relatedHotInstanceEntry1 = hotInstances.get(formulasPlugin1.engine);
        const relatedHotInstanceEntry2 = hotInstances.get(formulasPlugin2.engine);
        const sharedHotIdsEntry1 = sharedHotIds.get(formulasPlugin1.engine);
        const sharedHotIdsEntry2 = sharedHotIds.get(formulasPlugin2.engine);

        expect(formulasPlugin1.engine !== formulasPlugin2.engine).withContext('Both of the HOT instances' +
          ' should have separate HF instances.').toBe(true);
        expect(relatedHotInstanceEntry1.length).toBe(1);
        expect(relatedHotInstanceEntry1[0]).toBe(hot1);
        expect(relatedHotInstanceEntry2.length).toBe(1);
        expect(relatedHotInstanceEntry2[0]).toBe(hot2);
        expect(sharedHotIdsEntry1.length).toBe(1);
        expect(sharedHotIdsEntry1[0]).toBe(hot1.guid);
        expect(sharedHotIdsEntry2.length).toBe(1);
        expect(sharedHotIdsEntry2[0]).toBe(hot2.guid);
      });

      it('should create separate HF instances, when multiple HOT instances are initialized with HF external' +
        ' instances' +
        ' passed to the `formulas` settings.', () => {
        const hfInstance1 = HyperFormula.buildEmpty({ licenseKey: 'internal-use-in-handsontable' });
        const hfInstance2 = HyperFormula.buildEmpty({ licenseKey: 'internal-use-in-handsontable' });
        const hot1 = handsontable({
          data: getDataSimpleExampleFormulas(),
          formulas: {
            engine: hfInstance1
          },
        });

        const hot2 = spec().$container2.handsontable({
          data: getDataSimpleExampleFormulas(),
          formulas: {
            engine: hfInstance2
          },
        }).data('handsontable');

        const formulasPlugin1 = hot1.getPlugin('formulas');
        const formulasPlugin2 = hot2.getPlugin('formulas');
        const staticRegister = formulasPlugin1.staticRegister;
        const hotInstances = staticRegister.getItem('engine_relationship');
        const sharedHotIds = staticRegister.getItem('shared_engine_usage');
        const relatedHotInstanceEntry1 = hotInstances.get(formulasPlugin1.engine);
        const relatedHotInstanceEntry2 = hotInstances.get(formulasPlugin2.engine);
        const sharedHotIdsEntry1 = sharedHotIds ? sharedHotIds.get(formulasPlugin1.engine) : undefined;
        const sharedHotIdsEntry2 = sharedHotIds ? sharedHotIds.get(formulasPlugin2.engine) : undefined;

        // The registry (for the related HF instance) can be empty or undefined, depending on the context:
        // - if it's the first HOT instance on the page, it will be undefined (no registry will be ever created,
        // because
        //   there's no need for it
        // - if it's not the first HOT instance (which will be usually the case with the test cases), the registry can
        // be already created, but there should be no entry for the provided HyperFormula instance.
        const noEntryInRegistry1 = sharedHotIds === undefined || sharedHotIdsEntry1 === undefined;
        const noEntryInRegistry2 = sharedHotIds === undefined || sharedHotIdsEntry2 === undefined;

        expect(formulasPlugin1.engine !== formulasPlugin2.engine).withContext('Both of the HOT instances' +
          ' should have separate HF instances.').toBe(true);
        expect(noEntryInRegistry1).withContext('There should be no entry in the global registry for the first HOT' +
          ' instance.').toBe(true);
        expect(noEntryInRegistry2).withContext('There should be no entry in the global registry for the second HOT' +
          ' instance.').toBe(true);
        expect(relatedHotInstanceEntry1.length).toBe(1);
        expect(relatedHotInstanceEntry1[0]).toBe(hot1);
        expect(relatedHotInstanceEntry2.length).toBe(1);
        expect(relatedHotInstanceEntry2[0]).toBe(hot2);
      });

      it('should destroy the HF instance connected to a HOT instance after destroying said HOT instance if it was' +
        ' created using a HF class', () => {
        const hot1 = handsontable({
          data: getDataSimpleExampleFormulas(),
          formulas: {
            engine: HyperFormula
          },
        });

        const hot2 = spec().$container2.handsontable({
          data: getDataSimpleExampleFormulas(),
          formulas: {
            engine: HyperFormula
          },
        }).data('handsontable');

        const formulasPlugin1HF = hot1.getPlugin('formulas').engine;
        const formulasPlugin2HF = hot2.getPlugin('formulas').engine;
        const destroySpy1 = spyOn(formulasPlugin1HF, 'destroy');
        const destroySpy2 = spyOn(formulasPlugin2HF, 'destroy');

        hot2.destroy();

        expect(destroySpy1).not.toHaveBeenCalled();
        expect(destroySpy2).toHaveBeenCalled();
      });

      it('should NOT destroy the HF instance connected to a HOT instance after destroying said HOT instance if it' +
        ' was' +
        ' created using a HF instance', () => {
        const hfInstance1 = HyperFormula.buildEmpty({ licenseKey: 'internal-use-in-handsontable' });
        const hfInstance2 = HyperFormula.buildEmpty({ licenseKey: 'internal-use-in-handsontable' });
        const hot1 = handsontable({
          data: getDataSimpleExampleFormulas(),
          formulas: {
            engine: hfInstance1
          },
        });

        const hot2 = spec().$container2.handsontable({
          data: getDataSimpleExampleFormulas(),
          formulas: {
            engine: hfInstance2
          },
        }).data('handsontable');

        const formulasPlugin1HF = hot1.getPlugin('formulas').engine;
        const formulasPlugin2HF = hot2.getPlugin('formulas').engine;
        const destroySpy1 = spyOn(formulasPlugin1HF, 'destroy');
        const destroySpy2 = spyOn(formulasPlugin2HF, 'destroy');

        hot2.destroy();

        expect(destroySpy1).not.toHaveBeenCalled();
        expect(destroySpy2).not.toHaveBeenCalled();
      });

      it('should render only related sheets when the dependent cells are updated', () => {
        const afterViewRender1 = jasmine.createSpy('afterViewRender1');
        const afterViewRender2 = jasmine.createSpy('afterViewRender2');
        const afterViewRender3 = jasmine.createSpy('afterViewRender3');

        const hot1 = handsontable({
          data: [
            ['Ford', 'Tesla'],
            ['Opel', '=Sheet2!A2'],
          ],
          formulas: {
            engine: HyperFormula,
            sheetName: 'Sheet1'
          },
          afterViewRender: afterViewRender1,
        });

        const hot2 = spec().$container2.handsontable({
          data: [
            ['Ford', 'Tesla'],
            ['Opel', '=Sheet1!B1'],
          ],
          formulas: {
            engine: hot1.getPlugin('formulas').engine,
            sheetName: 'Sheet2'
          },
          afterViewRender: afterViewRender2,
        }).data('handsontable');

        const hot3 = spec().$container3.handsontable({
          data: [
            ['=Sheet1!A2', 'Tesla'],
            ['=Sheet2!A1', '=Sheet2!B2'],
          ],
          formulas: {
            engine: hot1.getPlugin('formulas').engine,
            sheetName: 'Sheet3'
          },
          afterViewRender: afterViewRender3,
        }).data('handsontable');

        expect(afterViewRender1).toHaveBeenCalledTimes(2);
        expect(afterViewRender2).toHaveBeenCalledTimes(1);
        expect(afterViewRender3).toHaveBeenCalledTimes(1);

        afterViewRender1.calls.reset();
        afterViewRender2.calls.reset();
        afterViewRender3.calls.reset();

        hot1.setDataAtCell(0, 0, 'x');

        expect(afterViewRender1).toHaveBeenCalledTimes(1);
        expect(afterViewRender2).toHaveBeenCalledTimes(0);
        expect(afterViewRender3).toHaveBeenCalledTimes(0);

        afterViewRender1.calls.reset();
        afterViewRender2.calls.reset();
        afterViewRender3.calls.reset();

        // All 3 sheets depends on the B1 value
        hot1.setDataAtCell(0, 1, 'x');

        expect(afterViewRender1).toHaveBeenCalledTimes(1);
        expect(afterViewRender2).toHaveBeenCalledTimes(1);
        expect(afterViewRender3).toHaveBeenCalledTimes(1);

        afterViewRender1.calls.reset();
        afterViewRender2.calls.reset();
        afterViewRender3.calls.reset();

        // Only Sheet3 depends on that value
        hot2.setDataAtCell(0, 0, 'x');

        expect(afterViewRender1).toHaveBeenCalledTimes(0);
        expect(afterViewRender2).toHaveBeenCalledTimes(1);
        expect(afterViewRender3).toHaveBeenCalledTimes(1);

        afterViewRender1.calls.reset();
        afterViewRender2.calls.reset();
        afterViewRender3.calls.reset();

        // Only Sheet3 depends on that value
        hot1.setDataAtCell(1, 0, 'x');

        expect(afterViewRender1).toHaveBeenCalledTimes(1);
        expect(afterViewRender2).toHaveBeenCalledTimes(0);
        expect(afterViewRender3).toHaveBeenCalledTimes(1);

        afterViewRender1.calls.reset();
        afterViewRender2.calls.reset();
        afterViewRender3.calls.reset();

        // No dependant sheets
        hot3.setDataAtCell(0, 0, 'x');

        expect(afterViewRender1).toHaveBeenCalledTimes(0);
        expect(afterViewRender2).toHaveBeenCalledTimes(0);
        expect(afterViewRender3).toHaveBeenCalledTimes(1);
      });
    });

    describe('with a shared HF instances', () => {
      it('should create a global, shared HF instance, when one HOT instance is initialized with the HF class, and' +
        ' others are set up with a reference to the first HOT instance', () => {
        const hot1 = handsontable({
          data: getDataSimpleExampleFormulas(),
          formulas: {
            engine: HyperFormula
          },
        });

        const hot2 = spec().$container2.handsontable({
          data: getDataSimpleExampleFormulas(),
          formulas: {
            engine: hot1.getPlugin('formulas').engine
          },
        }).data('handsontable');

        const formulasPlugin1 = hot1.getPlugin('formulas');
        const formulasPlugin2 = hot2.getPlugin('formulas');
        const staticRegister = formulasPlugin1.staticRegister;
        const hotInstances = staticRegister.getItem('engine_relationship');
        const sharedHotIds = staticRegister.getItem('shared_engine_usage');
        const relatedHotInstanceEntry1 = hotInstances.get(formulasPlugin1.engine);
        const relatedHotInstanceEntry2 = hotInstances.get(formulasPlugin2.engine);
        const sharedHotIdsEntry1 = sharedHotIds.get(formulasPlugin1.engine);
        const sharedHotIdsEntry2 = sharedHotIds.get(formulasPlugin2.engine);

        expect(formulasPlugin1.engine).toBe(formulasPlugin2.engine);
        expect(sharedHotIdsEntry1).toBe(sharedHotIdsEntry2);
        expect(sharedHotIdsEntry1.length).toBe(2);
        expect(sharedHotIdsEntry1[0]).toBe(hot1.guid);
        expect(sharedHotIdsEntry1[1]).toBe(hot2.guid);
        expect(relatedHotInstanceEntry1).toBe(relatedHotInstanceEntry2);
        expect(relatedHotInstanceEntry1.length).toBe(2);
        expect(relatedHotInstanceEntry1[0]).toBe(hot1);
        expect(relatedHotInstanceEntry1[1]).toBe(hot2);
      });

      it('should NOT destroy a shared HF instance if only one of the "connected" HOT instances i destroyed, but' +
        ' should remove the HOT instance from the global registry', () => {
        const hot1 = handsontable({
          data: getDataSimpleExampleFormulas(),
          formulas: {
            engine: HyperFormula
          },
        });

        const hot2 = spec().$container2.handsontable({
          data: getDataSimpleExampleFormulas(),
          formulas: {
            engine: hot1.getPlugin('formulas').engine
          },
        }).data('handsontable');

        const formulasPlugin1 = hot1.getPlugin('formulas');
        const staticRegister = formulasPlugin1.staticRegister;
        const hotInstances = staticRegister.getItem('engine_relationship');
        const sharedHotIds = staticRegister.getItem('shared_engine_usage');
        const relatedHotInstanceEntry1 = hotInstances.get(formulasPlugin1.engine);
        const sharedHotIdsEntry1 = sharedHotIds.get(formulasPlugin1.engine);

        hot1.destroy();

        expect(sharedHotIdsEntry1.length).toBe(1);
        expect(sharedHotIdsEntry1[0]).toBe(hot2.guid);
        expect(relatedHotInstanceEntry1.length).toBe(1);
        expect(relatedHotInstanceEntry1[0]).toBe(hot2);
      });

      it('should destroy a shared HF instance only after every "connected" HOT instances is destroyed and remove the' +
        ' HF entry from the global registry', () => {
        const hot1 = handsontable({
          data: getDataSimpleExampleFormulas(),
          formulas: {
            engine: HyperFormula
          },
        });

        const hot2 = spec().$container2.handsontable({
          data: getDataSimpleExampleFormulas(),
          formulas: {
            engine: hot1.getPlugin('formulas').engine
          },
        }).data('handsontable');

        const hotInstances = hot1.getPlugin('formulas').staticRegister.getItem('engine_relationship');
        const sharedHotIds = hot1.getPlugin('formulas').staticRegister.getItem('shared_engine_usage');
        const formulasPlugin1HF = hot1.getPlugin('formulas').engine;
        const destroySpy = spyOn(formulasPlugin1HF, 'destroy');

        hot1.destroy();
        hot2.destroy();

        expect(hotInstances.get(formulasPlugin1HF)).toBeUndefined();
        expect(sharedHotIds.get(formulasPlugin1HF)).toBeUndefined();
        expect(destroySpy).toHaveBeenCalled();
      });
    });
  });

  describe('Sheet creation', () => {
    describe('`data` key present', () => {
      describe('`sheetName` provided', () => {
        it('should overwrite the HF sheet data with the provided `data`, if there\'s an existing sheet with that name' +
          ' in the connected HF instance', () => {
          const hfInstance1 = HyperFormula.buildEmpty({ licenseKey: 'internal-use-in-handsontable' });

          hfInstance1.addSheet('Test Sheet');
          hfInstance1.setSheetContent(hfInstance1.getSheetId('Test Sheet'), [[1, 2, 3], [4, 5, 6]]);

          handsontable({
            data: [['foo']],
            formulas: {
              engine: hfInstance1,
              sheetName: 'Test Sheet'
            },
          });

          const plugin = getPlugin('formulas');

          expect(plugin.sheetName).toEqual('Test Sheet');
          expect(plugin.sheetId).toEqual(hfInstance1.getSheetId('Test Sheet'));
          expect(hfInstance1.getSheetSerialized(hfInstance1.getSheetId('Test Sheet'))).toEqual([['foo']]);
        });

        it('should create (and fill with data) a new HF sheet with an the provided name (and apply the sheet name and' +
          ' sheet id to the plugin), when there\'s a `sheetName` defined in the plugin settings', () => {
          const hfInstance1 = HyperFormula.buildEmpty({ licenseKey: 'internal-use-in-handsontable' });

          handsontable({
            data: [['foo']],
            formulas: {
              engine: hfInstance1,
              sheetName: 'Test Sheet'
            },
          });

          const plugin = getPlugin('formulas');

          expect(plugin.sheetName).toEqual('Test Sheet');
          expect(plugin.sheetId).toEqual(hfInstance1.getSheetId('Test Sheet'));
          expect(hfInstance1.getSheetSerialized(hfInstance1.getSheetId('Test Sheet'))).toEqual([['foo']]);
        });
      });

      describe('`sheetName` not provided', () => {
        it('should create (and fill with data) a new HF sheet with an auto-generated name (and apply the sheet name' +
          ' and sheet id to the plugin), when there\'s no `sheetName` defined in the plugin settings', () => {
          const hfInstance1 = HyperFormula.buildEmpty({ licenseKey: 'internal-use-in-handsontable' });

          handsontable({
            data: [['foo']],
            formulas: {
              engine: hfInstance1
            },
          });

          const plugin = getPlugin('formulas');

          expect(plugin.sheetId).toEqual(hfInstance1.getSheetId(plugin.sheetName));
          expect(hfInstance1.getSheetSerialized(hfInstance1.getSheetId(plugin.sheetName))).toEqual([['foo']]);
        });
      });
    });

    describe('`data` key not present', () => {
      describe('`sheetName` provided', () => {
        it('should create a new empty HF sheet with a provided `sheetName`, if there\' one provided in the plugin' +
          ' settings and no sheet exists in HF with the same name', () => {
          const hfInstance1 = HyperFormula.buildEmpty({ licenseKey: 'internal-use-in-handsontable' });

          handsontable({
            formulas: {
              engine: hfInstance1,
              sheetName: 'Test Sheet'
            },
          });

          const plugin = getPlugin('formulas');

          expect(plugin.sheetName).toEqual('Test Sheet');
          expect(plugin.sheetId).toEqual(hfInstance1.getSheetId('Test Sheet'));
          expect(
            hfInstance1.getSheetDimensions(hfInstance1.getSheetId(plugin.sheetName))
          ).toEqual({
            width: 0,
            height: 0
          });
        });

        it('should switch to an existing HF sheet, if it\'s already created with the same `sheetName` and the sheet' +
          ' name is provided in the settings', () => {
          const hfInstance1 = HyperFormula.buildEmpty({ licenseKey: 'internal-use-in-handsontable' });

          hfInstance1.addSheet('Test Sheet');
          hfInstance1.setSheetContent(hfInstance1.getSheetId('Test Sheet'), [[1, 2, 3], [4, 5, 6]]);

          handsontable({
            formulas: {
              engine: hfInstance1,
              sheetName: 'Test Sheet'
            },
          });

          const plugin = getPlugin('formulas');

          expect(plugin.sheetName).toEqual('Test Sheet');
          expect(plugin.sheetId).toEqual(hfInstance1.getSheetId('Test Sheet'));

          expect(getData()).toEqual([[1, 2, 3], [4, 5, 6]]);
          expect(hfInstance1.getSheetSerialized(hfInstance1.getSheetId('Test Sheet'))).toEqual([[1, 2, 3], [4, 5, 6]]);
        });
      });

      describe('`sheetName` not provided', () => {
        it('should create a new empty HF sheet with an auto-generated name, if `sheetName` is not provided in the' +
          ' plugin settings', () => {
          const hfInstance1 = HyperFormula.buildEmpty({ licenseKey: 'internal-use-in-handsontable' });

          handsontable({
            formulas: {
              engine: hfInstance1
            },
          });

          const plugin = getPlugin('formulas');

          expect(plugin.sheetId).toEqual(hfInstance1.getSheetId(plugin.sheetName));

          expect(getData()).toEqual([
            [null, null, null, null, null],
            [null, null, null, null, null],
            [null, null, null, null, null],
            [null, null, null, null, null],
            [null, null, null, null, null]
          ]);
          expect(hfInstance1.doesSheetExist(plugin.sheetName)).toEqual(true);
          expect(hfInstance1.getSheetSerialized(plugin.sheetId)).toEqual([]);
        });
      });
    });
  });

  describe('Updating HF settings', () => {
    it('should initialize HyperFormula with the default set of settings', () => {
      handsontable({
        formulas: {
          engine: HyperFormula
        },
      });

      const plugin = getPlugin('formulas');
      const hfConfig = plugin.engine.getConfig();

      expect(hfConfig.useColumnIndex).toEqual(false);
      expect(hfConfig.useStats).toEqual(false);
      expect(hfConfig.evaluateNullToZero).toEqual(true);
      expect(hfConfig.precisionEpsilon).toEqual(1e-13);
      expect(hfConfig.precisionRounding).toEqual(14);
      expect(hfConfig.smartRounding).toEqual(true);
      expect(hfConfig.leapYear1900).toEqual(false);
    });

    it('should NOT update the HyperFormula config with the default set of settings', () => {
      const hfInstance1 = HyperFormula.buildEmpty({ licenseKey: 'internal-use-in-handsontable' });

      hfInstance1.updateConfig({
        undoLimit: 11,
        useColumnIndex: true,
        useStats: true,
      });

      handsontable({
        formulas: {
          engine: hfInstance1
        },
      });

      const plugin = getPlugin('formulas');
      const hfConfig = plugin.engine.getConfig();

      expect(hfConfig.undoLimit).toEqual(11);
      expect(hfConfig.useColumnIndex).toEqual(true);
      expect(hfConfig.useStats).toEqual(true);
    });

    it('should update the HyperFormula configuration with the options defined in `formulas.engine`', () => {
      handsontable({
        formulas: {
          engine: {
            hyperformula: HyperFormula,
            undoLimit: 11,
            useColumnIndex: true,
            useStats: true,
          }
        },
      });

      const plugin = getPlugin('formulas');
      const hfConfig = plugin.engine.getConfig();

      expect(hfConfig.undoLimit).toEqual(11);
      expect(hfConfig.useColumnIndex).toEqual(true);
      expect(hfConfig.useStats).toEqual(true);
    });

    it('should update the external HyperFormula instance config with the Handsontable/HF licenseKey, if none was' +
      ' provided', () => {
      const hfInstance1 = HyperFormula.buildEmpty();

      handsontable({
        formulas: {
          engine: hfInstance1
        },
      });

      expect(hfInstance1.getConfig().licenseKey).toEqual('internal-use-in-handsontable');
    });

    it('should NOT update the external HyperFormula instance config with the Handsontable/HF licenseKey, if it was' +
      ' provided beforehand', () => {
      const hfInstance1 = HyperFormula.buildEmpty({ licenseKey: 'dummy-license-key' });

      handsontable({
        formulas: {
          engine: hfInstance1
        },
      });

      expect(hfInstance1.getConfig().licenseKey).toEqual('dummy-license-key');
    });

    it('should not update HyperFormula settings when Handsontable#updateSettings was called without the `formulas` key', () => {
      const hot = handsontable({
        formulas: {
          engine: HyperFormula
        }
      });

      expect(hot.getPlugin('formulas').engine.getConfig().undoLimit).toEqual(20);

      hot.getPlugin('formulas').engine.updateConfig({
        undoLimit: 50
      });

      hot.updateSettings({
        colWidths: () => 400
      });

      expect(hot.getPlugin('formulas').engine.getConfig().undoLimit).toEqual(50);
    });

    it('should not update HyperFormula\'s settings if the new Handsontable settings wouldn\'t change anything in the' +
      ' HF settings', () => {
      const hot = handsontable({
        formulas: {
          engine: HyperFormula
        }
      });

      spyOn(hot.getPlugin('formulas').engine, 'updateConfig').and.callThrough();

      hot.updateSettings({
        formulas: {
          engine: HyperFormula
        }
      });

      expect(hot.getPlugin('formulas').engine.updateConfig).not.toHaveBeenCalled();
    });

    it('should update HyperFormula\'s settings if the new Handsontable settings would change them', () => {
      const hot = handsontable({
        formulas: {
          engine: HyperFormula
        }
      });

      spyOn(hot.getPlugin('formulas').engine, 'updateConfig').and.callThrough();

      hot.updateSettings({
        maxColumns: 27
      });

      expect(hot.getPlugin('formulas').engine.updateConfig).toHaveBeenCalledTimes(1);
      expect(hot.getPlugin('formulas').engine.getConfig().maxColumns).toEqual(27);

      hot.updateSettings({
        maxRows: 27
      });

      expect(hot.getPlugin('formulas').engine.updateConfig).toHaveBeenCalledTimes(2);
      expect(hot.getPlugin('formulas').engine.getConfig().maxRows).toEqual(27);
    });

    it('should not update `sheetName` if `updateSettings` contains one that doesn\'t exist in the engine', () => {
      const hot = handsontable({
        formulas: {
          engine: HyperFormula,
          sheetName: 'init'
        }
      });

      const errorSpy = jasmine.createSpy();

      // eslint-disable-next-line no-console
      const prevError = console.error.bind(console);

      // eslint-disable-next-line no-console
      console.error = (...args) => {
        errorSpy(...args);
        prevError(...args);
      };

      expect(hot.getPlugin('formulas').sheetName).toEqual('init');

      hot.updateSettings({
        formulas: {
          sheetName: 'void'
        }
      });

      expect(errorSpy).toHaveBeenCalledWith('The sheet named `void` does not exist, switch aborted.');

      expect(hot.getPlugin('formulas').sheetName).toEqual('init');
    });

    it('should initialize the HF engine with a new sheet (when the name was provided) after enabling it in the' +
      ' updateSettings object, when it was not set up before.', () => {
      const hot = handsontable({
        data: [
          [1, 2],
          ['=A1', '=A1 + B1']
        ]
      });

      expect(hot.getDataAtCell(1, 0)).toEqual('=A1');

      hot.updateSettings({
        formulas: {
          engine: HyperFormula,
          sheetName: 'init'
        }
      });

      expect(hot.getPlugin('formulas').sheetName).toEqual('init');
      expect(hot.getDataAtCell(1, 0)).toEqual(1);
      expect(hot.getDataAtCell(1, 1)).toEqual(3);
    });

    it('should initialize the HF engine with a new sheet (when the name was not provided) after enabling it in the' +
      ' updateSettings object, when it was not set up before.', () => {
      const hot = handsontable({
        data: [
          [1, 2],
          ['=A1', '=A1 + B1']
        ]
      });

      expect(hot.getDataAtCell(1, 0)).toEqual('=A1');

      hot.updateSettings({
        formulas: {
          engine: HyperFormula
        }
      });

      expect(hot.getPlugin('formulas').sheetName).toEqual(hot.getPlugin('formulas').engine.getSheetName(0));
      expect(hot.getDataAtCell(1, 0)).toEqual(1);
      expect(hot.getDataAtCell(1, 1)).toEqual(3);
    });

    it('should initialize the HF engine with a new sheet (when the name was not provided) after enabling it in the' +
      ' updateSettings object, when it was already enabled, then disabled', () => {
      const hot = handsontable({
        data: [
          [1, 2],
          ['=A1', '=A1 + B1']
        ],
        formulas: {
          engine: HyperFormula
        }
      });

      hot.updateSettings({
        formulas: false
      });

      expect(hot.getDataAtCell(1, 0)).toEqual('=A1');

      hot.updateSettings({
        formulas: {
          engine: HyperFormula
        }
      });

      expect(hot.getPlugin('formulas').sheetName).toEqual(hot.getPlugin('formulas').engine.getSheetName(0));
      expect(hot.getDataAtCell(1, 0)).toEqual(1);
      expect(hot.getDataAtCell(1, 1)).toEqual(3);
    });
  });

  describe('Cross-referencing', () => {
    it('should allow cross-references between HOT instances', () => {
      const hot1 = handsontable({
        data: [['hello from sheet 1'], ['=Sheet2!A2']],
        formulas: {
          engine: HyperFormula,
          sheetName: 'Sheet1'
        },
      });

      const hot2 = spec().$container2.handsontable({
        data: [['=Sheet1!A1'], ['hello from sheet 2']],
        formulas: {
          engine: getPlugin('formulas').engine,
          sheetName: 'Sheet2'
        },
      }).data('handsontable');

      expect(hot1.getDataAtCell(1, 0)).toEqual('hello from sheet 2');
      expect(hot2.getDataAtCell(0, 0)).toEqual('hello from sheet 1');
    });

    it('should auto-update the cells referenced between "linked" HOT instances after one of the is modified', () => {
      const hot1 = handsontable({
        data: [['hello from sheet 1'], ['=Sheet2!A2']],
        formulas: {
          engine: HyperFormula,
          sheetName: 'Sheet1'
        },
      });

      const hot2 = spec().$container2.handsontable({
        data: [['=Sheet1!A1'], ['hello from sheet 2']],
        formulas: {
          engine: getPlugin('formulas').engine,
          sheetName: 'Sheet2'
        },
      }).data('handsontable');

      hot1.setDataAtCell(0, 0, 'Hello from 1');

      expect(hot2.getCell(0, 0).innerText).toEqual('Hello from 1');

      hot2.setDataAtCell(1, 0, 'Hello from 2');

      expect(hot1.getCell(1, 0).innerText).toEqual('Hello from 2');
    });
  });

  describe('Registering custom HF settings', () => {
    it('should register the provided named expressions before creating the HF instance', () => {
      handsontable({
        data: [['=MyLocal']],
        formulas: {
          engine: HyperFormula,
          sheetName: 'Sheet1',
          namedExpressions: [
            {
              name: 'MyLocal',
              expression: '1234'
            }
          ]
        },
      });

      expect(getDataAtCell(0, 0)).toEqual(1234);
    });

    it('should throw a warning when trying to register two named expressions under the same name (and register only' +
      ' the first one)', () => {
      spyOn(console, 'warn');

      handsontable({
        data: [['=MyLocal']],
        formulas: {
          engine: HyperFormula,
          sheetName: 'Sheet1',
          namedExpressions: [
            {
              name: 'MyLocal',
              expression: '1234'
            },
            {
              name: 'MyLocal',
              expression: '12345'
            }
          ]
        },
      });

      expect(getDataAtCell(0, 0)).toEqual(1234);
      // eslint-disable-next-line no-console
      expect(console.warn).toHaveBeenCalledWith('Name of Named Expression \'MyLocal\' is already present');
    });

    it('should register custom function plugins before creating the HF instance', () => {
      class CustomFP extends FunctionPlugin {
        customFP() {
          return 'customFP output';
        }
      }

      CustomFP.implementedFunctions = {
        CUSTOMFP: {
          method: 'customFP',
        }
      };

      handsontable({
        data: [['=CUSTOMFP()']],
        formulas: {
          engine: HyperFormula,
          sheetName: 'Sheet1',
          functions: [
            {
              name: 'CUSTOMFP',
              plugin: CustomFP,
              translations: {
                enGB: {
                  CUSTOMFP: 'CUSTOMFP'
                }
              }
            }
          ]
        },
      });

      expect(getDataAtCell(0, 0)).toEqual('customFP output');

      // cleanup
      HyperFormula.unregisterFunction('CUSTOMFP');
    });

    // TODO: uncomment after it's throwing a duplicated name error on HF's side.
    xit('should throw a warning when trying to register two custom functions under the same name (and register only' +
      ' the first one)', () => {
      spyOn(console, 'warn');

      class CustomFP extends FunctionPlugin {
        customFP() {
          return 'customFP output';
        }
      }

      CustomFP.implementedFunctions = {
        CUSTOMFP: {
          method: 'customFP',
        }
      };

      handsontable({
        data: [['=CUSTOMFP()']],
        formulas: {
          engine: HyperFormula,
          sheetName: 'Sheet1',
          functions: [
            {
              name: 'CUSTOMFP',
              plugin: CustomFP,
              translations: {
                enGB: {
                  CUSTOMFP: 'CUSTOMFP'
                }
              }
            },
            {
              name: 'CUSTOMFP',
              plugin: CustomFP,
              translations: {
                enGB: {
                  CUSTOMFP: 'CUSTOMFP2'
                }
              }
            }
          ]
        },
      });

      expect(getDataAtCell(0, 0)).toEqual('customFP output');
      // eslint-disable-next-line no-console
      expect(console.warn).toHaveBeenCalledTimes(1);

      // cleanup
      HyperFormula.unregisterFunction('CUSTOMFP');
    });

    it('should register a language applying it to the HF instance', () => {
      handsontable({
        data: [['TEST'], ['=LITERY.MAŁE(A1)']],
        formulas: {
          engine: HyperFormula,
          sheetName: 'Sheet1',
          language: plPL
        },
      });

      expect(getDataAtCell(1, 0)).toEqual('test');

      // cleanup
      HyperFormula.unregisterLanguage(plPL.langCode);
    });

    it('should throw a warning when trying to register two languages under the same name (and register only' +
      ' the first one)', () => {
      spyOn(console, 'warn');

      HyperFormula.registerLanguage(plPL.langCode, plPL);

      handsontable({
        data: [['TEST'], ['=LITERY.MAŁE(A1)']],
        formulas: {
          engine: HyperFormula,
          sheetName: 'Sheet1',
          language: plPL
        },
      });

      expect(getDataAtCell(1, 0)).toEqual('test');
      // eslint-disable-next-line no-console
      expect(console.warn).toHaveBeenCalledWith('Language already registered.');

      // cleanup
      HyperFormula.unregisterLanguage(plPL.langCode);
    });
  });
});
