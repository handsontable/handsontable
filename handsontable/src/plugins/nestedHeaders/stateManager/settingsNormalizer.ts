import { arrayEach, arrayMap } from '../../../helpers/array';
import { isObject } from '../../../helpers/object';
import { stringify } from '../../../helpers/mixed';
import { createDefaultHeaderSettings, createPlaceholderHeaderSettings } from './utils';

interface NormalizedHeaderSettings {
  label: string;
  colspan: number;
  origColspan: number;
  collapsible: boolean;
  crossHiddenColumns: number[];
  isCollapsed: boolean;
  isHidden: boolean;
  isRoot: boolean;
  isPlaceholder: boolean;
  headerClassNames: string[];
}

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
export function normalizeSettings(sourceSettings: unknown[][], columnsLimit = Infinity) {
  const normalizedSettings: unknown[][] = [];
  const rowspanCoverageMap: number[] = [];

  if (columnsLimit === 0) {
    return normalizedSettings;
  }

  /**
   * Checks whether the source header item is an explicit empty slot placeholder.
   * That kind of placeholders can be used by the users to indicate positions
   * covered by `rowspan`.
   *
   * @param {*} sourceHeaderSettings The source header settings.
   * @returns {boolean}
   */
  const isExplicitEmptySlotPlaceholder = (sourceHeaderSettings: unknown) => {
    if (sourceHeaderSettings === '') {
      return true;
    }

    if (!isObject(sourceHeaderSettings)) {
      return false;
    }

    const {
      label,
      colspan,
      rowspan,
      headerClassName,
    } = sourceHeaderSettings as Record<string, unknown>;

    return stringify(label) === '' &&
      (colspan === undefined || colspan === 1) &&
      (rowspan === undefined || rowspan === 1) &&
      headerClassName === undefined;
  };

  /**
   * Converts user-defined source settings to normalized shape.
   *
   * @param {*} sourceHeaderSettings The source header settings.
   * @returns {DefaultHeaderSettings}
   */
  const normalizeHeaderSettings = (sourceHeaderSettings: unknown) => {
    const headerSettings = createDefaultHeaderSettings();

    if (isObject(sourceHeaderSettings)) {
      const {
        label,
        colspan,
        rowspan,
        headerClassName,
      } = sourceHeaderSettings as Record<string, unknown>;

      headerSettings.label = stringify(label);

      if (typeof colspan === 'number' && colspan > 1) {
        headerSettings.colspan = colspan;
        headerSettings.origColspan = colspan;
      }

      if (typeof rowspan === 'number' && rowspan > 1) {
        headerSettings.rowspan = rowspan;
        headerSettings.origRowspan = rowspan;
      }

      if (typeof headerClassName === 'string') {
        headerSettings.headerClassNames = [...headerClassName.split(' ')];
      }

    } else {
      headerSettings.label = stringify(sourceHeaderSettings);
    }

    return headerSettings;
  };

  // Normalize array items (header settings) into one shape - literal object with default props.
  arrayEach(sourceSettings, (headersSettings: unknown[] = []) => {
    const columns: unknown[] = [];
    let sourceSettingsIndex = 0;
    let visualColumnIndex = 0;

    normalizedSettings.push(columns);

    while (sourceSettingsIndex < headersSettings.length || rowspanCoverageMap[visualColumnIndex] > 0) {
      if (visualColumnIndex >= columnsLimit) {
        break;
      }

      const sourceHeaderSettings = headersSettings[sourceSettingsIndex];
      const isCoveredByRowspan = rowspanCoverageMap[visualColumnIndex] > 0;

      if (isCoveredByRowspan) {
        if (isExplicitEmptySlotPlaceholder(sourceHeaderSettings)) {
          sourceSettingsIndex += 1;
        }

        columns.push(createDefaultHeaderSettings());
        rowspanCoverageMap[visualColumnIndex] -= 1;
        visualColumnIndex += 1;

        continue; // eslint-disable-line no-continue
      }

      if (sourceSettingsIndex >= headersSettings.length) {
        break;
      }

      const headerSettings = normalizeHeaderSettings(sourceHeaderSettings);
      let headerWidth = headerSettings.origColspan;

      if (visualColumnIndex + headerWidth >= columnsLimit) {
        // Adjust the colspan value to not overlap the columns limit.
        headerWidth -= (visualColumnIndex + headerWidth - columnsLimit);
        headerSettings.colspan = headerWidth;
        headerSettings.origColspan = headerWidth;
      }

      if (headerSettings.origRowspan > 1) {
        for (let i = 0; i < headerWidth; i++) {
          rowspanCoverageMap[visualColumnIndex + i] = Math.max(
            rowspanCoverageMap[visualColumnIndex + i] ?? 0,
            headerSettings.origRowspan - 1
          );
        }
      }

      columns.push(headerSettings);

      if (headerSettings.colspan > 1) {
        for (let i = 0; i < headerSettings.colspan - 1; i++) {
          columns.push(createPlaceholderHeaderSettings());
        }
      }

      visualColumnIndex += headerWidth;
      sourceSettingsIndex += 1;
    }
  });

  const columnsLength = Math.max(
    ...arrayMap(normalizedSettings, (headersSettings => (headersSettings as unknown[]).length))
  );

  // Normalize the length of each header layer to the same columns length.
  arrayEach(normalizedSettings, (headersSettings) => {
    const headers = headersSettings as unknown[];

    if (headers.length < columnsLength) {
      const defaultSettings = arrayMap(
        new Array(columnsLength - headers.length), () => createDefaultHeaderSettings()
      );

      headers.splice(headers.length, 0, ...defaultSettings);
    }
  });

  return normalizedSettings;
}
