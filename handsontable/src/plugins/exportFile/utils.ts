import { buildTemplate, SVG_NS } from '../../helpers/dom/template';
import { LOADING_CLASS_NAME } from '../../helpers/constants';
import { deprecatedWarnOnce } from '../../helpers/console';

export function normalizeExportOptions<T extends Record<string, unknown>>(options: T): T;
export function normalizeExportOptions<T extends Record<string, unknown>>(options: T | undefined): T | undefined;
/**
 * Resolves the deprecated `columnHeaders` export option to its current name, `colHeaders`.
 *
 * Call this at every entry point that accepts caller-supplied export options. The promotion has to
 * happen before the options are merged with the defaults, because `BaseType.DEFAULT_OPTIONS`
 * carries `colHeaders`, and a merged object therefore always has the new key already.
 *
 * The warning prints once per page, so calling this on several code paths for one export is safe.
 *
 * The overloads keep the contract honest at both kinds of call site: a caller that passes a definite
 * object gets a definite object back, while a caller that may pass `undefined` (a missing options
 * argument) gets `undefined` back and has to handle it.
 *
 * @param {object|undefined} options Caller-supplied export options, or `undefined` when the caller
 *   passed none.
 * @returns {object|undefined} The input as-is when it is `undefined` or `columnHeaders` is absent,
 *   otherwise a copy with `colHeaders` filled in. An explicit `colHeaders` always wins.
 */
export function normalizeExportOptions<T extends Record<string, unknown>>(options: T | undefined): T | undefined {
  if (!options || !('columnHeaders' in options)) {
    return options;
  }

  deprecatedWarnOnce('ExportFile.columnHeaders',
    'The `columnHeaders` export option is deprecated and will be removed in Handsontable 19.0.0. ' +
    'Use `colHeaders` instead.');

  if ('colHeaders' in options) {
    return options;
  }

  return { ...options, colHeaders: options.columnHeaders };
}

/**
 * One entry of a nested-header layer as `DataProvider#getNestedColumnHeaders()` returns it.
 * `colspan` is the number of exported columns the label covers after hidden-column and range
 * clamping, so it can be `0` when every column of the span is excluded from the export.
 */
export interface NestedHeaderLayerEntry {
  label: string;
  colspan: number;
}

/**
 * Expands nested-header layers into plain header rows for a text format such as CSV.
 *
 * Each layer becomes one row. A group label is repeated once per column it spans, so a row has
 * exactly as many cells as the exported data has columns, and a spreadsheet that opens the file
 * shows the group above every column it belongs to. This is the same shape the `copyPaste` plugin
 * produces with `copyColumnGroupHeaders`, and the flattened form of what the XLSX export writes as
 * a merged cell.
 *
 * An entry with `colspan: 0` contributes no cell. An empty label keeps its cell, so the column
 * count stays aligned with the data rows.
 *
 * @param {Array} layers Layers from `DataProvider#getNestedColumnHeaders()`, top layer first.
 * @returns {string[][]} One row of labels per layer.
 */
export function expandNestedHeaderLayers(layers: NestedHeaderLayerEntry[][]): string[][] {
  return layers.map((layer) => {
    const row: string[] = [];

    layer.forEach(({ label, colspan }) => {
      for (let i = 0; i < colspan; i++) {
        row.push(label);
      }
    });

    return row;
  });
}

/**
 * Builds the dialog overlay DOM fragment for the export progress indicator.
 *
 * The title text is resolved at call-time so it reflects the active locale.
 *
 * The title is rendered as text rather than trusted. Its only current caller passes a translated
 * phrase, which no end user controls, but a customer-registered language dictionary does reach it,
 * and this function is the kind that acquires callers. Writing it through `textContent` (not
 * stripping it) keeps a phrase containing `<` intact.
 *
 * @param {string} title Translated title string (e.g. "Exporting…"). Rendered as text; markup in it
 *   shows up literally.
 * @param {Document} rootDocument The document to build the nodes in.
 * @returns {DocumentFragment}
 */
export function buildExportDialogContent(title: string, rootDocument: Document): DocumentFragment {
  // Spinner SVG reused from the Loading plugin — same arc shape, same CSS class so the
  // `ht-loading__icon-svg` spin animation (defined in handsontable.css) applies automatically.
  const { fragment } = buildTemplate({
    tag: 'div',
    className: `${LOADING_CLASS_NAME}__content`,
    children: [
      {
        tag: 'i',
        className: `${LOADING_CLASS_NAME}__icon`,
        children: [{
          tag: 'svg',
          ns: SVG_NS,
          className: `${LOADING_CLASS_NAME}__icon-svg`,
          attrs: { fill: 'none', viewBox: '0 0 16 16' },
          children: [{
            tag: 'path',
            attrs: {
              stroke: 'currentColor',
              'stroke-width': '2',
              d: 'M15 8a7 7 0 1 1-3.5-6.062',
            },
          }],
        }],
      },
      {
        tag: 'div',
        className: `${LOADING_CLASS_NAME}__text`,
        children: [{ tag: 'h2', className: `${LOADING_CLASS_NAME}__title`, text: title }],
      },
    ],
  }, rootDocument);

  return fragment;
}
