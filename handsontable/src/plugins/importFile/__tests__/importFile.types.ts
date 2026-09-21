import Handsontable from 'handsontable';
import type {
  ImportedBorder, ImportedConditionalFormatting, ImportedNestedHeader, ImportFileSettings, ImportOptions,
  ImportResult,
} from 'handsontable/plugins/importFile';

new Handsontable(document.createElement('div'), {
  importFile: { engines: { xlsx: {} } },
});
new Handsontable(document.createElement('div'), { importFile: true });
new Handsontable(document.createElement('div'), { importFile: false });

const settings: ImportFileSettings = { engines: { xlsx: {} } };
const hot = new Handsontable(document.createElement('div'), {});
const plugin = hot.getPlugin('importFile');

const options: ImportOptions = {
  sheet: 'Sheet1',
  colHeaders: 'firstRow',
  rowHeaders: true,
  headerRows: 2,
  range: [0, 0, 10, 4],
  inferCellTypes: true,
  importFormulas: false,
  importLayout: true,
  apply: false,
  engine: {},
  importStyles: true,
};

const supported: boolean = plugin.supportsImportFormat('xlsx');

/**
 * Pins the public import API's types: both entry points resolve to an `ImportResult` and each of its
 * fields keeps the declared shape.
 */
async function run(buffer: ArrayBuffer, blob: Blob) {
  const fromBuffer: ImportResult = await plugin.importFromArrayBuffer('xlsx', buffer, options);
  const fromBlob: ImportResult = await plugin.importFromBlob('xlsx', blob);

  const data: unknown[][] = fromBuffer.data;
  const headers: string[] | undefined = fromBlob.colHeaders;
  const dropped: string[] = fromBuffer.dropped;
  const kind: 'exceljs' = fromBuffer.engine.kind;
  const styles: Record<string, string> | undefined = fromBuffer.styles;
  const borders: ImportedBorder[] | undefined = fromBuffer.customBorders;
  const direction: 'rtl' | 'ltr' | undefined = fromBuffer.layoutDirection;
  const nested: ImportedNestedHeader[][] | undefined = fromBuffer.nestedHeaders;
  const conditional: ImportedConditionalFormatting[] | undefined = fromBuffer.conditionalFormatting;

  return { data, headers, dropped, kind, supported, settings, styles, borders, direction, nested, conditional };
}

hot.addHook('beforeImport', (result: ImportResult, format: string) => (result.data.length > 0 ? undefined : false));
hot.addHook('afterImport', (result: ImportResult, format: string) => { void result; void format; });
hot.updateSettings({
  importFile: { engines: { xlsx: {} } },
  beforeImport: result => result.data.length > 0,
  afterImport: () => {},
});
