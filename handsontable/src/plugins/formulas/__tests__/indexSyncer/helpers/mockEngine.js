/**
 * Builds an engine stub that enforces the order contract HyperFormula enforces.
 *
 * `CrudOperations#mappingFromOrder` rejects an order whose length differs from the sheet's size along
 * that axis, and `validateRowOrColumnMapping` then rejects entries that are not positions inside the
 * sheet or that do not form a permutation of them. A stub that only records the call cannot fail on
 * either class of bug, so both checks are reproduced here with the engine's own wording.
 *
 * @param {{width: number, height: number}} [initialDimensions] The sheet's starting dimensions.
 * @returns {object} The stub, carrying the recorded calls and its mutable `dimensions`.
 */
export function createMockEngine(initialDimensions = { width: 4, height: 4 }) {
  const calls = { setRowOrder: [], setColumnOrder: [] };
  const dimensions = { ...initialDimensions };

  const validate = (order, size, axisLabel, sizeLabel) => {
    if (order.length !== size) {
      throw new Error(`Invalid arguments, expected number of ${axisLabel} provided to be sheet ${sizeLabel}.`);
    }

    const seen = new Set();

    order.forEach((target) => {
      if (!Number.isInteger(target) || target < 0 || target >= size) {
        throw new Error(
          `Invalid arguments, expected target ${axisLabel} numbers to be nonnegative integers and less than sheet ${
            sizeLabel}.`);
      }

      seen.add(target);
    });

    if (seen.size !== order.length) {
      throw new Error(`Invalid arguments, expected target ${axisLabel} numbers to be permutation of source ${
        axisLabel} numbers.`);
    }
  };

  // What the sheet holds, as labels the tests choose — so a test can assert where the engine's own rows
  // and columns ended up, not only which array was handed over.
  const held = { rows: [], columns: [] };

  const apply = (axis, transformation) => {
    const current = held[axis];

    if (current.length !== transformation.length) {
      return;
    }

    const reordered = new Array(transformation.length);

    transformation.forEach((rank, index) => {
      reordered[rank] = current[index];
    });

    held[axis] = reordered;
  };

  return {
    calls,
    dimensions,
    held,
    setRowOrder: (sheetId, transformation) => {
      validate(transformation, dimensions.height, 'rows', 'height');
      apply('rows', transformation);

      calls.setRowOrder.push({ sheetId, transformation });
    },
    setColumnOrder: (sheetId, transformation) => {
      validate(transformation, dimensions.width, 'columns', 'width');
      apply('columns', transformation);

      calls.setColumnOrder.push({ sheetId, transformation });
    },
    getSheetDimensions: () => ({ ...dimensions }),
    batch: callback => callback(),
  };
}
