import { getAlignmentClasses } from 'handsontable/plugins/contextMenu/utils';

function createRange(coords) {
  return {
    forAll(callback) {
      coords.forEach(([row, col]) => callback(row, col));
    },
  };
}

describe('contextMenu/utils', () => {
  describe('getAlignmentClasses', () => {
    it('should collect class names into row-indexed arrays', () => {
      const classes = getAlignmentClasses([
        createRange([[0, 1], [0, 2], [1, 0]]),
      ], (row, col) => `${row}:${col}`);

      expect(Object.keys(classes)).toEqual(['0', '1']);
      expect(classes[0][0]).toBeUndefined();
      expect(classes[0][1]).toBe('0:1');
      expect(classes[0][2]).toBe('0:2');
      expect(classes[1][0]).toBe('1:0');
    });

    it('should skip header coordinates', () => {
      const visitedCoords = [];
      const classes = getAlignmentClasses([
        createRange([[-1, 0], [0, -1], [0, 0], [1, 1]]),
      ], (row, col) => {
        visitedCoords.push([row, col]);

        return `${row}:${col}`;
      });

      expect(visitedCoords).toEqual([[0, 0], [1, 1]]);
      expect(Object.keys(classes)).toEqual(['0', '1']);
      expect(classes[0][0]).toBe('0:0');
      expect(classes[1][1]).toBe('1:1');
    });
  });
});
