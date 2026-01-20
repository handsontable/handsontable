import { baseRenderer } from '../baseRenderer';
import { addClass, empty } from '../../helpers/dom/element';
import {
  parseValue,
  createChipElement,
  registerChipRemovingEvents,
  cacheColumnWidthAndRegisterResizeHook,
  handleChipsOverflow,
  CHIP_CLASS,
} from './utils/utils';

export { CHIP_CLASS };
export const RENDERER_TYPE = 'multiSelect';

const MULTISELECT_RENDERER_CLASS = 'ht-multi-select-renderer';
const CHIPS_CONTAINER_CLASS = 'ht-multi-select-chips-container';

/**
 * Multi-select renderer that displays values as chips.
 *
 * @private
 * @param {Core} hotInstance The Handsontable instance.
 * @param {HTMLTableCellElement} TD The rendered cell element.
 * @param {number} row The visual row index.
 * @param {number} col The visual column index.
 * @param {number|string} prop The column property (passed when datasource is an array of objects).
 * @param {*} value The rendered value (array of strings or objects with "key" and "value" props).
 * @param {object} cellProperties The cell meta object (see {@link Core#getCellMeta}).
 */
export function multiSelectRenderer(hotInstance, TD, row, col, prop, value, cellProperties) {
  baseRenderer.apply(this, [hotInstance, TD, row, col, prop, value, cellProperties]);

  const { rootDocument } = hotInstance;
  const isAriaEnabled = hotInstance.getSettings().ariaTags;
  const sourceData = hotInstance.getSourceDataAtCell(row, prop);
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
    const chip = createChipElement(rootDocument, item, isAriaEnabled, row, prop);

    chipsContainer.appendChild(chip);
  });

  TD.appendChild(chipsContainer);

  registerChipRemovingEvents(hotInstance, RENDERER_TYPE);

  const columnWidth = cacheColumnWidthAndRegisterResizeHook(hotInstance, col);

  handleChipsOverflow(columnWidth, chipsContainer, rootDocument);
}

multiSelectRenderer.RENDERER_TYPE = RENDERER_TYPE;
