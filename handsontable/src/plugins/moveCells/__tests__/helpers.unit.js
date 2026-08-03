import { clampMoveTarget, collectMovableMeta, MOVABLE_META_KEYS } from '../helpers';

describe('MOVABLE_META_KEYS', () => {
  it('exports the meta keys that travel with a moved cell', () => {
    // The UndoRedo `MoveCellsAction` imports this same constant. It used to hold a private copy in
    // each module, so adding a key here silently stopped it being restored on undo.
    expect(MOVABLE_META_KEYS).toEqual(['className']);
  });
});

describe('clampMoveTarget', () => {
  it('keeps the whole block inside the grid', () => {
    expect(clampMoveTarget({
      pointerRow: 0,
      pointerCol: 0,
      grabRowOffset: 1,
      grabColOffset: 1,
      rangeHeight: 3,
      rangeWidth: 3,
      totalRows: 20,
      totalCols: 10,
    })).toEqual({ row: 0, col: 0 });

    expect(clampMoveTarget({
      pointerRow: 19,
      pointerCol: 9,
      grabRowOffset: 0,
      grabColOffset: 0,
      rangeHeight: 3,
      rangeWidth: 3,
      totalRows: 20,
      totalCols: 10,
    })).toEqual({ row: 17, col: 7 });
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
