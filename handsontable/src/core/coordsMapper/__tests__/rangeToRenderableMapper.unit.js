import { IndexMapper } from '../../../translations';
import { CellCoords, CellRange } from '../../../3rdparty/walkontable/src';
import { CellRangeToRenderableMapper } from '../rangeToRenderableMapper';

describe('CellRangeToRenderableMapper', () => {
  function createRangeMapper(indexesLength = 10) {
    const rowIndexMapper = new IndexMapper();
    const columnIndexMapper = new IndexMapper();

    rowIndexMapper.initToLength(indexesLength);
    columnIndexMapper.initToLength(indexesLength);

    const rangeMapper = new CellRangeToRenderableMapper({
      rowIndexMapper,
      columnIndexMapper,
    });

    return {
      rowIndexMapper,
      columnIndexMapper,
      rangeMapper,
    };
  }

  function createCellRange(
    highlightRow,
    highlightColumn,
    fromRow = highlightRow,
    fromColumn = highlightColumn,
    toRow = highlightRow,
    toColumn = highlightColumn
  ) {
    return new CellRange(
      new CellCoords(highlightRow, highlightColumn),
      new CellCoords(fromRow, fromColumn),
      new CellCoords(toRow, toColumn),
    );
  }

  it('should not change the indexes when there are no hidden ones', () => {
    const {
      rangeMapper,
    } = createRangeMapper();

    const selectedRange = createCellRange(1, 1, 1, 1, 3, 3);
    const renderableRange = rangeMapper.toRenderable(selectedRange);

    expect(renderableRange).not.toBe(selectedRange);
    expect(renderableRange.isEqual(selectedRange)).toBe(true);
  });

  it('should reduce the range from the top (when there are hidden rows) for a selection with a N-S direction', () => {
    const {
      rangeMapper,
      rowIndexMapper,
    } = createRangeMapper();

    const hidingMap = rowIndexMapper.createAndRegisterIndexMap('my-hiding-map', 'hiding');

    hidingMap.setValueAtIndex(0, true);
    hidingMap.setValueAtIndex(1, true);
    hidingMap.setValueAtIndex(2, true);
    hidingMap.setValueAtIndex(3, true);

    const range = rangeMapper.toRenderable(createCellRange(1, 1, 1, 1, 5, 5));

    expect(range).toEqualCellRange('highlight: 4,1 from: 4,1 to: 5,5');
  });

  it('should reduce the range from the top (when there are hidden rows) for a selection with a S-N direction', () => {
    const {
      rangeMapper,
      rowIndexMapper,
    } = createRangeMapper();

    const hidingMap = rowIndexMapper.createAndRegisterIndexMap('my-hiding-map', 'hiding');

    hidingMap.setValueAtIndex(0, true);
    hidingMap.setValueAtIndex(1, true);
    hidingMap.setValueAtIndex(2, true);
    hidingMap.setValueAtIndex(3, true);

    const range = rangeMapper.toRenderable(createCellRange(5, 5, 5, 5, 1, 1));

    expect(range).toEqualCellRange('highlight: 5,5 from: 5,5 to: 4,1');
  });

  it('should reduce the range from the bottom (when there are hidden rows) for a selection with a N-S direction', () => {
    const {
      rangeMapper,
      rowIndexMapper,
    } = createRangeMapper();

    const hidingMap = rowIndexMapper.createAndRegisterIndexMap('my-hiding-map', 'hiding');

    hidingMap.setValueAtIndex(3, true);
    hidingMap.setValueAtIndex(4, true);
    hidingMap.setValueAtIndex(5, true);
    hidingMap.setValueAtIndex(6, true);

    const range = rangeMapper.toRenderable(createCellRange(1, 1, 1, 1, 5, 5));

    expect(range).toEqualCellRange('highlight: 1,1 from: 1,1 to: 2,5');
  });

  it('should reduce the range from the bottom (when there are hidden rows) for a selection with a S-N direction', () => {
    const {
      rangeMapper,
      rowIndexMapper,
    } = createRangeMapper();

    const hidingMap = rowIndexMapper.createAndRegisterIndexMap('my-hiding-map', 'hiding');

    hidingMap.setValueAtIndex(3, true);
    hidingMap.setValueAtIndex(4, true);
    hidingMap.setValueAtIndex(5, true);
    hidingMap.setValueAtIndex(6, true);

    const range = rangeMapper.toRenderable(createCellRange(5, 5, 5, 5, 1, 1));

    expect(range).toEqualCellRange('highlight: 2,5 from: 2,5 to: 1,1');
  });

  it('should reduce the range from the inline start (when there are hidden columns) for a selection with a W-E direction', () => {
    const {
      rangeMapper,
      columnIndexMapper,
    } = createRangeMapper();

    const hidingMap = columnIndexMapper.createAndRegisterIndexMap('my-hiding-map', 'hiding');

    hidingMap.setValueAtIndex(0, true);
    hidingMap.setValueAtIndex(1, true);
    hidingMap.setValueAtIndex(2, true);
    hidingMap.setValueAtIndex(3, true);

    const range = rangeMapper.toRenderable(createCellRange(1, 1, 1, 1, 5, 5));

    expect(range).toEqualCellRange('highlight: 1,4 from: 1,4 to: 5,5');
  });

  it('should reduce the range from the inline start (when there are hidden columns) for a selection with a E-W direction', () => {
    const {
      rangeMapper,
      columnIndexMapper,
    } = createRangeMapper();

    const hidingMap = columnIndexMapper.createAndRegisterIndexMap('my-hiding-map', 'hiding');

    hidingMap.setValueAtIndex(0, true);
    hidingMap.setValueAtIndex(1, true);
    hidingMap.setValueAtIndex(2, true);
    hidingMap.setValueAtIndex(3, true);

    const range = rangeMapper.toRenderable(createCellRange(5, 5, 5, 5, 1, 1));

    expect(range).toEqualCellRange('highlight: 5,5 from: 5,5 to: 1,4');
  });

  it('should reduce the range from the inline end (when there are hidden columns) for a selection with a W-E direction', () => {
    const {
      rangeMapper,
      columnIndexMapper,
    } = createRangeMapper();

    const hidingMap = columnIndexMapper.createAndRegisterIndexMap('my-hiding-map', 'hiding');

    hidingMap.setValueAtIndex(3, true);
    hidingMap.setValueAtIndex(4, true);
    hidingMap.setValueAtIndex(5, true);
    hidingMap.setValueAtIndex(6, true);

    const range = rangeMapper.toRenderable(createCellRange(1, 1, 1, 1, 5, 5));

    expect(range).toEqualCellRange('highlight: 1,1 from: 1,1 to: 5,2');
  });

  it('should reduce the range from the inline end (when there are hidden columns) for a selection with a E-W direction', () => {
    const {
      rangeMapper,
      columnIndexMapper,
    } = createRangeMapper();

    const hidingMap = columnIndexMapper.createAndRegisterIndexMap('my-hiding-map', 'hiding');

    hidingMap.setValueAtIndex(3, true);
    hidingMap.setValueAtIndex(4, true);
    hidingMap.setValueAtIndex(5, true);
    hidingMap.setValueAtIndex(6, true);

    const range = rangeMapper.toRenderable(createCellRange(5, 5, 5, 5, 1, 1));

    expect(range).toEqualCellRange('highlight: 5,2 from: 5,2 to: 1,1');
  });

  it('should return `null` when the whole range is hidden (hidden rows)', () => {
    const {
      rangeMapper,
      rowIndexMapper,
    } = createRangeMapper();

    const hidingMap = rowIndexMapper.createAndRegisterIndexMap('my-hiding-map', 'hiding');

    hidingMap.setValueAtIndex(0, true);
    hidingMap.setValueAtIndex(1, true);
    hidingMap.setValueAtIndex(2, true);
    hidingMap.setValueAtIndex(3, true);
    hidingMap.setValueAtIndex(4, true);

    expect(rangeMapper.toRenderable(createCellRange(1, 1, 1, 1, 3, 3))).toBe(null);
    expect(rangeMapper.toRenderable(createCellRange(1, -1, 1, -1, -1, 2))).toBe(null);
  });

  it('should return `null` when the whole range is hidden (hidden columns)', () => {
    const {
      rangeMapper,
      columnIndexMapper,
    } = createRangeMapper();

    const hidingMap = columnIndexMapper.createAndRegisterIndexMap('my-hiding-map', 'hiding');

    hidingMap.setValueAtIndex(0, true);
    hidingMap.setValueAtIndex(1, true);
    hidingMap.setValueAtIndex(2, true);
    hidingMap.setValueAtIndex(3, true);
    hidingMap.setValueAtIndex(4, true);

    expect(rangeMapper.toRenderable(createCellRange(1, 1, 1, 1, 3, 3))).toBe(null);
    expect(rangeMapper.toRenderable(createCellRange(-1, 1, -1, 1, 2, -1))).toBe(null);
  });
});
