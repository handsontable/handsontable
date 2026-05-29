import type { HotInstance } from '../../../core/types';
import { isKeyValueObject } from '../../../helpers/object';
import { A11Y_HIDDEN } from '../../../helpers/a11y';
import { addClass, eventTargetEl, hasClass } from '../../../helpers/dom/element';
import { stopImmediatePropagation } from '../../../helpers/dom/event';
import EventManager from '../../../eventManager';

export const CLASS_PREFIX = 'ht-multi-select';
export const CHIP_CLASS = `${CLASS_PREFIX}-chip`;
export const CHIP_REMOVE_CLASS = `${CLASS_PREFIX}-chip-remove`;

const CHIP_LABEL_CLASS = `${CLASS_PREFIX}-chip-label`;
const OVERFLOW_INDICATOR_CLASS = `${CLASS_PREFIX}-overflow`;
const beforeColumnResizeHookRegistered = new WeakSet<object>();
const latestColumnWidthCache = new WeakMap<object, Record<number, { width: number }>>();
const chipsEventManagers = new WeakMap<object, EventManager>();

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
  prop: string | number
): HTMLElement {
  const chip = rootDocument.createElement('span');
  const textContent = getItemProperty(item, 'value');

  addClass(chip, CHIP_CLASS);
  chip.dataset.row = String(row);
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

interface HotInstanceWithRoot {
  rootElement: HTMLElement;
  toPhysicalRow: (row: number | string) => number;
  toPhysicalColumn: (col: number | string) => number;
  propToCol: (prop: string | number) => number;
  getSourceDataAtCell: (row: number, col: number) => unknown;
  setSourceDataAtCell: (row: number, col: number | string, value: unknown, source?: string) => void;
  render: () => void;
  addHook: (name: string, callback: (...args: unknown[]) => unknown) => void;
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

    const rowIndex = chip.dataset.row;
    const columnProp = chip.dataset.prop;
    const physicalRow = hotInstance.toPhysicalRow(Number(rowIndex ?? 0));
    const physicalColumn = typeof columnProp === 'string'
      ? columnProp : hotInstance.toPhysicalColumn(Number(columnProp));
    const visualColumn = hotInstance.propToCol(columnProp ?? '');
    const currentData = hotInstance.getSourceDataAtCell(physicalRow, visualColumn);
    const keyToRemove = chip.dataset.key;
    const newData = removeValueByKey(parseValue(currentData), keyToRemove);

    hotInstance.setSourceDataAtCell(physicalRow, physicalColumn, newData, `${rendererType}-renderer`);
    hotInstance.render();
  });

  hotInstance.addHook('beforeOnCellMouseDown', (...args: unknown[]) => {
    const event = args[0] as Event;

    if (hasClass(eventTargetEl(event)!, CHIP_REMOVE_CLASS)) {
      stopImmediatePropagation(event as MouseEvent);
    }
  });
}

interface HotInstanceWithColWidth {
  getColWidth: (col: number) => number;
  addHook: (name: string, callback: (...args: unknown[]) => unknown) => void;
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
 *
 */
function recalculateChipsVisibility(
  columnWidth: number | null,
  chipsContainer: HTMLElement,
  rootDocument: Document
): void {
  const containerWidth = columnWidth;
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
