import HyperFormula from 'hyperformula';

describe('Formulas memory leak check', () => {
  const debug = false;

  beforeEach(function() {
    this.$container = $('<div id="testContainer"></div>').appendTo('body');
    this.$container2 = $('<div id="testContainer-2"></div>').appendTo('body');
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
  });

  it('should detach listeners from the engine after table destroying (one shared HF instances)', () => {
    const hfInstance1 = HyperFormula.buildEmpty({ licenseKey: 'internal-use-in-handsontable' });
    const hot1 = handsontable({
      data: [['foo'], ['Sheet2!A1']],
      formulas: {
        engine: hfInstance1,
        sheetName: 'Sheet1'
      },
    });
    const hot2 = spec().$container2.handsontable({
      data: [['bar'], ['Sheet1:A1']],
      formulas: {
        engine: hfInstance1,
        sheetName: 'Sheet2'
      },
    }).data('handsontable');

    const internalEvents = hfInstance1._emitter.e;

    expect(Object.keys(internalEvents).length).toBe(6);
    expect(internalEvents.namedExpressionAdded.length).toBe(2);
    expect(internalEvents.namedExpressionRemoved.length).toBe(2);
    expect(internalEvents.sheetAdded.length).toBe(2);
    expect(internalEvents.sheetRemoved.length).toBe(2);
    expect(internalEvents.sheetRenamed.length).toBe(2);
    expect(internalEvents.valuesUpdated.length).toBe(2);

    hot1.destroy();

    expect(Object.keys(internalEvents).length).toBe(6);
    expect(internalEvents.namedExpressionAdded.length).toBe(1);
    expect(internalEvents.namedExpressionRemoved.length).toBe(1);
    expect(internalEvents.sheetAdded.length).toBe(1);
    expect(internalEvents.sheetRemoved.length).toBe(1);
    expect(internalEvents.sheetRenamed.length).toBe(1);
    expect(internalEvents.valuesUpdated.length).toBe(1);

    hot2.destroy();

    expect(internalEvents).toEqual({});
  });

  it('should detach listeners from the engine after table destroying (HF as class)', () => {
    const hot1 = handsontable({
      data: [['foo'], ['Sheet2!A1']],
      formulas: {
        engine: HyperFormula,
        sheetName: 'Sheet1'
      },
    });
    const hot2 = spec().$container2.handsontable({
      data: [['bar'], ['Sheet1:A1']],
      formulas: {
        engine: hot1.getPlugin('formulas').engine,
        sheetName: 'Sheet2'
      },
    }).data('handsontable');

    const internalEvents = hot1.getPlugin('formulas').engine._emitter.e;

    expect(Object.keys(internalEvents).length).toBe(6);
    expect(internalEvents.namedExpressionAdded.length).toBe(2);
    expect(internalEvents.namedExpressionRemoved.length).toBe(2);
    expect(internalEvents.sheetAdded.length).toBe(3);
    expect(internalEvents.sheetRemoved.length).toBe(3);
    expect(internalEvents.sheetRenamed.length).toBe(2);
    expect(internalEvents.valuesUpdated.length).toBe(2);

    hot1.destroy();

    expect(Object.keys(internalEvents).length).toBe(6);
    expect(internalEvents.namedExpressionAdded.length).toBe(1);
    expect(internalEvents.namedExpressionRemoved.length).toBe(1);
    expect(internalEvents.sheetAdded.length).toBe(2);
    expect(internalEvents.sheetRemoved.length).toBe(2);
    expect(internalEvents.sheetRenamed.length).toBe(1);
    expect(internalEvents.valuesUpdated.length).toBe(1);

    hot2.destroy();

    // Within the last Handsontable destroy call, the engine is destroyed as well.
    // So even that the events are attached, they won't produce any side effects.
    expect(Object.keys(internalEvents).length).toBe(2);
    expect(internalEvents.sheetAdded.length).toBe(1);
    expect(internalEvents.sheetRemoved.length).toBe(1);
  });

  it('should detach listeners from the engine after disabling the plugin (one shared HF instances)', () => {
    const hfInstance1 = HyperFormula.buildEmpty({ licenseKey: 'internal-use-in-handsontable' });
    const hot1 = handsontable({
      data: [['foo'], ['Sheet2!A1']],
      formulas: {
        engine: hfInstance1,
        sheetName: 'Sheet1'
      },
    });
    const hot2 = spec().$container2.handsontable({
      data: [['bar'], ['Sheet1:A1']],
      formulas: {
        engine: hfInstance1,
        sheetName: 'Sheet2'
      },
    }).data('handsontable');

    const internalEvents = hfInstance1._emitter.e;

    expect(Object.keys(internalEvents).length).toBe(6);
    expect(internalEvents.namedExpressionAdded.length).toBe(2);
    expect(internalEvents.namedExpressionRemoved.length).toBe(2);
    expect(internalEvents.sheetAdded.length).toBe(2);
    expect(internalEvents.sheetRemoved.length).toBe(2);
    expect(internalEvents.sheetRenamed.length).toBe(2);
    expect(internalEvents.valuesUpdated.length).toBe(2);

    hot1.updateSettings({ formulas: false });

    expect(Object.keys(internalEvents).length).toBe(6);
    expect(internalEvents.namedExpressionAdded.length).toBe(1);
    expect(internalEvents.namedExpressionRemoved.length).toBe(1);
    expect(internalEvents.sheetAdded.length).toBe(1);
    expect(internalEvents.sheetRemoved.length).toBe(1);
    expect(internalEvents.sheetRenamed.length).toBe(1);
    expect(internalEvents.valuesUpdated.length).toBe(1);

    hot2.updateSettings({ formulas: false });

    expect(internalEvents).toEqual({});

    hot1.updateSettings({ formulas: { engine: hfInstance1 } });

    expect(Object.keys(internalEvents).length).toBe(6);
    expect(internalEvents.namedExpressionAdded.length).toBe(1);
    expect(internalEvents.namedExpressionRemoved.length).toBe(1);
    expect(internalEvents.sheetAdded.length).toBe(1);
    expect(internalEvents.sheetRemoved.length).toBe(1);
    expect(internalEvents.sheetRenamed.length).toBe(1);
    expect(internalEvents.valuesUpdated.length).toBe(1);
  });

  it('should detach listeners from the engine after disabling the plugin (HF as class)', () => {
    const hot1 = handsontable({
      data: [['foo'], ['Sheet2!A1']],
      formulas: {
        engine: HyperFormula,
        sheetName: 'Sheet1'
      },
    });
    const hot2 = spec().$container2.handsontable({
      data: [['bar'], ['Sheet1:A1']],
      formulas: {
        engine: hot1.getPlugin('formulas').engine,
        sheetName: 'Sheet2'
      },
    }).data('handsontable');

    const internalEvents = hot1.getPlugin('formulas').engine._emitter.e;

    expect(Object.keys(internalEvents).length).toBe(6);
    expect(internalEvents.namedExpressionAdded.length).toBe(2);
    expect(internalEvents.namedExpressionRemoved.length).toBe(2);
    expect(internalEvents.sheetAdded.length).toBe(3);
    expect(internalEvents.sheetRemoved.length).toBe(3);
    expect(internalEvents.sheetRenamed.length).toBe(2);
    expect(internalEvents.valuesUpdated.length).toBe(2);

    hot1.updateSettings({ formulas: false });

    expect(Object.keys(internalEvents).length).toBe(6);
    expect(internalEvents.namedExpressionAdded.length).toBe(1);
    expect(internalEvents.namedExpressionRemoved.length).toBe(1);
    expect(internalEvents.sheetAdded.length).toBe(2);
    expect(internalEvents.sheetRemoved.length).toBe(2);
    expect(internalEvents.sheetRenamed.length).toBe(1);
    expect(internalEvents.valuesUpdated.length).toBe(1);

    hot2.updateSettings({ formulas: false });

    // There are always 2 additional events that recalculates the engine on
    // sheetAdd and sheetRemove events.
    expect(Object.keys(internalEvents).length).toBe(2);
    expect(internalEvents.sheetAdded.length).toBe(1);
    expect(internalEvents.sheetRemoved.length).toBe(1);

    hot1.updateSettings({ formulas: { engine: HyperFormula } });

    const internalEventsNew = hot1.getPlugin('formulas').engine._emitter.e;

    expect(Object.keys(internalEventsNew).length).toBe(6);
    expect(internalEventsNew.namedExpressionAdded.length).toBe(1);
    expect(internalEventsNew.namedExpressionRemoved.length).toBe(1);
    expect(internalEventsNew.sheetAdded.length).toBe(2);
    expect(internalEventsNew.sheetRemoved.length).toBe(2);
    expect(internalEventsNew.sheetRenamed.length).toBe(1);
    expect(internalEventsNew.valuesUpdated.length).toBe(1);

    hot2.updateSettings({ formulas: { engine: hot1.getPlugin('formulas').engine } });

    expect(Object.keys(internalEventsNew).length).toBe(6);
    expect(internalEventsNew.namedExpressionAdded.length).toBe(2);
    expect(internalEventsNew.namedExpressionRemoved.length).toBe(2);
    expect(internalEventsNew.sheetAdded.length).toBe(3);
    expect(internalEventsNew.sheetRemoved.length).toBe(3);
    expect(internalEventsNew.sheetRenamed.length).toBe(2);
    expect(internalEventsNew.valuesUpdated.length).toBe(2);
  });
});
