import { getRestoreDropIndex, getStepDropIndex, type StepAxis } from '../stepMove';

/**
 * Builds an axis of `length` indexes with the hidden ones listed, whose drop index after a visible index steps over
 * the hidden indexes that follow it, as the column plugin does.
 *
 * @param {number} length The number of indexes.
 * @param {number[]} hidden The hidden visual indexes.
 * @returns {StepAxis}
 */
function axisOf(length: number, hidden: number[] = []): StepAxis {
  const isHidden = (index: number) => hidden.includes(index);

  return {
    length,
    isHidden,
    dropIndexAfter(index) {
      let dropIndex = index + 1;

      while (dropIndex < length && isHidden(dropIndex)) {
        dropIndex += 1;
      }

      return dropIndex;
    },
  };
}

describe('getStepDropIndex', () => {
  it('drops a block in front of the previous index when it moves back', () => {
    expect(getStepDropIndex(2, 2, -1, axisOf(5))).toBe(1);
    expect(getStepDropIndex(2, 3, -1, axisOf(5))).toBe(1);
  });

  it('drops a block after the next index when it moves forward', () => {
    expect(getStepDropIndex(2, 2, 1, axisOf(5))).toBe(4);
    expect(getStepDropIndex(1, 2, 1, axisOf(5))).toBe(4);
  });

  it('returns null at the edges', () => {
    expect(getStepDropIndex(0, 0, -1, axisOf(5))).toBeNull();
    expect(getStepDropIndex(4, 4, 1, axisOf(5))).toBeNull();
    expect(getStepDropIndex(0, 4, 1, axisOf(5))).toBeNull();
    expect(getStepDropIndex(0, 4, -1, axisOf(5))).toBeNull();
  });

  it('steps over hidden indexes between the block and the index it passes', () => {
    // 0 1(h) 2(h) [3] 4 → in front of 0
    expect(getStepDropIndex(3, 3, -1, axisOf(5, [1, 2]))).toBe(0);
    // [0] 1(h) 2 3(h) 4 → past 2 and the hidden 3, in front of 4
    expect(getStepDropIndex(0, 0, 1, axisOf(5, [1, 3]))).toBe(4);
  });

  it('returns null when only hidden indexes are left in the direction', () => {
    expect(getStepDropIndex(2, 2, -1, axisOf(5, [0, 1]))).toBeNull();
    expect(getStepDropIndex(2, 2, 1, axisOf(5, [3, 4]))).toBeNull();
  });

  it('drops past trailing hidden indexes when the index it passes is the last visible one', () => {
    expect(getStepDropIndex(1, 1, 1, axisOf(5, [3, 4]))).toBe(5);
  });

  it('uses the drop index the axis gives after the passed index', () => {
    const axis = { ...axisOf(5, [3]), dropIndexAfter: (index: number) => index + 1 };

    // The row axis keeps the drop in front of hidden rows in some cases (`getLowerHalfDropIndex()`).
    expect(getStepDropIndex(1, 1, 1, axis)).toBe(3);
  });

  it('returns null for a block outside the axis', () => {
    expect(getStepDropIndex(-1, 0, 1, axisOf(5))).toBeNull();
    expect(getStepDropIndex(3, 5, -1, axisOf(5))).toBeNull();
    expect(getStepDropIndex(3, 2, 1, axisOf(5))).toBeNull();
  });
});

describe('getRestoreDropIndex', () => {
  it('drops a block that moved forward in front of its original start', () => {
    expect(getRestoreDropIndex(3, 1, 2)).toBe(1);
  });

  it('drops a block that moved back past its original end', () => {
    // A block of 2 now at 0, which started at 2: drop index 4 gives the final index 2.
    expect(getRestoreDropIndex(0, 2, 2)).toBe(4);
  });
});
