/**
 * Registers on the formulas plugin instance.
 *
 * @param {object} pluginInstance The formulas plugin instance.
 */
export const registerAutofillHooks = (pluginInstance) => {
  const lastAutofillSource = { value: undefined };

  // Block autofill operation if at least one of the underlying's cell
  // contents cannot be set, e.g. if there's a matrix underneath.
  pluginInstance.addHook('beforeAutofill', (start, end) => {
    const width = Math.abs(start.col - end.col) + 1;
    const height = Math.abs(start.row - end.row) + 1;

    const row = Math.min(start.row, end.row);
    const col = Math.min(start.col, end.col);

    if (
      !pluginInstance.hyperformula.isItPossibleToSetCellContents({
        sheet: pluginInstance.hyperformula.getSheetId(pluginInstance.sheetName),
        row,
        col
      }, width, height)
    ) {
      return false;
    }
  });

  // Abuse the `modifyAutofillRange` hook to get the autofill start coordinates.
  pluginInstance.addHook('modifyAutofillRange', (_, entireArea) => {
    const [startRow, startCol, endRow, endCol] = entireArea;

    lastAutofillSource.value = {
      start: {
        row: startRow,
        col: startCol
      },
      end: {
        row: endRow,
        col: endCol
      }
    };
  });

  // Abuse pluginInstance hook to easily figure out the direction of the autofill
  pluginInstance.addHook('beforeAutofillInsidePopulate', (index, direction, _input, _deltas, _, selected) => {
    const autofillTargetSize = {
      width: selected.col,
      height: selected.row
    };

    const autofillSourceSize = {
      width: Math.abs(lastAutofillSource.value.start.col - lastAutofillSource.value.end.col) + 1,
      height: Math.abs(lastAutofillSource.value.start.row - lastAutofillSource.value.end.row) + 1
    };

    const paste = (
      // The cell we're copy'ing to let HyperFormula adjust the references properly
      sourceCellCoordinates,

      // The cell we're pasting into
      targetCellCoordinates
    ) => {
      pluginInstance.hyperformula.copy({
        sheet: pluginInstance.hyperformula.getSheetId(pluginInstance.sheetName),
        row: sourceCellCoordinates.row,
        col: sourceCellCoordinates.col
      }, 1, 1);

      const [{ address }] = pluginInstance.hyperformula.paste({
        sheet: pluginInstance.hyperformula.getSheetId(pluginInstance.sheetName),
        row: targetCellCoordinates.row,
        col: targetCellCoordinates.col
      });

      const value = pluginInstance.hyperformula.getCellSerialized(address);

      return { value };
    };

    // Pretty much reimplements the logic from `src/plugins/autofill/autofill.js#fillIn`
    switch (direction) {
      case 'right': {
        const targetCellCoordinates = {
          row: lastAutofillSource.value.start.row + index.row,
          col: lastAutofillSource.value.start.col + index.col + autofillSourceSize.width
        };

        const sourceCellCoordinates = {
          row: lastAutofillSource.value.start.row + index.row,
          col: (index.col % autofillSourceSize.width) + lastAutofillSource.value.start.col
        };

        return paste(sourceCellCoordinates, targetCellCoordinates);
      }

      case 'left': {
        const targetCellCoordinates = {
          row: lastAutofillSource.value.start.row + index.row,
          col: lastAutofillSource.value.start.col + index.col - autofillTargetSize.width
        };

        const fillOffset = autofillTargetSize.width % autofillSourceSize.width;

        const sourceCellCoordinates = {
          row: lastAutofillSource.value.start.row + index.row,
          col:
          ((autofillSourceSize.width - fillOffset + index.col) %
            autofillSourceSize.width) +
          lastAutofillSource.value.start.col,
        };

        return paste(sourceCellCoordinates, targetCellCoordinates);
      }

      case 'down': {
        const targetCellCoordinates = {
          row: lastAutofillSource.value.start.row + index.row + autofillSourceSize.height,
          col: lastAutofillSource.value.start.col + index.col
        };

        const sourceCellCoordinates = {
          row: (index.row % autofillSourceSize.height) + lastAutofillSource.value.start.row,
          col: lastAutofillSource.value.start.col + index.col
        };

        return paste(sourceCellCoordinates, targetCellCoordinates);
      }

      case 'up': {
        const targetCellCoordinates = {
          row: lastAutofillSource.value.start.row + index.row - autofillTargetSize.height,
          col: lastAutofillSource.value.start.col + index.col
        };

        const fillOffset = autofillTargetSize.height % autofillSourceSize.height;

        const sourceCellCoordinates = {
          row:
          ((autofillSourceSize.height - fillOffset + index.row) %
            autofillSourceSize.height) +
          lastAutofillSource.value.start.row,
          col: lastAutofillSource.value.start.col + index.col,
        };

        return paste(sourceCellCoordinates, targetCellCoordinates);
      }

      default: {
        throw new Error('Unexpected direction parameter');
      }
    }
  });
};
