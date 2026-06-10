import type { HotInstance } from '../../core/types';
import type { CellProperties } from '../../settings';
import { baseRenderer } from '../baseRenderer';
import { addClass, empty, fastInnerText } from '../../helpers/dom/element';
import { isEmpty, stringify } from '../../helpers/mixed';
import {
  parseValue,
  createChipElement,
  registerChipRemovingEvents,
  cacheColumnWidthAndRegisterResizeHook,
  handleChipsOverflow,
} from './utils/utils';

export { CHIP_CLASS } from './utils/utils';
export const RENDERER_TYPE = 'multiselect';

const MULTISELECT_RENDERER_CLASS = 'ht-multi-select-renderer';
const CHIPS_CONTAINER_CLASS = 'ht-multi-select-chips-container';

/**
 * Multi-select renderer that displays values as chips.
 */
export function multiSelectRenderer(
  hotInstance: HotInstance,
  TD: HTMLTableCellElement,
  row: number,
  col: number,
  prop: string | number,
  value: unknown,
  cellProperties: CellProperties
): void {
  baseRenderer(hotInstance, TD, row, col, prop, value, cellProperties);

  let escaped: unknown = value;

  if (isEmpty(escaped) && cellProperties.placeholder) {
    escaped = cellProperties.placeholder;
    escaped = stringify(escaped);
    fastInnerText(TD, escaped as string);

    return;
  }

  const { rootDocument } = hotInstance;
  const isAriaEnabled = hotInstance.getSettings().ariaTags;
  const physicalRow = hotInstance.toPhysicalRow(row);
  const physicalColumn = typeof col === 'string' ? col : hotInstance.toPhysicalColumn(col);
  const sourceData = hotInstance.getSourceDataAtCell(physicalRow, physicalColumn);
  const values = parseValue(sourceData);

  empty(TD);
  addClass(TD, MULTISELECT_RENDERER_CLASS);

  if (values.length === 0) {
    TD.appendChild(rootDocument.createTextNode(''));

    return;
  }

  const chipsContainer = rootDocument.createElement('div');

  chipsContainer.className = CHIPS_CONTAINER_CLASS;

  values.forEach((item) => {
    const chip = createChipElement(rootDocument, item, isAriaEnabled ?? false, row, prop);

    chipsContainer.appendChild(chip);
  });

  TD.appendChild(chipsContainer);

  registerChipRemovingEvents(hotInstance, RENDERER_TYPE);

  const columnWidth = cacheColumnWidthAndRegisterResizeHook(hotInstance, col);

  handleChipsOverflow(columnWidth, chipsContainer, rootDocument);
}
