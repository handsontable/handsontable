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

  it('should reuse the already-owned sheet on every `loadData` call (no `sheetName` configured)', async() => {
    const hot = handsontable({
      data: [['1', '2', '=A1+B1']],
      formulas: {
        engine: HyperFormula,
      },
    });
    const { engine } = hot.getPlugin('formulas');

    expect(engine.getSheetNames().length).toBe(1);

    for (let i = 0; i < 5; i++) {
      await loadData([['1', '2', '=A1+B1']]);
    }

    expect(engine.getSheetNames().length).toBe(1);
    expect(engine.getSheetId(hot.getPlugin('formulas').sheetName)).toBe(hot.getPlugin('formulas').sheetId);
    expect(hot.getDataAtCell(0, 2)).toBe(3);
  });

  it('should reuse the already-owned sheet on every `updateData` call (no `sheetName` configured)', async() => {
    const hot = handsontable({
      data: [['1', '2', '=A1+B1']],
      formulas: {
        engine: HyperFormula,
      },
    });
    const { engine } = hot.getPlugin('formulas');

    expect(engine.getSheetNames().length).toBe(1);

    for (let i = 0; i < 5; i++) {
      await updateData([['1', '2', '=A1+B1']]);
    }

    expect(engine.getSheetNames().length).toBe(1);
    expect(hot.getDataAtCell(0, 2)).toBe(3);
  });

  it('should not retain the previous data in the engine after reloading the data', async() => {
    const hot = handsontable({
      data: [['1', '2', '=A1+B1']],
      formulas: {
        engine: HyperFormula,
      },
    });
    const { engine } = hot.getPlugin('formulas');

    await loadData([['10', '20', '=A1+B1']]);

    const allSheetsSerialized = engine.getSheetNames()
      .map(name => engine.getSheetSerialized(engine.getSheetId(name)));

    // Only the current data may be present anywhere in the engine.
    expect(allSheetsSerialized).toEqual([[['10', '20', '=A1+B1']]]);
  });

  it('should keep using the sheet pointed to by the `sheetName` option across data loads', async() => {
    const hot = handsontable({
      data: [['1', '2', '=A1+B1']],
      formulas: {
        engine: HyperFormula,
        sheetName: 'MySheet',
      },
    });
    const { engine } = hot.getPlugin('formulas');

    await loadData([['1', '2', '=A1+B1']]);
    await updateData([['1', '2', '=A1+B1']]);

    expect(engine.getSheetNames()).toEqual(['MySheet']);
    expect(hot.getPlugin('formulas').sheetName).toBe('MySheet');
  });

  it('should give each grid its own sheet when they share a single engine', async() => {
    const hfInstance = HyperFormula.buildEmpty({ licenseKey: 'internal-use-in-handsontable' });
    const hot1 = handsontable({
      data: [['1', '2', '=A1+B1']],
      formulas: {
        engine: hfInstance,
      },
    });
    const hot2 = spec().$container2.handsontable({
      data: [['3', '4', '=A1+B1']],
      formulas: {
        engine: hfInstance,
      },
    }).data('handsontable');

    expect(hfInstance.getSheetNames().length).toBe(2);

    hot1.loadData([['1', '2', '=A1+B1']]);
    hot2.loadData([['3', '4', '=A1+B1']]);

    // Reloading the data must not add sheets, and must not make the two grids share one sheet.
    expect(hfInstance.getSheetNames().length).toBe(2);
    expect(hot1.getPlugin('formulas').sheetId).not.toBe(hot2.getPlugin('formulas').sheetId);
    expect(hot1.getDataAtCell(0, 2)).toBe(3);
    expect(hot2.getDataAtCell(0, 2)).toBe(7);
  });

  it('should not overwrite another grid\'s sheet after an engine-wide sheet rename', async() => {
    const hfInstance = HyperFormula.buildEmpty({ licenseKey: 'internal-use-in-handsontable' });
    const hot1 = handsontable({
      data: [['1', '2', '=A1+B1']],
      formulas: {
        engine: hfInstance,
      },
    });
    const hot2 = spec().$container2.handsontable({
      data: [['3', '4', '=A1+B1']],
      formulas: {
        engine: hfInstance,
      },
    }).data('handsontable');

    const hot1SheetId = hot1.getPlugin('formulas').sheetId;

    // `sheetRenamed` is engine-wide, so it reaches every attached instance. Renaming the first
    // grid's sheet must not repoint the second grid at it.
    hfInstance.renameSheet(hot1SheetId, 'Renamed');

    expect(hot2.getPlugin('formulas').sheetId).not.toBe(hot1SheetId);

    hot2.loadData([['30', '40', '=A1+B1']]);

    // The first grid's sheet must still hold the first grid's data.
    expect(hfInstance.getSheetSerialized(hot1SheetId)).toEqual([['1', '2', '=A1+B1']]);
    expect(hot1.getDataAtCell(0, 2)).toBe(3);
    expect(hot2.getDataAtCell(0, 2)).toBe(70);
  });

  it('should follow a rename of its own sheet when `sheetName` differs from it only in case', async() => {
    const hfInstance = HyperFormula.buildEmpty({ licenseKey: 'internal-use-in-handsontable' });

    hfInstance.addSheet('Sheet1');

    // The engine matches sheet names without looking at the case, but keeps the casing it was
    // given. So the plugin can hold `sheet1` while the engine reports the name as `Sheet1`.
    const hot = handsontable({
      data: [['1', '2', '=A1+B1']],
      formulas: {
        engine: hfInstance,
        sheetName: 'sheet1',
      },
    });

    hfInstance.renameSheet(hfInstance.getSheetId('sheet1'), 'Renamed');

    expect(hot.getPlugin('formulas').sheetName).toBe('Renamed');
    expect(hfInstance.doesSheetExist(hot.getPlugin('formulas').sheetName)).toBe(true);

    // A sheet name left pointing at nothing makes the formulas stop resolving.
    await setDataAtCell(0, 0, '10');

    expect(hot.getDataAtCell(0, 2)).toBe(12);
  });

  it('should not leave the previous data in the engine when the new data cannot be written', async() => {
    // The engine caps this sheet at 2 rows, so a 3-row load cannot be written to it.
    const hfInstance = HyperFormula.buildEmpty({
      licenseKey: 'internal-use-in-handsontable',
      maxRows: 2,
    });
    const hot = handsontable({
      data: [['1', '2'], ['3', '4']],
      formulas: {
        engine: hfInstance,
      },
    });
    const { sheetId } = hot.getPlugin('formulas');

    await loadData([['10', '20'], ['30', '40'], ['50', '60']]);

    expect(hfInstance.isItPossibleToReplaceSheetContent(sheetId, hot.getSourceDataArray())).toBe(false);
    // The sheet is reused now, so it must not keep serving the data from before the load.
    expect(hfInstance.getSheetSerialized(sheetId)).not.toEqual([['1', '2'], ['3', '4']]);
  });

  it('should redraw the grids that depend on a sheet whose new data could not be written', async() => {
    const hfInstance = HyperFormula.buildEmpty({
      licenseKey: 'internal-use-in-handsontable',
      maxRows: 2,
    });

    handsontable({
      data: [['1'], ['2']],
      formulas: {
        engine: hfInstance,
        sheetName: 'SheetA',
      },
    });

    const hot2 = spec().$container2.handsontable({
      data: [['=SheetA!A1']],
      formulas: {
        engine: hfInstance,
        sheetName: 'SheetB',
      },
    }).data('handsontable');

    expect(hot2.getCell(0, 0).textContent).toBe('1');

    // Three rows cannot be written to a sheet capped at two, so `SheetA` gets emptied.
    await loadData([['10'], ['20'], ['30']]);

    // The other grid reads `SheetA`, so it has to be redrawn instead of keeping the old `1`.
    // A reference to an emptied cell renders blank.
    expect(hot2.getCell(0, 0).textContent).toBe('');
  });

  it('should detach listeners from the engine after table destroying (one shared HF instances)', async() => {
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

  it('should detach listeners from the engine after table destroying (HF as class)', async() => {
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

  it('should detach listeners from the engine after disabling the plugin (one shared HF instances)', async() => {
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

  it('should detach listeners from the engine after disabling the plugin (HF as class)', async() => {
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
