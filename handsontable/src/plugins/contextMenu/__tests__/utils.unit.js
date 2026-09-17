import {
  checkSelectionConsistency,
  getAlignmentClasses,
  getAlignmentComparatorByClass,
  getSelectionCheckState,
  MENU_ITEM_MIXED,
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

/**
 * A range that stops when the callback returns `false`, as `CellRange#forAll` does. `createRange`
 * above ignores the return value, so a walk that exits early would look like a full walk there.
 *
 * @param {number[][]} coords The coordinates to visit, in order.
 * @returns {object}
 */
function createStoppableRange(coords) {
  return {
    forAll(callback) {
      for (const [row, col] of coords) {
        if (callback(row, col) === false) {
          return;
        }
      }
    },
  };
}

describe('contextMenu/utils', () => {
  describe('getSelectionCheckState', () => {
    const isFlagged = flagged => (row, col) => flagged.some(([r, c]) => r === row && c === col);

    it('should report true when every selected cell matches', () => {
      const ranges = [createStoppableRange([[0, 0], [0, 1], [1, 0]])];

      expect(getSelectionCheckState(ranges, isFlagged([[0, 0], [0, 1], [1, 0]]))).toBe(true);
    });

    it('should report false when no selected cell matches', () => {
      const ranges = [createStoppableRange([[0, 0], [0, 1]])];

      expect(getSelectionCheckState(ranges, isFlagged([]))).toBe(false);
    });

    it('should report mixed when only some selected cells match (DEV-124)', () => {
      // The reported case: one read-only cell inside a range of writable ones. The "at least one"
      // helper answers `true` here, which is the check mark the ticket reports as wrong.
      const ranges = [createStoppableRange([[0, 0], [0, 1], [1, 0], [1, 1]])];
      const comparator = isFlagged([[0, 0]]);

      expect(getSelectionCheckState(ranges, comparator)).toBe(MENU_ITEM_MIXED);
      expect(checkSelectionConsistency(ranges, comparator)).toBe(true);
    });

    it('should report mixed whichever state the walk meets first', () => {
      const ranges = [createStoppableRange([[0, 0], [0, 1], [0, 2]])];

      expect(getSelectionCheckState(ranges, isFlagged([[0, 2]]))).toBe(MENU_ITEM_MIXED);
    });

    it('should report mixed when the two states sit in different selection layers', () => {
      const ranges = [
        createStoppableRange([[0, 0], [0, 1]]),
        createStoppableRange([[5, 5]]),
      ];

      expect(getSelectionCheckState(ranges, isFlagged([[5, 5]]))).toBe(MENU_ITEM_MIXED);
    });

    it('should stop walking as soon as the selection is known to be mixed', () => {
      const visited = [];
      const flagged = isFlagged([[0, 0]]);
      const ranges = [
        createStoppableRange([[0, 0], [0, 1], [0, 2], [0, 3]]),
        createStoppableRange([[1, 0], [1, 1]]),
      ];

      getSelectionCheckState(ranges, (row, col) => {
        visited.push([row, col]);

        return flagged(row, col);
      });

      // The menu draws this on every open, over the whole selection, so a mixed column of 100k rows
      // must not cost 100k meta reads – and the second layer must not be entered at all.
      expect(visited).toEqual([[0, 0], [0, 1]]);
    });

    it('should skip header coordinates, so a header selection is judged by its cells', () => {
      const visited = [];
      const ranges = [createStoppableRange([[-1, 0], [0, -1], [0, 0], [1, 0]])];

      const state = getSelectionCheckState(ranges, (row, col) => {
        visited.push([row, col]);

        return true;
      });

      expect(visited).toEqual([[0, 0], [1, 0]]);
      expect(state).toBe(true);
    });

    it('should leave out the cells the comparator returns null for', () => {
      // `null` is how an item says "this cell does not take part", for a hidden cell under a merged
      // block or, for the comment item, a cell with no comment.
      const answers = { '0:0': true, '0:1': null, '0:2': null, '1:0': false };
      const comparator = (row, col) => answers[`${row}:${col}`];

      const stateOf = coords => getSelectionCheckState([createStoppableRange(coords)], comparator);

      expect(stateOf([[0, 0], [0, 1], [0, 2]])).toBe(true);
      expect(stateOf([[0, 1], [1, 0]])).toBe(false);
      expect(stateOf([[0, 0], [0, 1], [1, 0]])).toBe(MENU_ITEM_MIXED);
    });

    it('should read undefined as a non-match, and only null as "leave out"', () => {
      // A comparator returning an unset `meta.readOnly` gives `undefined` for a writable cell.
      // Skipping it would read one read-only cell beside writable ones as fully read-only.
      const meta = { '0:0': { readOnly: true }, '0:1': {} };
      const comparator = (row, col) => meta[`${row}:${col}`].readOnly;

      expect(getSelectionCheckState([createStoppableRange([[0, 0], [0, 1]])], comparator)).toBe(MENU_ITEM_MIXED);
    });

    it('should report false when the comparator leaves out every cell', () => {
      expect(getSelectionCheckState([createStoppableRange([[0, 0], [0, 1]])], () => null)).toBe(false);
    });

    it('should report false for a selection holding no cell at all', () => {
      expect(getSelectionCheckState([], () => true)).toBe(false);
      expect(getSelectionCheckState([createStoppableRange([[-1, -1]])], () => true)).toBe(false);
      expect(getSelectionCheckState(undefined, () => true)).toBe(false);
    });
  });

  describe('checkSelectionConsistency', () => {
    it('should keep answering "at least one" for existing callers', () => {
      // Legacy export. It stays importable and unchanged, because the module ships a declaration file
      // that `moduleResolution: node` resolves whatever the `exports` map says.
      const ranges = [createStoppableRange([[0, 0], [0, 1]])];

      expect(checkSelectionConsistency(ranges, (row, col) => col === 1)).toBe(true);
      expect(checkSelectionConsistency(ranges, () => false)).toBe(false);
    });
  });

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

    it('should drop a competing horizontal alignment even when the picked one is already there', () => {
      expect(prepareHorizontalAlignClass('htLeft htCenter', 'htCenter')).toBe('htCenter');
      expect(prepareHorizontalAlignClass('class_name htLeft htRight', 'htRight')).toBe('class_name htRight');
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

    it('should drop a competing vertical alignment even when the picked one is already there', () => {
      expect(prepareVerticalAlignClass('htTop htMiddle', 'htMiddle')).toBe('htMiddle');
      expect(prepareVerticalAlignClass('class_name htTop htBottom', 'htBottom')).toBe('class_name htBottom');
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

    it('should not emit the alignment twice when it is passed to the other axis helper', () => {
      // Not reachable through `align()`, but both helpers are exported and called directly here.
      expect(prepareVerticalAlignClass('htLeft', 'htLeft')).toBe('htLeft');
      expect(prepareHorizontalAlignClass('class_name htTop', 'htTop')).toBe('class_name htTop');
    });

    it('should not report an alignment for a custom class that merely contains its name', () => {
      const hotMock = className => ({ getCellMetaTransient: () => ({ className }) });

      expect(getAlignmentComparatorByClass('htLeft').call(hotMock('htLeft'), 0, 0)).toBe(true);
      expect(getAlignmentComparatorByClass('htLeft').call(hotMock(['htLeft']), 0, 0)).toBe(true);
      expect(getAlignmentComparatorByClass('htLeft').call(hotMock('htLeftPanel'), 0, 0)).toBe(false);
      expect(getAlignmentComparatorByClass('htTop').call(hotMock('htTopBar htBottom'), 0, 0)).toBe(false);
      expect(getAlignmentComparatorByClass('htLeft').call(hotMock(undefined), 0, 0)).toBe(false);
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
