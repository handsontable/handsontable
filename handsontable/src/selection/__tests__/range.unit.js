import { CellCoords, CellRange } from 'walkontable';
import SelectionRange from '../range';

function createCellCoords(row, column) {
  return new CellCoords(row, column);
}

function createCellRange(
  rowHighlight,
  columnHighlight,
  rowFrom = rowHighlight,
  columnFrom = columnHighlight,
  rowTo = rowHighlight,
  columnTo = columnHighlight
) {
  return new CellRange(
    createCellCoords(rowHighlight, columnHighlight),
    createCellCoords(rowFrom, columnFrom),
    createCellCoords(rowTo, columnTo),
  );
}

describe('SelectionRange', () => {
  let selectionRange;

  beforeEach(() => {
    selectionRange = new SelectionRange((...args) => new CellRange(...args));
  });

  afterEach(() => {
    selectionRange = null;
  });

  describe('.constructor', () => {
    it('should initiate `ranges` as an ampty array', () => {
      expect(selectionRange.ranges.length).toBe(0);
    });
  });

  describe('.isEmpty', () => {
    it('should return `true` if the size of the ranges is equal to zero', () => {
      selectionRange.ranges.length = 0;

      expect(selectionRange.isEmpty()).toBe(true);
    });

    it('should return `false` if the size of the ranges is not equal to zero', () => {
      selectionRange.ranges.push('x');

      expect(selectionRange.isEmpty()).toBe(false);
    });
  });

  describe('.set', () => {
    it('should reset an array of cell ranges and append new CellRange to this', () => {
      selectionRange.ranges.push(
        new CellRange(createCellCoords(4, 4))
      );

      selectionRange.set(createCellCoords(0, 0));
      selectionRange.set(createCellCoords(1, 2));

      expect(selectionRange.ranges.length).toBe(1);
      expect(selectionRange.ranges[0].toObject()).toEqual({
        from: { col: 2, row: 1 },
        to: { col: 2, row: 1 },
      });
    });
  });

  describe('.add', () => {
    it('should append new CellRange to the ranges array', () => {
      selectionRange.add(createCellCoords(0, 0));
      selectionRange.add(createCellCoords(0, 0));
      selectionRange.add(createCellCoords(1, 2));

      expect(selectionRange.ranges.length).toBe(3);
      expect(selectionRange.ranges[0].toObject()).toEqual({
        from: { col: 0, row: 0 },
        to: { col: 0, row: 0 },
      });
      expect(selectionRange.ranges[1].toObject()).toEqual({
        from: { col: 0, row: 0 },
        to: { col: 0, row: 0 },
      });
      expect(selectionRange.ranges[2].toObject()).toEqual({
        from: { col: 2, row: 1 },
        to: { col: 2, row: 1 },
      });
    });
  });

  describe('.pop', () => {
    it('should remove the last element from the ranges array', () => {
      selectionRange.ranges.push(
        createCellRange(4, 4),
        createCellRange(0, 0),
        createCellRange(1, 2),
      );

      selectionRange.pop();

      expect(selectionRange.ranges.length).toBe(2);
      expect(selectionRange.ranges[0].toObject()).toEqual({
        from: { col: 4, row: 4 },
        to: { col: 4, row: 4 },
      });
      expect(selectionRange.ranges[1].toObject()).toEqual({
        from: { col: 0, row: 0 },
        to: { col: 0, row: 0 },
      });

      selectionRange.pop();

      expect(selectionRange.ranges.length).toBe(1);
      expect(selectionRange.ranges[0].toObject()).toEqual({
        from: { col: 4, row: 4 },
        to: { col: 4, row: 4 },
      });

      selectionRange.pop();

      expect(selectionRange.ranges.length).toBe(0);

      selectionRange.pop();

      expect(selectionRange.ranges.length).toBe(0);
    });
  });

  describe('.current', () => {
    it('should return `undefined` when an array of ranges is empty', () => {
      expect(selectionRange.current()).not.toBeDefined();
    });

    it('should return recently added cell range', () => {
      selectionRange.ranges.push(
        createCellRange(4, 4),
        createCellRange(0, 0),
        createCellRange(1, 2),
      );

      expect(selectionRange.current().toObject()).toEqual({
        from: { col: 2, row: 1 },
        to: { col: 2, row: 1 },
      });
    });
  });

  describe('.previous', () => {
    it('should return `undefined` when an array of ranges is empty', () => {
      expect(selectionRange.previous()).not.toBeDefined();
    });

    it('should return previously added cell range', () => {
      selectionRange.ranges.push(
        createCellRange(4, 4),
        createCellRange(0, 0),
        createCellRange(1, 2),
      );

      expect(selectionRange.previous().toObject()).toEqual({
        from: { col: 0, row: 0 },
        to: { col: 0, row: 0 },
      });
    });
  });

  describe('.includes', () => {
    it('should return `true` if the coords match the selection range', () => {
      selectionRange.ranges.push(
        createCellRange(1, 1, 1, 1, 3, 3),
        createCellRange(11, 11),
      );

      expect(selectionRange.includes(createCellCoords(1, 2))).toBe(true);
      expect(selectionRange.includes(createCellCoords(1, 3))).toBe(true);
      expect(selectionRange.includes(createCellCoords(11, 11))).toBe(true);
    });

    it('should return `false` if the coords doesn\'t match the selection range', () => {
      selectionRange.ranges.push(
        createCellRange(1, 1, 1, 1, 3, 3),
        createCellRange(11, 11),
      );

      expect(selectionRange.includes(createCellCoords(1, 4))).toBe(false);
      expect(selectionRange.includes(createCellCoords(0, 0))).toBe(false);
      expect(selectionRange.includes(createCellCoords(11, 12))).toBe(false);
    });

    it('should be possible to inject custom criteria to the method', () => {
      selectionRange.ranges.push(
        createCellRange(1, 1, 1, 1, 3, 3),
        createCellRange(11, 11, 11, 11, 11, 11),
      );

      expect(selectionRange.includes(createCellCoords(1, 2), () => {
        return false;
      })).toBe(false);
    });
  });

  describe('.findAll', () => {
    it('should return all matching ranges', () => {
      selectionRange.ranges.push(
        createCellRange(1, 1, 1, 1, 3, 3),
        createCellRange(2, 2, 2, 2, 5, 5),
        createCellRange(11, 11),
        createCellRange(11, 11),
      );

      expect(selectionRange.findAll(createCellRange(2, 2, 2, 2, 3, 3))).toEqual([]);
      expect(selectionRange.findAll(createCellRange(1, 1, 1, 1, 3, 3))).toEqual([
        { range: createCellRange(1, 1, 1, 1, 3, 3), layer: 0 },
      ]);
      expect(selectionRange.findAll(createCellRange(2, 2, 3, 3, 1, 1))).toEqual([
        { range: createCellRange(1, 1, 1, 1, 3, 3), layer: 0 },
      ]);
      expect(selectionRange.findAll(createCellRange(11, 11))).toEqual([
        { range: createCellRange(11, 11), layer: 2 },
        { range: createCellRange(11, 11), layer: 3 },
      ]);
    });
  });

  describe('.removeLayers', () => {
    it('should remove ranges from provider layers', () => {
      selectionRange.ranges.push(
        createCellRange(1, 1, 1, 1, 3, 3),
        createCellRange(2, 2, 2, 2, 5, 5),
        createCellRange(11, 11),
        createCellRange(11, 12),
      );

      selectionRange.removeLayers([0, 2]);

      expect(selectionRange.ranges).toEqual([
        createCellRange(2, 2, 2, 2, 5, 5),
        createCellRange(11, 12),
      ]);
    });
  });

  describe('.remove', () => {
    it('should remove all matching ranges from the collection', () => {
      selectionRange.ranges.push(
        createCellRange(1, 1, 1, 1, 3, 3),
        createCellRange(2, 2, 2, 2, 5, 5),
        createCellRange(11, 11),
        createCellRange(11, 11),
      );

      selectionRange.remove([
        createCellRange(1, 1, 1, 1, 3, 3),
        createCellRange(2, 2),
        createCellRange(11, 11),
      ]);

      expect(selectionRange.ranges).toEqual([
        createCellRange(2, 2, 2, 2, 5, 5),
      ]);
    });
  });

  describe('.clone', () => {
    it('should be possible to clone the instance', () => {
      selectionRange.ranges.push(
        createCellRange(1, 1, 1, 1, 3, 3),
        createCellRange(2, 2, 2, 2, 5, 5),
        createCellRange(11, 11),
        createCellRange(11, 12),
      );

      const clone = selectionRange.clone();

      expect(clone).not.toBe(selectionRange);
      expect(clone.ranges).toEqual(selectionRange.ranges);
    });
  });

  describe('.map', () => {
    it('should be possible to map the ranges with custom logic', () => {
      selectionRange.ranges.push(
        createCellRange(1, 1, 1, 1, 3, 3),
        createCellRange(2, 2, 2, 2, 5, 5),
        createCellRange(11, 11),
        createCellRange(11, 12),
      );

      selectionRange.map((range, index) => {
        if (index === 1) {
          range.from.row = 1;
          range.from.col = 0;
        }

        return range;
      });

      expect(selectionRange.ranges).toEqual([
        createCellRange(1, 1, 1, 1, 3, 3),
        createCellRange(2, 2, 1, 0, 5, 5),
        createCellRange(11, 11),
        createCellRange(11, 12),
      ]);
    });
  });

  describe('.clear', () => {
    it('should reset the ranges collection', () => {
      selectionRange.ranges.push(
        createCellRange(4, 4),
        createCellRange(0, 0),
        createCellRange(1, 2),
      );

      selectionRange.clear();

      expect(selectionRange.ranges.length).toBe(0);
    });
  });

  describe('.size', () => {
    it('should return the length/size of the collected ranges', () => {
      selectionRange.ranges.push(
        createCellRange(4, 4),
        createCellRange(0, 0),
        createCellRange(1, 2),
      );

      expect(selectionRange.size()).toBe(3);
    });
  });

  describe('.peekByIndex', () => {
    it('should return the CellRange object from the beginning based on the index argument passed to the method', () => {
      selectionRange.ranges.push(
        createCellRange(4, 4),
        createCellRange(0, 0),
        createCellRange(1, 2),
      );

      expect(selectionRange.peekByIndex(-2)).not.toBeDefined();
      expect(selectionRange.peekByIndex(-1)).not.toBeDefined();
      expect(selectionRange.peekByIndex().toObject()).toEqual({
        from: { col: 4, row: 4 },
        to: { col: 4, row: 4 },
      });
      expect(selectionRange.peekByIndex(0).toObject()).toEqual({
        from: { col: 4, row: 4 },
        to: { col: 4, row: 4 },
      });
      expect(selectionRange.peekByIndex(1).toObject()).toEqual({
        from: { col: 0, row: 0 },
        to: { col: 0, row: 0 },
      });
      expect(selectionRange.peekByIndex(2).toObject()).toEqual({
        from: { col: 2, row: 1 },
        to: { col: 2, row: 1 },
      });
      expect(selectionRange.peekByIndex(3)).not.toBeDefined();
      expect(selectionRange.peekByIndex(4)).not.toBeDefined();
    });
  });

  it('should have implemented iterator protocol', () => {
    selectionRange.ranges.push(
      createCellRange(4, 4),
      createCellRange(0, 0),
      createCellRange(1, 2),
    );

    expect(selectionRange[Symbol.iterator]).toBeDefined();

    const ranges = Array.from(selectionRange);

    expect(ranges.length).toBe(3);
    expect(ranges[0].toObject()).toEqual({
      from: { col: 4, row: 4 },
      to: { col: 4, row: 4 },
    });
    expect(ranges[1].toObject()).toEqual({
      from: { col: 0, row: 0 },
      to: { col: 0, row: 0 },
    });
    expect(ranges[2].toObject()).toEqual({
      from: { col: 2, row: 1 },
      to: { col: 2, row: 1 },
    });
  });
});
