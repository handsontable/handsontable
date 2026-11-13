import { buildTemplate, SVG_NS } from '../../helpers/dom/template';
import { LOADING_CLASS_NAME } from '../../helpers/constants';
import { removedWarnOnce } from '../../helpers/console';

/**
 * Warns once per page when caller-supplied export options still carry `columnHeaders`, the name
 * `colHeaders` replaced in 17.1 and 19.0 removed. The key is copied into the merged options like
 * any other and nothing reads it, so without this the header row goes missing silently; the
 * `REMOVED_OPTIONS` check in core cannot cover it, because that one scans grid settings only.
 *
 * Call it at every site that merges caller-supplied options: the per-export merge in
 * `BaseType#_mergeOptions()` and the per-sheet merge of an XLSX `sheets` entry.
 *
 * @param {object} options Caller-supplied export options.
 */
export function warnRemovedColumnHeadersOption(options: Record<string, unknown>): void {
  if ('columnHeaders' in options) {
    removedWarnOnce('ExportFile.columnHeaders',
      'The `columnHeaders` export option was removed in Handsontable 19.0.0 and is ignored. ' +
      'Use `colHeaders` instead.');
  }
}

/**
 * One entry of a nested-header layer as `ExportDataProvider#getNestedColumnHeaders()` returns it.
 * `colspan` is the number of exported columns the label covers after hidden-column and range
 * clamping. It is at least `1`: a span whose every column is excluded from the export produces no
 * entry at all.
 */
export interface NestedHeaderLayerEntry {
  label: string;
  colspan: number;
}

/**
 * Expands nested-header layers into plain header rows for a text format such as CSV.
 *
 * Each layer becomes one row. A group label is repeated once per column it spans, so a row has
 * exactly as many cells as the exported data has columns. A CSV file has no merged cells, so the
 * repeat is what keeps the grouping when a spreadsheet opens the file: every column carries its
 * group label, whichever columns the reader keeps.
 *
 * The three nested-header outputs differ on purpose. The XLSX export writes a group as one merged
 * cell. The `copyPaste` plugin, with `copyColumnGroupHeaders`, writes the label once and leaves the
 * other spanned cells empty. The CSV export repeats the label.
 *
 * An empty label keeps its cell, so the column count stays aligned with the data rows.
 *
 * @param {Array} layers Layers from `ExportDataProvider#getNestedColumnHeaders()`, top layer first.
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
