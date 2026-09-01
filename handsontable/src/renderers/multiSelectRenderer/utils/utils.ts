import type { HotInstance } from '../../../core/types';
import { isKeyValueObject } from '../../../helpers/object';
import { A11Y_HIDDEN } from '../../../helpers/a11y';
import { addClass, eventTargetEl, hasClass, isHTMLElement } from '../../../helpers/dom/element';
import { isLeftClick, stopImmediatePropagation } from '../../../helpers/dom/event';
import EventManager from '../../../eventManager';

export const CLASS_PREFIX = 'ht-multi-select';
export const CHIP_CLASS = `${CLASS_PREFIX}-chip`;
export const CHIP_REMOVE_CLASS = `${CLASS_PREFIX}-chip-remove`;
export const ARROW_CLASS = `${CLASS_PREFIX}-arrow`;

const CHIP_LABEL_CLASS = `${CLASS_PREFIX}-chip-label`;
const OVERFLOW_INDICATOR_CLASS = `${CLASS_PREFIX}-overflow`;
const beforeColumnResizeHookRegistered = new WeakSet<object>();
const latestColumnWidthCache = new WeakMap<object, Record<number, { width: number }>>();
const chipsEventManagers = new WeakMap<object, EventManager>();
const arrowEventManagers = new WeakMap<object, EventManager>();

/**
 *
 */
export function getItemProperty(item: string | Record<string, string>, property: string): string {
  return isKeyValueObject(item) ? (item as Record<string, string>)[property] : (item as string);
}

/**
 *
 */
export function parseValue(value: unknown): (string | Record<string, string>)[] {
  if (value === null || value === undefined || value === '') {
    return [];
  }

  if (Array.isArray(value)) {
    return value as (string | Record<string, string>)[];
  }

  if (typeof value === 'string') {
    try {
      const parsed: unknown = JSON.parse(value);

      const parsedArray = parsed as (string | Record<string, string>)[];

      return Array.isArray(parsed) ? parsedArray : [parsed as string | Record<string, string>];
    } catch {
      return value.trim() ? [value] : [];
    }
  }

  return [value] as (string | Record<string, string>)[];
}

/**
 *
 */
export function createChipElement(
  rootDocument: Document,
  item: string | Record<string, string>,
  isAriaEnabled: boolean,
  row: number,
  col: number,
  prop: string | number
): HTMLElement {
  const chip = rootDocument.createElement('span');
  const textContent = getItemProperty(item, 'value');

  addClass(chip, CHIP_CLASS);
  chip.dataset.row = String(row);
  chip.dataset.col = String(col);
  chip.dataset.prop = String(prop);
  chip.title = textContent;

  const label = rootDocument.createElement('span');

  addClass(label, CHIP_LABEL_CLASS);
  label.textContent = textContent;
  chip.appendChild(label);

  const removeBtn = rootDocument.createElement('span');

  addClass(removeBtn, CHIP_REMOVE_CLASS);

  if (isAriaEnabled) {
    removeBtn.setAttribute(...A11Y_HIDDEN());
  }

  chip.dataset.key = getItemProperty(item, 'key');
  chip.appendChild(removeBtn);

  return chip;
}

/**
 *
 */
export function createOverflowIndicator(rootDocument: Document, count: number): HTMLElement {
  const indicator = rootDocument.createElement('span');

  addClass(indicator, OVERFLOW_INDICATOR_CLASS);
  indicator.textContent = `+${count}`;

  return indicator;
}

/**
 * Creates the dropdown indicator shown at the cell's trailing edge.
 *
 * The indicator carries the edited cell's coordinates in its dataset so a single delegated listener
 * can serve every cell in the column — see `registerDropdownIndicatorEvents`.
 *
 * @param {Document} rootDocument The document that owns the grid.
 * @param {boolean} isAriaEnabled `true` when the `ariaTags` option is enabled.
 * @param {number} row The visual row index.
 * @param {number} col The visual column index.
 * @returns {HTMLElement} The indicator element.
 */
export function createDropdownIndicator(
  rootDocument: Document,
  isAriaEnabled: boolean,
  row: number,
  col: number
): HTMLElement {
  const indicator = rootDocument.createElement('span');

  addClass(indicator, ARROW_CLASS);
  indicator.dataset.row = String(row);
  indicator.dataset.col = String(col);

  // Decorative: the cell already announces its value and the editor announces the option list.
  if (isAriaEnabled) {
    indicator.setAttribute(...A11Y_HIDDEN());
  }

  return indicator;
}

/**
 * Opens the editor when the dropdown indicator is clicked once, matching the autocomplete and
 * dropdown cell types. Registers one delegated listener per Handsontable instance.
 *
 * @param {HotInstance} hotInstance The Handsontable instance.
 */
export function registerDropdownIndicatorEvents(hotInstance: HotInstance): void {
  if (arrowEventManagers.has(hotInstance)) {
    return;
  }

  const eventManager = new EventManager(hotInstance);

  arrowEventManagers.set(hotInstance, eventManager);

  eventManager.addEventListener(hotInstance.rootElement, 'mousedown', (event: Event) => {
    const target = eventTargetEl(event);

    // Only the left button opens the list. Without the check, a right-click on the indicator would
    // open the editor alongside the context menu.
    if (!isHTMLElement(target) || !hasClass(target, ARROW_CLASS) || !isLeftClick(event)) {
      return;
    }

    // Read the coordinates from the indicator itself rather than from a closure captured at render
    // time. `autocompleteRenderer` captures `row`/`col` from whichever cell rendered first, which is
    // one reason its class is not reused here.
    const visualRow = Number(target.dataset.row);
    const visualColumn = Number(target.dataset.col);
    const td = hotInstance.getCell(visualRow, visualColumn);

    if (!td) {
      return;
    }

    // The `null` event is load-bearing, not laziness: `EditorManager#openEditor` only applies its
    // "no editor for a multi-cell selection" default when the event is a `MouseEvent`, so forwarding
    // the real one would stop the indicator from opening the list after a shift-drag range.
    hotInstance.view._wt.getSetting(
      'onCellDblClick',
      null,
      hotInstance._createCellCoords(visualRow, visualColumn),
      td
    );
  });
}

/**
 *
 */
export function registerChipRemovingEvents(
  hotInstance: HotInstance,
  rendererType: string
): void {
  if (chipsEventManagers.has(hotInstance)) {
    return;
  }

  chipsEventManagers.set(hotInstance, new EventManager(hotInstance));

  const eventManager = chipsEventManagers.get(hotInstance)!;

  eventManager.addEventListener(hotInstance.rootElement, 'click', (event: Event) => {
    if (!hasClass(eventTargetEl(event)!, CHIP_REMOVE_CLASS)) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    const chip = eventTargetEl(event)!.closest(`.${CHIP_CLASS}`) as HTMLElement | null;

    if (!chip) {
      return;
    }

    const visualRow = Number(chip.dataset.row ?? 0);
    const visualColumn = Number(chip.dataset.col ?? 0);
    const physicalRow = hotInstance.toPhysicalRow(visualRow);
    // Read the raw source array, not `getDataAtCell` — the multiselect `valueGetter` turns the
    // stored array into a display string, which `parseValue` cannot split back into items.
    const currentData = hotInstance.getSourceDataAtCell(physicalRow, visualColumn);
    const keyToRemove = chip.dataset.key;
    const newData = removeValueByKey(parseValue(currentData), keyToRemove);

    // Route the removal through `setDataAtCell` so it runs the standard change and validation
    // pipeline (`beforeChange` / `afterChange`), matching the editor's deselect path. Writing via
    // `setSourceDataAtCell` bypassed those hooks and left the two removal paths inconsistent.
    hotInstance.setDataAtCell(visualRow, visualColumn, newData, `${rendererType}-renderer`);
  });

  hotInstance.addHook('beforeOnCellMouseDown', (...args: unknown[]) => {
    const event = args[0] as Event;

    if (hasClass(eventTargetEl(event)!, CHIP_REMOVE_CLASS)) {
      stopImmediatePropagation(event as MouseEvent);
    }
  });
}

/**
 *
 */
export function cacheColumnWidthAndRegisterResizeHook(
  hotInstance: HotInstance,
  col: number
): number {
  const currentWidth = hotInstance.getColWidth(col);

  if (!latestColumnWidthCache.has(hotInstance)) {
    latestColumnWidthCache.set(hotInstance, { [col]: { width: currentWidth } });
  } else {
    const cache = latestColumnWidthCache.get(hotInstance)!;

    if (cache[col]?.width !== currentWidth) {
      latestColumnWidthCache.set(hotInstance, { ...cache, [col]: { width: currentWidth } });
    }
  }

  if (!beforeColumnResizeHookRegistered.has(hotInstance)) {
    hotInstance.addHook('beforeColumnResize', (...args: unknown[]) => {
      const newSize = args[0] as number;
      const columnIndex = args[1] as number;
      const cache = latestColumnWidthCache.get(hotInstance);

      if (cache?.[columnIndex]?.width !== newSize) {
        latestColumnWidthCache.set(
          hotInstance,
          { ...cache, [columnIndex]: { width: newSize } }
        );
      }
    });

    beforeColumnResizeHookRegistered.add(hotInstance);
  }

  return latestColumnWidthCache.get(hotInstance)?.[col]?.width ?? currentWidth;
}

/**
 * Returns the horizontal space the dropdown indicator takes up in the cell, including its margins.
 *
 * Both margins are summed, so the physical `marginLeft`/`marginRight` pair works for LTR and RTL
 * alike and does not depend on logical-property support.
 *
 * @param {HTMLElement} chipsContainer The chips container whose cell holds the indicator.
 * @param {Document} rootDocument The document that owns the grid.
 * @returns {number} The reserved width in pixels, or `0` when no indicator is rendered.
 */
function getDropdownIndicatorReserve(chipsContainer: HTMLElement, rootDocument: Document): number {
  const indicator = chipsContainer.parentElement?.querySelector<HTMLElement>(`.${ARROW_CLASS}`);

  if (!indicator) {
    return 0;
  }

  const styles = rootDocument.defaultView!.getComputedStyle(indicator);

  return indicator.offsetWidth
    + (parseFloat(styles.marginLeft) || 0)
    + (parseFloat(styles.marginRight) || 0);
}

/**
 *
 */
function recalculateChipsVisibility(
  columnWidth: number | null,
  chipsContainer: HTMLElement,
  rootDocument: Document
): void {
  // Subtract the indicator so the last visible chip and the `+N` badge never slide underneath it.
  const containerWidth = columnWidth === null
    ? null
    : columnWidth - getDropdownIndicatorReserve(chipsContainer, rootDocument);
  const chips = chipsContainer.querySelectorAll<HTMLElement>(`.${CHIP_CLASS}`);

  for (let i = 0; i < chips.length; i++) {
    chips[i].style.display = '';
  }

  if (containerWidth === null || chips.length === 0) {
    return;
  }

  let indicator = chipsContainer.querySelector<HTMLElement>(`.${OVERFLOW_INDICATOR_CLASS}`);

  if (!indicator) {
    indicator = createOverflowIndicator(rootDocument, chips.length);
    indicator.style.visibility = 'hidden';
    chipsContainer.appendChild(indicator);
  } else {
    indicator.style.display = '';
    indicator.style.visibility = 'hidden';
  }

  const containerStyles = rootDocument.defaultView!.getComputedStyle(chipsContainer);
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
 *
 */
export function handleChipsOverflow(
  columnWidth: number,
  chipsContainer: HTMLElement,
  rootDocument: Document
): void {
  recalculateChipsVisibility(columnWidth, chipsContainer, rootDocument);
}

/**
 *
 */
export function removeValueByKey(
  array: (string | Record<string, string>)[],
  keyToRemove: string | undefined
): (string | Record<string, string>)[] {
  return array.filter(item => getItemProperty(item, 'key') !== keyToRemove);
}
