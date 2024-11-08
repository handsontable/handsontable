/* eslint-disable jsdoc/require-description-complete-sentence */
import { arrayEach, arrayMap } from '../../../helpers/array';
import { isObject } from '../../../helpers/object';
import { stringify } from '../../../helpers/mixed';
import { createDefaultHeaderSettings, createPlaceholderHeaderSettings } from './utils';

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
 * So the above mentioned example will be normalized into this:
 *   [
 *     [
 *       { label: 'A1', colspan: 2, isHidden: false, ... },
 *       { label: '', colspan: 1, isHidden: true, ... },
 *       { label: '', colspan: 1, isHidden: false, ... },
 *     ],
 *     [
 *       { label: 'true', colspan: 1, isHidden: false, ... },
 *       { label: 'B2', colspan: 1, isHidden: false, ... },
 *       { label: '4', colspan: 1, isHidden: false, ... },
 *     ],
 *     [
 *       { label: '', colspan: 1, isHidden: false, ... },
 *       { label: '', colspan: 1, isHidden: false, ... },
 *       { label: '', colspan: 1, isHidden: false, ... },
 *     ],
 *   ]
 *
 * @param {Array[]} sourceSettings An array with defined nested headers settings.
 * @param {number} [columnsLimit=Infinity] A number of columns to which the structure
 *                                         will be trimmed. While trimming the colspan
 *                                         values are adjusted to preserve the original
 *                                         structure.
 * @returns {Array[]}
 */
export function normalizeSettings(sourceSettings, columnsLimit = Infinity) {
  const normalizedSettings = [];

  if (columnsLimit === 0) {
    return normalizedSettings;
  }

  // Normalize array items (header settings) into one shape - literal object with default props.
  arrayEach(sourceSettings, (headersSettings) => {
    const columns = [];
    let columnIndex = 0;

    normalizedSettings.push(columns);

    arrayEach(headersSettings, (sourceHeaderSettings) => {
      const headerSettings = createDefaultHeaderSettings();

      if (isObject(sourceHeaderSettings)) {
        const {
          label, colspan, headerClassName
        } = sourceHeaderSettings;

        headerSettings.label = stringify(label);

        if (typeof colspan === 'number' && colspan > 1) {
          headerSettings.colspan = colspan;
          headerSettings.origColspan = colspan;
        }

        if (typeof headerClassName === 'string') {
          headerSettings.headerClassNames = [...headerClassName.split(' ')];
        }

      } else {
        headerSettings.label = stringify(sourceHeaderSettings);
      }

      columnIndex += headerSettings.origColspan;

      let cancelProcessing = false;

      if (columnIndex >= columnsLimit) {
        // Adjust the colspan value to not overlap the columns limit.
        headerSettings.colspan = headerSettings.origColspan - (columnIndex - columnsLimit);
        headerSettings.origColspan = headerSettings.colspan;
        cancelProcessing = true;
      }

      columns.push(headerSettings);

      if (headerSettings.colspan > 1) {
        for (let i = 0; i < headerSettings.colspan - 1; i++) {
          columns.push(createPlaceholderHeaderSettings());
        }
      }

      return !cancelProcessing;
    });
  });

  const columnsLength = Math.max(...arrayMap(normalizedSettings, (headersSettings => headersSettings.length)));

  // Normalize the length of each header layer to the same columns length.
  arrayEach(normalizedSettings, (headersSettings) => {
    if (headersSettings.length < columnsLength) {
      const defaultSettings = arrayMap(
        new Array(columnsLength - headersSettings.length), () => createDefaultHeaderSettings()
      );

      headersSettings.splice(headersSettings.length, 0, ...defaultSettings);
    }
  });

  return normalizedSettings;
}
