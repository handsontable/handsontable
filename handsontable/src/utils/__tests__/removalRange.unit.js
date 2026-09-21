import { clipRemovalRange } from '../removalRange';

describe('clipRemovalRange', () => {
  // `Core#alter()` and the UndoRedo `canUndo()` / `canRedo()` checks both read this one function. They used
  // to hold the rule separately, and an undo stack that disagrees with `alter()` about whether a removal
  // changes the grid steps HyperFormula for a removal that never happens.

  it('keeps a removal that lies inside the grid unchanged', () => {
    expect(clipRemovalRange(2, 3, 10)).toEqual({ start: 2, amount: 3 });
  });

  it('keeps the amount of a removal that runs past the last item, leaving the overrun to the removal', () => {
    expect(clipRemovalRange(8, 5, 10)).toEqual({ start: 8, amount: 5 });
  });

  it('keeps a removal that starts at the last item', () => {
    expect(clipRemovalRange(9, 1, 10)).toEqual({ start: 9, amount: 1 });
  });

  it('names nothing when the removal starts at the item count', () => {
    expect(clipRemovalRange(10, 1, 10)).toBeNull();
  });

  it('names nothing when the removal starts past the last item', () => {
    expect(clipRemovalRange(12, 10, 10)).toBeNull();
  });

  it('clips a removal that starts above the first item to the part inside the grid', () => {
    // Items -2 and -1 do not exist, so only 0 and 1 remain of the four named.
    expect(clipRemovalRange(-2, 4, 10)).toEqual({ start: 0, amount: 2 });
  });

  it('names nothing when the whole removal lies above the first item', () => {
    expect(clipRemovalRange(-2, 1, 10)).toBeNull();
    expect(clipRemovalRange(-2, 2, 10)).toBeNull();
  });

  it('names nothing in a grid with no items, even after clipping a start above the first item', () => {
    // Clipping moves the start to 0, which does not exist in an empty grid either. Checking the count
    // before the clip let this through, and the removal fired its hooks with a `NaN` index.
    expect(clipRemovalRange(-2, 4, 0)).toBeNull();
    expect(clipRemovalRange(0, 1, 0)).toBeNull();
  });
});
