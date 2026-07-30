import { buildMoveMap, clampMoveTarget, MOVABLE_META_KEYS } from '../helpers';

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

describe('buildMoveMap', () => {
  it('maps source cells to target cells while preserving layout', () => {
    expect(buildMoveMap({
      fromRow: 2,
      fromCol: 2,
      toRow: 3,
      toCol: 3,
      targetRow: 5,
      targetCol: 6,
    })).toEqual([
      { fromRow: 2, fromCol: 2, toRow: 5, toCol: 6 },
      { fromRow: 2, fromCol: 3, toRow: 5, toCol: 7 },
      { fromRow: 3, fromCol: 2, toRow: 6, toCol: 6 },
      { fromRow: 3, fromCol: 3, toRow: 6, toCol: 7 },
    ]);
  });
});
