import { arrayEach, arrayMap } from '../../../helpers/array';
import { isObject } from '../../../helpers/object';
import { stringify } from '../../../helpers/mixed';
import { HEADER_DEFAULT_SETTINGS } from './constants';

export function settingsNormalizer(sourceSettings) {
  const normalizedSettings = [];

  // Normalize array items (header settings) into one shape - literal object with default props
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

  // Normalize the length of each header layer to the same columns length
  arrayEach(normalizedSettings, (columnsSettings) => {
    if (columnsSettings.length < columnsLength) {
      const defaultSettings = arrayMap(new Array(columnsLength - columnsSettings.length), () => ({ ...HEADER_DEFAULT_SETTINGS }));

      columnsSettings.splice(columnsSettings.length, 0, ...defaultSettings);
    }
  });

  return normalizedSettings;
}
