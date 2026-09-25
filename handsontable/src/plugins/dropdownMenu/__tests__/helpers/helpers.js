/**
 * Gets the offset of the dropdown menu button icon.
 *
 * @param {number} row The visual row index.
 * @param {number} column The visual column index.
 * @returns {{ left: number, top: number }}
 */
export function getDropdownMenuButtonIconOffset(row, column) {
  // DEV-3003: the glyph is a real `<i class="ht-icon ht-icon-menu">` child of `.changeType`
  // (`button.appendChild(createIcon(this.hot, 'menu'))` in `dropdownMenu.ts`), not a `::before`
  // pseudo-element on the button - measure its own box directly instead of re-deriving it by
  // centering a `::before` size inside the button's rect.
  const button = getCell(row, column, true).querySelector('.changeType');
  const icon = button.querySelector('.ht-icon');
  const rect = icon.getBoundingClientRect();
  const win = button.ownerDocument.defaultView;

  return {
    left: rect.left + win.scrollX,
    top: rect.top + win.scrollY,
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
  const icon = button.querySelector('.ht-icon');

  return icon.getBoundingClientRect().width;
}
