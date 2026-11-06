import Core from 'handsontable/core';
import MetaManager from '../';
import { registerAllCellTypes } from '../../../cellTypes';
import { numericRenderer } from '../../../renderers/numericRenderer';

registerAllCellTypes();

const instance = new Core(document.createElement('div'), {});

/**
 * Draws a cell with the real numeric renderer, which appends its class names to the stored
 * `className` and records them.
 *
 * @param {MetaManager} metaManager The meta manager.
 * @param {number} row The physical row.
 * @param {number} column The physical column.
 */
function renderNumeric(metaManager: MetaManager, row: number, column: number) {
  const meta = metaManager.getCellMeta(row, column, { visualRow: row, visualColumn: column });

  numericRenderer(instance, document.createElement('td'), row, column, column, 1, meta);
}

describe('MetaManager and the class names a renderer adds', () => {
  it('should replay a user-defined className without the tokens the renderer appended', () => {
    const metaManager = new MetaManager();

    metaManager.setCellMeta(0, 0, 'className', 'myMarker');
    renderNumeric(metaManager, 0, 0);

    expect(metaManager.getCellMeta(0, 0, { visualRow: 0, visualColumn: 0 }).className)
      .toBe('myMarker htRight htNumeric');
    expect(metaManager.getUserDefinedCellMetas()).toEqual([
      { physicalRow: 0, physicalColumn: 0, key: 'className', value: 'myMarker' },
    ]);
  });

  it('should replay a `cell`-option className without the tokens the renderer appended', () => {
    const metaManager = new MetaManager();

    metaManager.startCellOptionMetaRecording();
    metaManager.setCellMeta(0, 0, 'className', 'myMarker');
    metaManager.endCellOptionMetaRecording();
    renderNumeric(metaManager, 0, 0);

    expect(metaManager.getCellOptionCellMetas()).toEqual([
      { physicalRow: 0, physicalColumn: 0, key: 'className', value: 'myMarker' },
    ]);
  });

  it('should keep an alignment the user writes, and drop the class names the renderer added', () => {
    const metaManager = new MetaManager();

    metaManager.setCellMeta(0, 0, 'className', 'myMarker');
    renderNumeric(metaManager, 0, 0);
    // The Alignment menu builds the write from the className the user holds.
    metaManager.setCellMeta(0, 0, 'className', 'myMarker htRight');

    expect(metaManager.getUserDefinedCellMetas()).toEqual([
      { physicalRow: 0, physicalColumn: 0, key: 'className', value: 'myMarker htRight' },
    ]);
  });

  it('should keep a renderer class name the user writes after the cell was drawn', () => {
    const metaManager = new MetaManager();

    metaManager.setCellMeta(0, 0, 'className', 'myMarker');
    renderNumeric(metaManager, 0, 0);
    metaManager.setCellMeta(0, 0, 'className', 'htNumeric mine');

    expect(metaManager.getUserDefinedCellMetas()).toEqual([
      { physicalRow: 0, physicalColumn: 0, key: 'className', value: 'htNumeric mine' },
    ]);
  });

  it('should treat the rendered className the user writes back as their own', () => {
    const metaManager = new MetaManager();

    metaManager.setCellMeta(0, 0, 'className', 'myMarker');
    renderNumeric(metaManager, 0, 0);

    const rendered = metaManager.getCellMeta(0, 0, { visualRow: 0, visualColumn: 0 }).className;

    metaManager.setCellMeta(0, 0, 'className', `${rendered} foo`);

    expect(metaManager.getUserDefinedCellMetas()).toEqual([
      { physicalRow: 0, physicalColumn: 0, key: 'className', value: 'myMarker htRight htNumeric foo' },
    ]);
  });

  it('should report a className without the renderer class names in the key state the undo journal stores', () => {
    const metaManager = new MetaManager();

    metaManager.setCellMeta(0, 0, 'className', 'myMarker');
    renderNumeric(metaManager, 0, 0);

    expect(metaManager.getCellMeta(0, 0, { visualRow: 0, visualColumn: 0 }).className)
      .toBe('myMarker htRight htNumeric');
    expect(metaManager.cellMeta.getMetaKeyState(0, 0, 'className')).toEqual({
      hadOwn: true,
      value: 'myMarker',
      origin: 'user',
    });
  });

  it('should report a className without the renderer class names in the row snapshot the undo journal stores', () => {
    const metaManager = new MetaManager();

    metaManager.setCellMeta(0, 0, 'className', 'myMarker');
    renderNumeric(metaManager, 0, 0);

    const states = [];

    metaManager.cellMeta.captureRowMetaKeyStates(0, states);

    expect(states).toEqual([
      expect.objectContaining({
        physicalRow: 0,
        physicalColumn: 0,
        key: 'className',
        state: { hadOwn: true, value: 'myMarker', origin: 'user' },
      }),
    ]);
  });

  it('should leave the value of any other key untouched', () => {
    const metaManager = new MetaManager();

    metaManager.setCellMeta(0, 0, 'className', 'myMarker');
    metaManager.setCellMeta(0, 0, 'comment', 'htRight');
    renderNumeric(metaManager, 0, 0);

    expect(metaManager.getUserDefinedCellMetas()).toEqual(expect.arrayContaining([
      { physicalRow: 0, physicalColumn: 0, key: 'comment', value: 'htRight' },
    ]));
  });
});
