/**
 * Calculate the scale ratio applied to the element in the horizontal/vertical axis.
 *
 * @param {HTMLElement} element The element to measure.
 * @param {'horizontal'|'vertical'} [axis='horizontal'] The axis to inspect.
 * @returns {number}
 */
export function getElementScaleFactor(element, axis = 'horizontal') {
  const boundingRect = element.getBoundingClientRect();
  const transformedSize = axis === 'vertical' ? boundingRect.height : boundingRect.width;
  const unscaledSize = axis === 'vertical' ? element.offsetHeight : element.offsetWidth;

  if (
    !Number.isFinite(transformedSize) ||
    !Number.isFinite(unscaledSize) ||
    transformedSize <= 0 ||
    unscaledSize <= 0
  ) {
    return 1;
  }

  // Table headers and border-collapse can make `getBoundingClientRect()` one CSS pixel wider/taller
  // than `offsetWidth`/`offsetHeight` with no CSS transform. Treat that as unscaled so resize deltas
  // are not short by one layout pixel after `normalizeVisualDelta`.
  if (transformedSize >= unscaledSize && transformedSize - unscaledSize <= 1) {
    return 1;
  }

  const scaleFactor = transformedSize / unscaledSize;

  return Number.isFinite(scaleFactor) && scaleFactor > 0 ? scaleFactor : 1;
}

/**
 * Converts visual pointer delta into unscaled delta.
 *
 * @param {number} visualDelta Pointer delta in visual coordinates.
 * @param {number} scaleFactor Element scale factor.
 * @returns {number}
 */
export function normalizeVisualDelta(visualDelta, scaleFactor) {
  if (!Number.isFinite(scaleFactor) || scaleFactor <= 0) {
    return visualDelta;
  }

  return Math.round(visualDelta / scaleFactor);
}
