export const DEFAULT_BORDER = { color: '#000', width: 1 };
export const GREEN_BORDER = { color: 'green', width: 1 };
export const GREEN_THICK_BORDER = { color: 'green', width: 2 };
export const RED_BORDER = { color: 'red', width: 2 };
export const MAGENTA_BORDER = { color: 'magenta', width: 2 };
export const BLUE_BORDER = { color: 'blue', width: 2 };
export const ORANGE_BORDER = { color: 'orange', width: 2 };
export const YELLOW_BORDER = { color: 'yellow', width: 2 };
export const EMPTY = { hide: true };

export const CUSTOM_BORDER_SELECTOR = '.wtBorder:not(.fill, .current, .area)';

/**
 * Returns number of custom borders in DOM. There are 5 borders per
 * cell (top, left, bottom right, corner), some of which are hidden
 * TODO this seems redundant that we always render borders that are not visible.
 *
 * @returns {number}
 */
export function countCustomBorders() {
  return $(CUSTOM_BORDER_SELECTOR).length;
}

/**
 * Returns number of visible custom borders in DOM.
 *
 * @returns {number}
 */
export function countVisibleCustomBorders() {
  return $(`${CUSTOM_BORDER_SELECTOR}:visible`).length;
}

/**
 * @param {number} numRows The number of rows to generate.
 * @returns {{row: number, col: number, top: any}[]}
 */
export function generateCustomBordersForAllRows(numRows) {
  const bordersConfig = [];

  for (let i = 0; i < numRows; i++) {
    const cellBorder = {
      row: i,
      col: 0,
      top: GREEN_BORDER
    };

    bordersConfig.push(cellBorder);
  }

  return bordersConfig;
}
