import MetaManager from '../';
import { registerAllCellTypes } from '../../../cellTypes';
import { recordRendererClassNames } from '../../../helpers/rendererClassNames';

registerAllCellTypes();

/**
 * Plays the part of the numeric renderer: appends its tokens to the stored `className` the way
 * the renderer does, straight onto the meta object, and records what it added.
 *
 * @param {MetaManager} metaManager The meta manager.
 * @param {number} row The physical row.
 * @param {number} column The physical column.
 */
function renderNumeric(metaManager: MetaManager, row: number, column: number) {
  const meta = metaManager.getCellMeta(row, column, { visualRow: row, visualColumn: column });
  const tokens = String(meta.className ?? '').split(' ').filter(Boolean);

  tokens.push('htRight', 'htNumeric');
  meta.className = tokens.join(' ');
  recordRendererClassNames(meta, ['htRight', 'htNumeric']);
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

  it('should keep an alignment the user writes back, and drop the marker the renderer added', () => {
    const metaManager = new MetaManager();

    metaManager.setCellMeta(0, 0, 'className', 'myMarker');
    renderNumeric(metaManager, 0, 0);
    // The Alignment menu reads the rendered className and writes it back with the new alignment.
    metaManager.setCellMeta(0, 0, 'className', 'myMarker htNumeric htRight');

    expect(metaManager.getUserDefinedCellMetas()).toEqual([
      { physicalRow: 0, physicalColumn: 0, key: 'className', value: 'myMarker htRight' },
    ]);
  });

  it('should forget the tokens when the user removes className', () => {
    const metaManager = new MetaManager();

    metaManager.setCellMeta(0, 0, 'className', 'myMarker');
    renderNumeric(metaManager, 0, 0);
    metaManager.removeCellMeta(0, 0, 'className');
    // Written after the removal, `htNumeric` is the user's own. Only a forgotten record keeps it,
    // because the write carries no alignment class that would drop it from the record.
    metaManager.setCellMeta(0, 0, 'className', 'htNumeric other');

    expect(metaManager.getUserDefinedCellMetas()).toEqual([
      { physicalRow: 0, physicalColumn: 0, key: 'className', value: 'htNumeric other' },
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
