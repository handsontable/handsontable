import {
  getAlignmentClasses,
  prepareHorizontalAlignClass,
  prepareVerticalAlignClass,
} from 'handsontable/plugins/contextMenu/utils';

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

  describe('prepareHorizontalAlignClass', () => {
    it('should add the alignment class to a cell that has none', () => {
      expect(prepareHorizontalAlignClass('', 'htLeft')).toBe('htLeft');
      expect(prepareHorizontalAlignClass('class_name', 'htRight')).toBe('class_name htRight');
    });

    it('should replace the previous horizontal alignment and keep the other classes', () => {
      expect(prepareHorizontalAlignClass('class_name htLeft', 'htRight')).toBe('class_name htRight');
      expect(prepareHorizontalAlignClass('class_name htCenter htMiddle', 'htJustify'))
        .toBe('class_name htMiddle htJustify');
    });

    it('should not touch the vertical alignment class', () => {
      expect(prepareHorizontalAlignClass('htMiddle', 'htLeft')).toBe('htMiddle htLeft');
    });

    it('should be idempotent when the same alignment is applied twice', () => {
      expect(prepareHorizontalAlignClass('class_name htRight', 'htRight')).toBe('class_name htRight');
    });

    it('should keep a custom class that merely contains an alignment class name (#7122)', () => {
      expect(prepareHorizontalAlignClass('htLeftPanel', 'htRight')).toBe('htLeftPanel htRight');
    });

    it('should accept an array `className`, as the documented settings allow (#7122)', () => {
      expect(prepareHorizontalAlignClass(['class_name', 'htLeft'], 'htRight')).toBe('class_name htRight');
    });
  });

  describe('prepareVerticalAlignClass', () => {
    it('should add the alignment class to a cell that has none', () => {
      expect(prepareVerticalAlignClass('', 'htTop')).toBe('htTop');
      expect(prepareVerticalAlignClass('class_name', 'htMiddle')).toBe('class_name htMiddle');
    });

    it('should replace the previous vertical alignment and keep the other classes', () => {
      expect(prepareVerticalAlignClass('class_name htTop', 'htBottom')).toBe('class_name htBottom');
      expect(prepareVerticalAlignClass('class_name htMiddle htRight', 'htTop')).toBe('class_name htRight htTop');
    });

    it('should not touch the horizontal alignment class', () => {
      expect(prepareVerticalAlignClass('htRight', 'htTop')).toBe('htRight htTop');
    });

    it('should be idempotent when the same alignment is applied twice', () => {
      expect(prepareVerticalAlignClass('class_name htTop', 'htTop')).toBe('class_name htTop');
    });

    it('should keep a custom class that merely contains an alignment class name (#7122)', () => {
      expect(prepareVerticalAlignClass('htTopBar', 'htBottom')).toBe('htTopBar htBottom');
    });

    it('should accept an array `className`, as the documented settings allow (#7122)', () => {
      expect(prepareVerticalAlignClass(['class_name', 'htTop'], 'htBottom')).toBe('class_name htBottom');
    });
  });

  describe('alignment class names, issue #7122', () => {
    it('should keep the space between the class names through the reported sequence', () => {
      // Right -> Middle -> Justify, on a cell that already has a custom class.
      const afterRight = prepareHorizontalAlignClass('class_name', 'htRight');
      const afterMiddle = prepareVerticalAlignClass(afterRight, 'htMiddle');
      const afterJustify = prepareHorizontalAlignClass(afterMiddle, 'htJustify');

      expect(afterRight).toBe('class_name htRight');
      expect(afterMiddle).toBe('class_name htRight htMiddle');
      // Used to return 'class_namehtMiddle htJustify', losing both `class_name` and `htMiddle`.
      expect(afterJustify).toBe('class_name htMiddle htJustify');
    });

    it('should keep the space between the class names through the mirrored sequence', () => {
      // Middle -> Right -> Top, the same defect on the vertical helper.
      const afterMiddle = prepareVerticalAlignClass('class_name', 'htMiddle');
      const afterRight = prepareHorizontalAlignClass(afterMiddle, 'htRight');
      const afterTop = prepareVerticalAlignClass(afterRight, 'htTop');

      expect(afterMiddle).toBe('class_name htMiddle');
      expect(afterRight).toBe('class_name htMiddle htRight');
      // Used to return 'class_namehtRight htTop'.
      expect(afterTop).toBe('class_name htRight htTop');
    });

    it('should never emit doubled, leading or trailing spaces', () => {
      const results = [
        prepareHorizontalAlignClass('htLeft', 'htRight'),
        prepareHorizontalAlignClass('class_name htLeft', 'htRight'),
        prepareVerticalAlignClass('htTop', 'htBottom'),
        prepareVerticalAlignClass('class_name  htTop', 'htBottom'),
      ];

      results.forEach((result) => {
        expect(result).not.toMatch(/ {2}/);
        expect(result).toBe(result.trim());
      });
    });
  });
});
