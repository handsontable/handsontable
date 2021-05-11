/**
 * Registers on the formulas plugin instance.
 *
 * @param {object} pluginInstance The formulas plugin instance.
 */
export const registerAutofillHooks = (pluginInstance) => {
  /**
   * The array of arrays used to check if no values were returned from
   * `beforeAutofill`, other than our own.
   * */
  const sentinel = [[]];

  // Block autofill operation if at least one of the underlying's cell
  // contents cannot be set, e.g. if there's a matrix underneath.
  pluginInstance.addHook('beforeAutofill', (_, __, target) => {
    const width = target.to.col - target.from.col + 1;
    const height = target.to.row - target.from.row + 1;

    const row = target.from.row;
    const col = target.from.col;

    if (
      pluginInstance.engine.isItPossibleToSetCellContents({
        sheet: pluginInstance.engine.getSheetId(pluginInstance.sheetName),
        row,
        col
      }, width, height)
    ) {
      return sentinel;
    }
  });

  pluginInstance.addHook('afterAutofill', (fillData, source, target, direction) => {
    // Check that the `fillData` used for autofill was the same that we
    // returned from `beforeAutofill`. This lets end users override this
    // plugin's autofill with their own behaviors.
    if (fillData !== sentinel) {
      return;
    }

    const sourceSize = {
      width: source.to.col - source.from.col + 1,
      height: source.to.row - source.from.row + 1
    };

    const targetSize = {
      width: target.to.col - target.from.col + 1,
      height: target.to.row - target.from.row + 1
    };

    const sheet = pluginInstance.engine.getSheetId(pluginInstance.sheetName);

    switch (direction) {
      case 'right': {
        const pasteRow = source.from.row;

        for (let pasteCol = target.from.col; pasteCol <= target.to.col; pasteCol += sourceSize.width) {
          const remaining = target.to.col - pasteCol + 1;
          const width = Math.min(sourceSize.width, remaining);

          pluginInstance.engine.copy({
            sheet,
            row: source.from.row,
            col: source.from.col
          }, width, sourceSize.height);

          pluginInstance.engine.paste({
            sheet,
            row: pasteRow,
            col: pasteCol
          });
        }

        break;
      }

      case 'down': {
        const pasteCol = source.from.col;

        for (let pasteRow = target.from.row; pasteRow <= target.to.row; pasteRow += sourceSize.height) {
          const remaining = target.to.row - pasteRow + 1;
          const height = Math.min(sourceSize.height, remaining);

          pluginInstance.engine.copy({
            sheet,
            row: source.from.row,
            col: source.from.col
          }, sourceSize.width, height);

          pluginInstance.engine.paste({
            sheet,
            row: pasteRow,
            col: pasteCol
          });
        }

        break;
      }

      case 'left': {
        const pasteRow = source.from.row;

        for (let pasteCol = target.from.col; pasteCol <= target.to.col; pasteCol++) {
          const offset = targetSize.width % sourceSize.width;
          const copyCol =
            ((sourceSize.width - offset + (pasteCol - target.from.col)) % sourceSize.width) + source.from.col;

          pluginInstance.engine.copy({
            sheet,
            row: source.from.row,
            col: copyCol
          }, 1, sourceSize.height);

          pluginInstance.engine.paste({
            sheet,
            row: pasteRow,
            col: pasteCol
          });
        }

        break;
      }

      case 'up': {
        const pasteCol = source.from.col;

        for (let pasteRow = target.from.row; pasteRow <= target.to.row; pasteRow++) {
          const offset = targetSize.height % sourceSize.height;
          const copyRow =
            ((sourceSize.height - offset + (pasteRow - target.from.row)) % sourceSize.height) + source.from.row;

          pluginInstance.engine.copy({
            sheet,
            row: copyRow,
            col: source.from.col
          }, sourceSize.width, 1);

          pluginInstance.engine.paste({
            sheet,
            row: pasteRow,
            col: pasteCol
          });
        }

        break;
      }

      default: {
        throw new Error('Unexpected direction parameter');
      }
    }
  });
};
