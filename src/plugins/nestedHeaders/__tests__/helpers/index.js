/**
 * Returns HTML string from the passed Handsontable overlays. The returned HTML contains
 * only table headers and if the overlay's element is passed the TBODY and its THs and TDs as well.
 *
 * @param {HTMLElement} overlaysTHead The HoT overlays element to extract the THead structure.
 * @param {HTMLElement} overlaysTBody The HoT overlay element to extract the TBody structure.
 * @returns {string}
 */
export function extractDOMStructure(overlaysTHead, overlaysTBody) {
  const cloneTHeadOverlay = overlaysTHead.find('thead')[0].cloneNode(true);
  const cellsRow = overlaysTBody ? overlaysTBody.find('tbody tr')[0].cloneNode(true).outerHTML : '';

  Array.from(cloneTHeadOverlay.querySelectorAll('th')).forEach((TH) => {
    // Simplify header content
    TH.innerText = TH.querySelector('.colHeader').innerText;
    TH.removeAttribute('style');
  });

  return `${cloneTHeadOverlay.outerHTML}${cellsRow ? `<tbody>${cellsRow}</tbody>` : ''}`;
}

/**
 * Returns not hidden TR elements from the Handosntable main overlay.
 *
 * @param {Handsontable} hot The HoT instance.
 * @param {number} row The header level.
 * @returns {HTMLTableCellElement}
 */
export function nonHiddenTHs(hot, row) {
  const headerRows = hot.view.wt.wtTable.THEAD.querySelectorAll('tr');

  return headerRows[row].querySelectorAll('th:not(.hiddenHeader)');
}

/**
 * Generates complex Handsontable settings for NestedHeaders.
 *
 * @param {number} rows The number of header rows to generate.
 * @param {number} cols The number of header columns to generate.
 * @param {boolean} [generateNestedHeaders=false] If true generates nested headers.
 * @returns {Array}
 */
export function generateComplexSetup(rows, cols, generateNestedHeaders = false) {
  const data = [];

  for (let i = 0; i < rows; i++) {
    let labelCursor = 0;

    for (let j = 0; j < cols; j++) {
      if (!data[i]) {
        data[i] = [];
      }

      const columnLabel = Handsontable.helper.spreadsheetColumnLabel(labelCursor);

      if (!generateNestedHeaders) {
        data[i][j] = `${columnLabel}${i + 1}`;
        labelCursor += 1;
        /* eslint-disable no-continue */
        continue;
      }

      if (i === 0 && j % 2 !== 0) {
        data[i][j] = {
          label: `${columnLabel}${i + 1}`,
          colspan: 8
        };
      } else if (i === 1 && (j % 3 === 1 || j % 3 === 2)) {
        data[i][j] = {
          label: `${columnLabel}${i + 1}`,
          colspan: 4
        };
      } else if (i === 2 && (j % 5 === 1 || j % 5 === 2 || j % 5 === 3 || j % 5 === 4)) {
        data[i][j] = {
          label: `${columnLabel}${i + 1}`,
          colspan: 2
        };
      } else {
        data[i][j] = `${columnLabel}${i + 1}`;
      }

      labelCursor += data[i][j].colspan ?? 1;
    }
  }

  return data;
}

const colspanSettingsAbbreviations = new Map([
  ['l', 'label'],
  ['cs', 'colspan'],
  ['ocs', 'origColspan'],
]);

/**
 * Returns header settings object. This is a common helper function used by multiple tests for
 * the state manager of the NestedHeaders plugin.
 *
 * @param {object} [overwriteProps={}] An object with default values.
 * @returns {object}
 */
export function createColspanSettings(overwriteProps = {}) {
  colspanSettingsAbbreviations.forEach((fullKey, abbrKey) => {
    if (overwriteProps[abbrKey] !== void 0) {
      overwriteProps[fullKey] = overwriteProps[abbrKey];
      delete overwriteProps[abbrKey];
    }
  });

  return {
    label: '',
    colspan: 1,
    origColspan: 1,
    isHidden: false,
    isCollapsed: false,
    collapsible: false,
    isRoot: true,
    isPlaceholder: false,
    ...overwriteProps,
  };
}

/**
 * Returns placeholder settings object. This is a common helper function used by multiple tests for
 * the state manager of the NestedHeaders plugin.
 *
 * @returns {object}
 */
export function createPlaceholder() {
  return {
    label: '',
    isPlaceholder: true,
  };
}
