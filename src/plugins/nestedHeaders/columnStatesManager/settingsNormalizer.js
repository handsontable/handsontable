/* eslint-disable import/prefer-default-export */
/* eslint-disable jsdoc/require-description-complete-sentence */
import { arrayEach, arrayMap } from '../../../helpers/array';
import { isObject } from '../../../helpers/object';
import { stringify } from '../../../helpers/mixed';
import { HEADER_DEFAULT_SETTINGS } from './constants';

/**
 * A function that normalizes user-defined settings into one predictable
 * structure. Currently, the developer can declare nested headers by passing
 * the following unstructured (and sometimes uncompleted) array.
 *   [
 *     [{ label: 'A1', colspan: 2 }],
 *     [{ label: true }, 'B2', 4],
 *     [],
 *   ]
 *
 * The normalization process equalizes the length of columns to each header
 * layers to the same length and generates object settings with a common shape.
 * So the abovementioned example will be normalized into this:
 *   [
 *     [
 *       { label: 'A1', colspan: 2, hidden: false },
 *       { label: '', colspan: 1, hidden: true },
 *       { label: '', colspan: 1, hidden: false },
 *     ],
 *     [
 *       { label: 'true', colspan: 1, hidden: false },
 *       { label: 'B2', colspan: 1, hidden: false },
 *       { label: '4', colspan: 1, hidden: false },
 *     ],
 *     [
 *       { label: '', colspan: 1, hidden: false },
 *       { label: '', colspan: 1, hidden: false },
 *       { label: '', colspan: 1, hidden: false },
 *     ],
 *   ]
 *
 * @param {Array[]} sourceSettings An array with defined nested headers settings.
 * @returns {Array[]}
 */
export function settingsNormalizer(sourceSettings) {
  const normalizedSettings = [];

  // Normalize array items (header settings) into one shape - literal object with default props.
  arrayEach(sourceSettings, (columnsSettings) => {
    const columns = [];

    normalizedSettings.push(columns);

    arrayEach(columnsSettings, (columnSettings) => {
      const headerSettings = {
        ...HEADER_DEFAULT_SETTINGS,
      };

      if (isObject(columnSettings)) {
        const {
          label, colspan,
        } = columnSettings;

        headerSettings.label = stringify(label);

        if (typeof colspan === 'number' && colspan > 1) {
          headerSettings.colspan = colspan;
        }
      } else {
        headerSettings.label = stringify(columnSettings);
      }

      columns.push(headerSettings);

      if (headerSettings.colspan > 1) {
        for (let i = 0; i < headerSettings.colspan - 1; i++) {
          columns.push({
            ...HEADER_DEFAULT_SETTINGS,
            hidden: true,
          });
        }
      }
    });
  });

  const columnsLength = Math.max(...arrayMap(normalizedSettings, (columnsSettings => columnsSettings.length)));

  // Normalize the length of each header layer to the same columns length.
  arrayEach(normalizedSettings, (columnsSettings) => {
    if (columnsSettings.length < columnsLength) {
      const defaultSettings = arrayMap(new Array(columnsLength - columnsSettings.length), () => ({ ...HEADER_DEFAULT_SETTINGS }));

      columnsSettings.splice(columnsSettings.length, 0, ...defaultSettings);
    }
  });

  return normalizedSettings;
}
