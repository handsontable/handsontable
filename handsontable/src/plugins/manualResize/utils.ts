/**
 * Calculate the scale ratio applied to the element in the horizontal/vertical axis.
 *
 * @param {HTMLElement} element The element to measure.
 * @param {'horizontal'|'vertical'} [axis='horizontal'] The axis to inspect.
 * @returns {number}
 */
export function getElementScaleFactor(element: HTMLElement, axis: 'horizontal' | 'vertical' = 'horizontal'): number {
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
export function normalizeVisualDelta(visualDelta: number, scaleFactor: number): number {
  if (!Number.isFinite(scaleFactor) || scaleFactor <= 0) {
    return visualDelta;
  }

  return Math.round(visualDelta / scaleFactor);
}

/**
 * Checks if the resize handle positioning should be skipped.
 *
 * @param {{ parentNode: ParentNode | null }} header The header element to position the handle against.
 * @param {number} resizeClickCount The resize handle click count.
 * @returns {boolean}
 */
export function shouldSkipResizeHandlePositioning(
  header: { parentNode: ParentNode | null },
  resizeClickCount: number,
): boolean {
  return !header.parentNode || resizeClickCount > 1;
}

/**
 * Checks if resize handle position should be refreshed after auto-size.
 *
 * @param {{ parentNode: ParentNode | null } | null} header The header element.
 * @param {number} resizeClickCount The resize handle click count.
 * @returns {boolean}
 */
export function shouldRefreshHandleAfterAutoResize(
  header: { parentNode: ParentNode | null } | null,
  resizeClickCount: number,
): boolean {
  return !!header?.parentNode && resizeClickCount >= 2;
}

/**
 * The size options the row resize plugin answers to. `minRowHeights` is documented as an alias for
 * `rowHeights`, and `Core#_getRowHeightFromSettings` reads `rowHeights ?? minRowHeights`, so the two
 * state the row heights equally.
 */
export const ROW_SIZE_OPTIONS = ['rowHeights', 'minRowHeights'];

/**
 * The size options the column resize plugin answers to. There is no `minColWidths` alias.
 */
export const COLUMN_SIZE_OPTIONS = ['colWidths'];

/**
 * Checks whether a config object passed to `updateSettings()` re-declares the sizes that one of the
 * manual resize plugins keeps. Such a config discards the sizes the user set by dragging, so that
 * the size option takes effect again.
 *
 * `pluginSetting` is the plugin option read from the merged settings rather than from the config
 * object, so a grid configured with a non-empty array keeps the sizes the plugin replays on the
 * map's `init` hook - clearing them here would leave the stored sizes and the option disagreeing
 * until the next replay put them back. An empty array presets nothing, so it does not suppress the
 * clear.
 *
 * @param {object|undefined} newSettings The config object passed to `updateSettings()`.
 * @param {string[]} sizeOptionKeys The size option names, `ROW_SIZE_OPTIONS` or `COLUMN_SIZE_OPTIONS`.
 * @param {*} pluginSetting The plugin option, `manualRowResize` or `manualColumnResize`, read from
 *                          the merged settings.
 * @returns {boolean}
 */
export function redeclaresManualSizes(
  newSettings: Record<string, unknown> | undefined,
  sizeOptionKeys: string[],
  pluginSetting: unknown,
): boolean {
  if (!newSettings || (Array.isArray(pluginSetting) && pluginSetting.length > 0)) {
    return false;
  }

  return sizeOptionKeys.some((sizeOptionKey) => {
    const sizeOption = newSettings[sizeOptionKey];

    // A function states no fixed size - it is called again on every render, and a framework wrapper
    // rebuilds an inline one on every render too, which would discard the stored sizes each time.
    // Clear them with `clearManualSizes()` instead.
    if (typeof sizeOption === 'function') {
      return false;
    }

    // Matches how `BasePlugin` itself tests a config key for relevance.
    return sizeOption !== undefined;
  });
}
