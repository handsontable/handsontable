import { collectMovableMeta, MOVABLE_META_KEYS } from '../movableMeta';
import { recordRendererClassNames } from '../../helpers/rendererClassNames';

describe('MOVABLE_META_KEYS', () => {
  it('exports the meta keys that travel with a moved cell', () => {
    // The MoveCells plugin and the UndoRedo `MoveCellsAction` import this same constant. It used to
    // hold a private copy in each module, so adding a key in one silently stopped it being restored
    // on undo.
    expect(MOVABLE_META_KEYS).toEqual(['className']);
  });
});

describe('collectMovableMeta', () => {
  it('returns one entry per cell that owns a movable key, skipping the rest of the region', () => {
    // A move must allocate proportionally to styled cells, not range area — an unstyled 1M-cell
    // block used to materialize one meta object per cell through the dense per-cell write pass.
    const ownMeta = {
      '1:1': { className: 'marked' },
      '2:0': { className: '' },
    };
    const hot = {
      getCellMetaTransient(row, col) {
        // Own props only for "stored" cells; every other cell resolves to a prototype-derived
        // object whose movable keys are not own properties.
        return { ...ownMeta[`${row}:${col}`] };
      },
    };

    expect(collectMovableMeta(hot, 0, 0, 2, 2)).toEqual([
      { row: 1, col: 1, meta: { className: 'marked' } },
      { row: 2, col: 0, meta: { className: '' } },
    ]);
  });

  it('ignores movable keys inherited from the cascade', () => {
    const inherited = Object.create({ className: 'column-level' });
    const hot = {
      getCellMetaTransient() {
        return inherited;
      },
    };

    expect(collectMovableMeta(hot, 0, 0, 1, 1)).toEqual([]);
  });
});

describe('collectMovableMeta and the class names a renderer appended', () => {
  /**
   * Builds a fake instance whose transient meta for cell 0:0 is the given object.
   *
   * @param {object} cellMeta The meta object of cell 0:0.
   * @returns {object}
   */
  function createHot(cellMeta) {
    return {
      getCellMetaTransient: () => cellMeta,
    };
  }

  it('should move a className without the class names the renderer appended', () => {
    const cellMeta = { className: 'mark htRight htNumeric' };

    recordRendererClassNames(cellMeta, ['htRight', 'htNumeric']);

    expect(collectMovableMeta(createHot(cellMeta), 0, 0, 0, 0)).toEqual([
      { row: 0, col: 0, meta: { className: 'mark' } },
    ]);
  });

  it('should move nothing for a className that holds only the class names the renderer appended', () => {
    const cellMeta = { className: 'htRight htNumeric' };

    recordRendererClassNames(cellMeta, ['htRight', 'htNumeric']);

    expect(collectMovableMeta(createHot(cellMeta), 0, 0, 0, 0)).toEqual([]);
  });

  it('should report a className that holds only renderer class names when the scan is for clearing', () => {
    const cellMeta = { className: 'htRight htNumeric' };

    recordRendererClassNames(cellMeta, ['htRight', 'htNumeric']);

    expect(collectMovableMeta(createHot(cellMeta), 0, 0, 0, 0, true)).toEqual([
      { row: 0, col: 0, meta: { className: 'htRight htNumeric' } },
    ]);
  });

  it('should still move an empty className the user set', () => {
    expect(collectMovableMeta(createHot({ className: '' }), 0, 0, 0, 0)).toEqual([
      { row: 0, col: 0, meta: { className: '' } },
    ]);
  });
});
