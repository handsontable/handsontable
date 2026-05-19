/**
 * Gets the offset of the dropdown menu button icon.
 *
 * @param {number} row The visual row index.
 * @param {number} column The visual column index.
 * @returns {{ left: number, top: number }}
 */
export function getDropdownMenuButtonIconOffset(row, column) {
  const button = getCell(row, column, true).querySelector('.changeType');
  const rect = button.getBoundingClientRect();
  const beforeStyle = getComputedStyle(button, '::before');
  const iconSize = Number.parseFloat(beforeStyle.width, 10);
  const win = button.ownerDocument.defaultView;
  const iconLeft = rect.left + ((rect.width - iconSize) / 2);
  const iconTop = rect.top + ((rect.height - iconSize) / 2);

  return {
    left: iconLeft + win.scrollX,
    top: iconTop + win.scrollY,
  };
}

/**
 * Gets the width of the dropdown menu button icon.
 *
 * @param {number} row The visual row index.
 * @param {number} column The visual column index.
 * @returns {number}
 */
export function getDropdownMenuButtonIconWidth(row, column) {
  const button = getCell(row, column, true).querySelector('.changeType');
  const beforeStyle = getComputedStyle(button, '::before');
  const iconSize = Number.parseFloat(beforeStyle.width, 10);

  return iconSize;
}
