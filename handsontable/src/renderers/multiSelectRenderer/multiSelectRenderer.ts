import type { HotInstance } from '../../core/types';
import type { CellProperties } from '../../settings';
import { baseRenderer } from '../baseRenderer';
import { addClass, empty, fastInnerText } from '../../helpers/dom/element';
import { isEmpty, stringify } from '../../helpers/mixed';
import {
  parseValue,
  createChipElement,
  createDropdownIndicator,
  registerChipRemovingEvents,
  registerDropdownIndicatorEvents,
  cacheColumnWidthAndRegisterResizeHook,
  handleChipsOverflow,
} from './utils/utils';

export { CHIP_CLASS } from './utils/utils';
export const RENDERER_TYPE = 'multiselect';

const MULTISELECT_RENDERER_CLASS = 'ht-multi-select-renderer';
const CHIPS_CONTAINER_CLASS = 'ht-multi-select-chips-container';

/**
 * Puts the dropdown indicator in the cell and wires its single-click handler.
 *
 * The indicator goes in as the first child so its float clears the cell's content, the same
 * placement `autocompleteRenderer` uses for `htAutocompleteArrow`.
 *
 * Handsontable reuses `TD` elements between renders, so this relies on every caller having cleared
 * the cell first — the two data branches through `empty()`, and the placeholder branch through
 * `fastInnerText`, whose fast lane needs a lone text node as `firstChild` and therefore always
 * falls through to `empty()` while an indicator sits there. `multiSelectRenderer.unit.js` pins that
 * a stale indicator does not survive a re-render.
 *
 * @param {HotInstance} hotInstance The Handsontable instance.
 * @param {HTMLTableCellElement} TD The rendered cell element.
 * @param {number} row The visual row index.
 * @param {number} col The visual column index.
 * @param {boolean} isAriaEnabled `true` when the `ariaTags` option is enabled.
 */
function renderDropdownIndicator(
  hotInstance: HotInstance,
  TD: HTMLTableCellElement,
  row: number,
  col: number,
  isAriaEnabled: boolean
): void {
  TD.insertBefore(
    createDropdownIndicator(hotInstance.rootDocument, isAriaEnabled, row, col),
    TD.firstChild
  );

  registerDropdownIndicatorEvents(hotInstance);
}

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

  const { rootDocument } = hotInstance;
  const isAriaEnabled = hotInstance.getSettings().ariaTags ?? false;

  let escaped: unknown = value;

  if (isEmpty(escaped) && cellProperties.placeholder) {
    escaped = cellProperties.placeholder;
    escaped = stringify(escaped);
    fastInnerText(TD, escaped as string);
    renderDropdownIndicator(hotInstance, TD, row, col, isAriaEnabled);

    return;
  }

  const physicalRow = hotInstance.toPhysicalRow(row);
  const sourceData = hotInstance.getSourceDataAtCell(physicalRow, col);
  const values = parseValue(sourceData);

  empty(TD);
  addClass(TD, MULTISELECT_RENDERER_CLASS);

  if (values.length === 0) {
    TD.appendChild(rootDocument.createTextNode(''));
    renderDropdownIndicator(hotInstance, TD, row, col, isAriaEnabled);

    return;
  }

  const chipsContainer = rootDocument.createElement('div');

  chipsContainer.className = CHIPS_CONTAINER_CLASS;

  values.forEach((item) => {
    const chip = createChipElement(rootDocument, item, isAriaEnabled, row, col, prop);

    chipsContainer.appendChild(chip);
  });

  TD.appendChild(chipsContainer);

  registerChipRemovingEvents(hotInstance, RENDERER_TYPE);

  // Added before the overflow pass so that pass can measure the indicator and reserve its width.
  renderDropdownIndicator(hotInstance, TD, row, col, isAriaEnabled);

  const columnWidth = cacheColumnWidthAndRegisterResizeHook(hotInstance, col);

  handleChipsOverflow(columnWidth, chipsContainer, rootDocument);
}
