import { baseRenderer } from '../baseRenderer';
import { addClass, empty, hasClass } from '../../helpers/dom/element';
import EventManager from '../../eventManager';
import {
  parseValue,
  createChipElement,
  handleChipsOverflow,
  removeValueByKey,
  CHIP_CLASS,
  CHIP_REMOVE_CLASS,
} from './utils/utils';

export { CHIP_CLASS };
export const RENDERER_TYPE = 'multiSelect';

const MULTISELECT_RENDERER_CLASS = 'htMultiSelectRenderer';
const CHIPS_CONTAINER_CLASS = 'htMultiSelectChipsContainer';

const chipsEventManagers = new WeakMap();
const latestColumnWidthCache = new WeakMap();

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
    const chip = createChipElement(rootDocument, item, isAriaEnabled);

    chipsContainer.appendChild(chip);
  });

  TD.appendChild(chipsContainer);

  // Handle the chip-removing buttons' events.
  if (!chipsEventManagers.has(hotInstance)) {
    chipsEventManagers.set(hotInstance, new EventManager(hotInstance));

    const eventManager = chipsEventManagers.get(hotInstance);

    eventManager.addEventListener(hotInstance.rootElement, 'click', (event) => {
      if (!hasClass(event.target, CHIP_REMOVE_CLASS)) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();

      const chip = event.target.closest(`.${CHIP_CLASS}`);

      if (!chip) {
        return;
      }

      const cellSelectedLast = hotInstance.getSelectedLast();
      const physicalRow = hotInstance.toPhysicalRow(cellSelectedLast[0]);
      const physicalCol = hotInstance.toPhysicalColumn(cellSelectedLast[1]);
      const currentData = hotInstance.getSourceDataAtCell(physicalRow, physicalCol);
      const keyToRemove = chip.dataset.key;
      const newData = removeValueByKey(parseValue(currentData), keyToRemove);

      hotInstance.setSourceDataAtCell(physicalRow, physicalCol, newData);
      hotInstance.render();
    });
  }

  // Cache the column width (required to know the column width before it's rendered - e.g. ManualColumnResize)
  if (!latestColumnWidthCache.has(hotInstance)) {
    latestColumnWidthCache.set(hotInstance, { [col]: { width: hotInstance.getColWidth(col) } });

  } else if (latestColumnWidthCache.get(hotInstance)?.[col]?.width !== hotInstance.getColWidth(col)) {
    latestColumnWidthCache.set(hotInstance,
      { ...latestColumnWidthCache.get(hotInstance), [col]: { width: hotInstance.getColWidth(col) } }
    );
  }

  hotInstance.addHookOnce('beforeColumnResize', (newSize, columnIndex) => {
    if (latestColumnWidthCache.get(hotInstance)?.[columnIndex]?.width !== newSize) {
      latestColumnWidthCache.set(hotInstance, { ...latestColumnWidthCache.get(hotInstance), [columnIndex]: newSize });
    }
  });

  handleChipsOverflow(latestColumnWidthCache.get(hotInstance)?.[col]?.width, chipsContainer, rootDocument);
}

multiSelectRenderer.RENDERER_TYPE = RENDERER_TYPE;
