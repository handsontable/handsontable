import { isObjectEqual } from '../../helpers/object';

/**
 * Creates hooks for autofill.
 *
 * @param {object} pluginInstance The formulas plugin instance.
 * @returns {object}
 */
export const createAutofillHooks = (pluginInstance) => {
  // Blocks the autofill operation if at least one of the underlying's cell
  // contents cannot be set, e.g. if there's a matrix underneath.
  const beforeAutofill = (_, __, target) => {
    const width = target.getWidth();
    const height = target.getHeight();

    const row = target.from.row;
    const col = target.from.col;

    if (
      !pluginInstance.engine.isItPossibleToSetCellContents({
        sheet: pluginInstance.sheetId,
        row,
        col
      }, width, height)
    ) {
      return false;
    }
  };

  const afterAutofill = (fillData, source, target, direction, hasFillDataChanged) => {
    // Skip fill handle process when the fill data was changed by user.
    if (hasFillDataChanged) {
      return;
    }

    const sourceSize = {
      width: source.getWidth(),
      height: source.getHeight()
    };

    const targetSize = {
      width: target.getWidth(),
      height: target.getHeight()
    };

    const operations = [];

    switch (direction) {
      case 'right': {
        const pasteRow = source.from.row;

        for (let pasteCol = target.from.col; pasteCol <= target.to.col; pasteCol += sourceSize.width) {
          const remaining = target.to.col - pasteCol + 1;
          const width = Math.min(sourceSize.width, remaining);

          operations.push({
            copy: {
              row: source.from.row,
              col: source.from.col,
              width,
              height: sourceSize.height
            },
            paste: {
              row: pasteRow,
              col: pasteCol
            }
          });
        }

        break;
      }

      case 'down': {
        const pasteCol = source.from.col;

        for (let pasteRow = target.from.row; pasteRow <= target.to.row; pasteRow += sourceSize.height) {
          const remaining = target.to.row - pasteRow + 1;
          const height = Math.min(sourceSize.height, remaining);

          operations.push({
            copy: {
              row: source.from.row,
              col: source.from.col,
              width: sourceSize.width,
              height
            },
            paste: {
              row: pasteRow,
              col: pasteCol
            }
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

          operations.push({
            copy: {
              row: source.from.row,
              col: copyCol,
              width: 1,
              height: sourceSize.height
            },
            paste: {
              row: pasteRow,
              col: pasteCol
            }
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

          operations.push({
            copy: {
              row: copyRow,
              col: source.from.col,
              width: sourceSize.width,
              height: 1
            },
            paste: {
              row: pasteRow,
              col: pasteCol
            }
          });
        }

        break;
      }

      default: {
        throw new Error('Unexpected direction parameter');
      }
    }

    const sheet = pluginInstance.sheetId;

    operations.reduce((previousCopy, operation) => {
      if (!isObjectEqual(previousCopy, operation.copy)) {
        pluginInstance.engine.copy({
          sheet,
          row: operation.copy.row,
          col: operation.copy.col
        }, operation.copy.width, operation.copy.height);
      }

      pluginInstance.engine.paste({
        sheet,
        row: operation.paste.row,
        col: operation.paste.col
      });

      return operation.copy;
    }, {});
  };

  return {
    beforeAutofill,
    afterAutofill
  };
};
