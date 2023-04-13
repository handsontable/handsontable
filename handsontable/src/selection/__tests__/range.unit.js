import { CellCoords, CellRange } from 'walkontable';
import SelectionRange from '../range';

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
        new CellRange(new CellCoords(4, 4))
      );

      selectionRange.set(new CellCoords(0, 0));
      selectionRange.set(new CellCoords(1, 2));

      expect(selectionRange.ranges.length).toBe(1);
      expect(selectionRange.ranges[0].toObject()).toEqual({
        from: { col: 2, row: 1 },
        to: { col: 2, row: 1 },
      });
    });
  });

  describe('.add', () => {
    it('should append new CellRange to the ranges array', () => {
      selectionRange.add(new CellCoords(0, 0));
      selectionRange.add(new CellCoords(0, 0));
      selectionRange.add(new CellCoords(1, 2));

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
        new CellRange(new CellCoords(4, 4)),
        new CellRange(new CellCoords(0, 0)),
        new CellRange(new CellCoords(1, 2))
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
        new CellRange(new CellCoords(4, 4)),
        new CellRange(new CellCoords(0, 0)),
        new CellRange(new CellCoords(1, 2))
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
        new CellRange(new CellCoords(4, 4)),
        new CellRange(new CellCoords(0, 0)),
        new CellRange(new CellCoords(1, 2))
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
        new CellRange(new CellCoords(1, 1), new CellCoords(1, 1), new CellCoords(3, 3)),
        new CellRange(new CellCoords(11, 11), new CellCoords(11, 11), new CellCoords(11, 11))
      );

      expect(selectionRange.includes(new CellCoords(1, 2))).toBe(true);
      expect(selectionRange.includes(new CellCoords(1, 3))).toBe(true);
      expect(selectionRange.includes(new CellCoords(11, 11))).toBe(true);
    });

    it('should return `false` if the coords doesn\'t match the selection range', () => {
      selectionRange.ranges.push(
        new CellRange(new CellCoords(1, 1), new CellCoords(1, 1), new CellCoords(3, 3)),
        new CellRange(new CellCoords(11, 11), new CellCoords(11, 11), new CellCoords(11, 11))
      );

      expect(selectionRange.includes(new CellCoords(1, 4))).toBe(false);
      expect(selectionRange.includes(new CellCoords(0, 0))).toBe(false);
      expect(selectionRange.includes(new CellCoords(11, 12))).toBe(false);
    });
  });

  describe('.clear', () => {
    it('should reset the ranges collection', () => {
      selectionRange.ranges.push(
        new CellRange(new CellCoords(4, 4)),
        new CellRange(new CellCoords(0, 0)),
        new CellRange(new CellCoords(1, 2))
      );

      selectionRange.clear();

      expect(selectionRange.ranges.length).toBe(0);
    });
  });

  describe('.size', () => {
    it('should return the length/size of the collected ranges', () => {
      selectionRange.ranges.push(
        new CellRange(new CellCoords(4, 4)),
        new CellRange(new CellCoords(0, 0)),
        new CellRange(new CellCoords(1, 2))
      );

      expect(selectionRange.size()).toBe(3);
    });
  });

  describe('.peekByIndex', () => {
    it('should return the CellRange object from the beginning based on the index argument passed to the method', () => {
      selectionRange.ranges.push(
        new CellRange(new CellCoords(4, 4)),
        new CellRange(new CellCoords(0, 0)),
        new CellRange(new CellCoords(1, 2))
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
      new CellRange(new CellCoords(4, 4)),
      new CellRange(new CellCoords(0, 0)),
      new CellRange(new CellCoords(1, 2))
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
