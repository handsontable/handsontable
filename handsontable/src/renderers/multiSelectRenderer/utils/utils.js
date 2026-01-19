import { isKeyValueObject } from '../../../helpers/object';
import { A11Y_HIDDEN } from '../../../helpers/a11y';
import { EDITOR_CONTROLLER_CLASS } from '../../../helpers/mixed';
import { addClass } from '../../../helpers/dom/element';

export const CHIP_CLASS = 'ht-multi-select-chip';
export const CHIP_REMOVE_CLASS = 'ht-multi-select-chip-remove';

const CHIP_LABEL_CLASS = 'ht-multi-select-chip-label';
const OVERFLOW_INDICATOR_CLASS = 'ht-multi-select-overflow';

/**
 * Extracts the property from a value item - default to the item itself.
 *
 * @param {string|object} item The value item (string or object with key/value).
 * @param {string} property The property to extract.
 * @returns {string} The property value.
 */
export function getItemProperty(item, property) {
  return isKeyValueObject(item) ? item[property] : item;
}

/**
 * Parses a stringified value if necessary.
 *
 * @param {*} value The value to parse.
 * @returns {Array} The parsed array of values.
 */
export function parseValue(value) {
  if (value === null || value === undefined || value === '') {
    return [];
  }

  if (Array.isArray(value)) {
    return value;
  }

  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);

      return Array.isArray(parsed) ? parsed : [parsed];
    } catch {

      return value.trim() ? [value] : [];
    }
  }

  return [value];
}

/**
 * Creates a chip element for a single value.
 *
 * @param {Document} rootDocument The document object.
 * @param {string|object} item The value item.
 * @param {boolean} isAriaEnabled Whether ARIA is enabled.
 * @param {number} row The row index.
 * @param {number} prop The property index.
 * @returns {HTMLElement} The chip element.
 */
export function createChipElement(rootDocument, item, isAriaEnabled, row, prop) {
  const chip = rootDocument.createElement('span');

  addClass(chip, CHIP_CLASS);
  chip.dataset.row = row;
  chip.dataset.prop = prop;

  const label = rootDocument.createElement('span');

  addClass(label, CHIP_LABEL_CLASS);
  label.textContent = getItemProperty(item, 'value');
  chip.appendChild(label);

  const removeBtn = rootDocument.createElement('span');

  addClass(removeBtn, `${CHIP_REMOVE_CLASS} ${EDITOR_CONTROLLER_CLASS}`);

  if (isAriaEnabled) {
    removeBtn.setAttribute(...A11Y_HIDDEN());
  }

  chip.dataset.key = getItemProperty(item, 'key');
  chip.appendChild(removeBtn);

  return chip;
}

/**
 * Creates an overflow indicator element.
 *
 * @param {Document} rootDocument The document object.
 * @param {number} count The number of hidden items.
 * @returns {HTMLElement} The overflow indicator element.
 */
export function createOverflowIndicator(rootDocument, count) {
  const indicator = rootDocument.createElement('span');

  addClass(indicator, OVERFLOW_INDICATOR_CLASS);
  indicator.textContent = `+${count}`;

  return indicator;
}

/**
 * Recalculates which chips are visible and updates the overflow indicator.
 * This function is called both on initial render and when container size changes.
 *
 * @param {number} columnWidth The width of the column.
 * @param {HTMLElement} chipsContainer The container holding the chips.
 * @param {Document} rootDocument The document object.
 */
function recalculateChipsVisibility(columnWidth, chipsContainer, rootDocument) {
  const containerWidth = columnWidth;
  const chips = chipsContainer.querySelectorAll(`.${CHIP_CLASS}`);

  for (let i = 0; i < chips.length; i++) {
    chips[i].style.display = '';
  }

  if (containerWidth === null || chips.length === 0) {
    return;
  }

  let indicator = chipsContainer.querySelector(`.${OVERFLOW_INDICATOR_CLASS}`);

  if (!indicator) {
    indicator = createOverflowIndicator(rootDocument, chips.length);
    indicator.style.visibility = 'hidden';
    chipsContainer.appendChild(indicator);

  } else {
    indicator.style.display = '';
    indicator.style.visibility = 'hidden';
  }

  const containerStyles = rootDocument.defaultView.getComputedStyle(chipsContainer);
  const gap = parseFloat(containerStyles.gap) || 0;
  const indicatorWidth = indicator.offsetWidth;
  let totalWidth = 0;
  let visibleCount = 0;

  for (let i = 0; i < chips.length; i++) {
    const chipWidth = chips[i].offsetWidth;
    const chipGap = i < chips.length - 1 ? gap : 0;
    const nextWidth = totalWidth + chipWidth + chipGap;
    const needsIndicatorSpace = i < chips.length - 1;
    const availableWidth = containerWidth - (needsIndicatorSpace ? indicatorWidth + gap : 0);

    if (nextWidth <= availableWidth) {
      totalWidth = nextWidth;
      visibleCount += 1;

    } else {
      break;
    }
  }

  const hiddenCount = chips.length - visibleCount;

  if (hiddenCount > 0) {
    for (let i = visibleCount; i < chips.length; i++) {
      chips[i].style.display = 'none';
    }

    indicator.textContent = `+${hiddenCount}`;
    indicator.style.visibility = 'visible';

  } else {
    indicator.style.display = 'none';
  }
}
/**
 * Handles overflow by hiding chips that don't fit and showing a "+N" indicator.
 * Uses ResizeObserver to recalculate when container dimensions change.
 *
 * @param {number} columnWidth The width of the column.
 * @param {HTMLElement} chipsContainer The container holding the chips.
 * @param {Document} rootDocument The document object.
 */
export function handleChipsOverflow(columnWidth, chipsContainer, rootDocument) {
  recalculateChipsVisibility(columnWidth, chipsContainer, rootDocument);
}

/**
 * Removes a value from an array by its key.
 *
 * @param {Array} array The source array.
 * @param {string} keyToRemove The key of the item to remove.
 * @returns {Array} A new array with the item removed.
 */
export function removeValueByKey(array, keyToRemove) {
  return array.filter((item) => {
    return getItemProperty(item, 'key') !== keyToRemove;
  });
}
