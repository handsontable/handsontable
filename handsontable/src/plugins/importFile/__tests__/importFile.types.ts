import Handsontable from 'handsontable';
import type {
  ImportedBorder, ImportedConditionalFormatting, ImportedNestedHeader, ImportFileSettings, ImportOptions,
  ImportResult, InferColumnTypesOptions, InferColumnTypesResult, InferredCellType, InferredColumn,
  InferredColumnSettings, InferredColumnStats, InferredInputFormat,
} from 'handsontable/plugins/importFile';
import { convertToInferredTypes, inferColumnTypes } from 'handsontable/plugins/importFile';

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

const inferOptions: InferColumnTypesOptions = {
  sampleSize: 100,
  locale: 'de-DE',
  minConfidence: 0.8,
  dropdown: { maxOptions: 5 },
  headerRow: 'auto',
  stats: { examples: 3 },
  sampling: 'spread',
  dateFormats: ['DD/MM/YYYY', 'YYYYMMDD'],
  booleanValues: { true: ['yes', 'tak'], false: ['no', 'nie'] },
};
const readonlyFormats: ReadonlyArray<string> = ['D.M.YYYY'];
const readonlyWords: readonly string[] = ['ja'];
const rawRows: string[][] = [['Price', 'Joined'], ['1,5', '12.03.2026']];
const objectRows: Array<Record<string, unknown>> = [{ amount: '1,5' }];
const inferred: InferColumnTypesResult = plugin.inferColumnTypes(rawRows, inferOptions);
const readonlyOptions: InferColumnTypesResult = inferColumnTypes(rawRows, {
  sampling: 'head',
  dateFormats: readonlyFormats,
  booleanValues: { true: readonlyWords },
});
const inferredObjects: InferColumnTypesResult = inferColumnTypes(objectRows, { dropdown: false, headerRow: true });
const convertedRows: unknown[][] = plugin.convertToInferredTypes(rawRows, inferred);
// @ts-expect-error - a converted cell is no longer the input's type.
const stillStrings: string[][] = plugin.convertToInferredTypes(rawRows, inferred);
const convertedObjects: Array<Record<string, unknown>> = convertToInferredTypes(objectRows, inferredObjects);
const headerRow: boolean = inferred.headerRow;
const column: InferredColumn = inferred.columns[0];
const columnSettings: InferredColumnSettings = column.settings;
const inferredType: InferredCellType = columnSettings.type;
const dateTimeType: InferredCellType = 'intl-datetime';
const dateTimeFormat: Intl.DateTimeFormatOptions | undefined = columnSettings.dateTimeFormat;
const inputFormat: InferredInputFormat | undefined = column.inputFormat;
const listedDateFormat: string | undefined = inputFormat?.dateFormat;
const trueWords: string[] | undefined = inputFormat?.booleanValues?.true;
const confidence: number = column.confidence;
const title: string | undefined = column.title;
const stats: InferredColumnStats | undefined = column.stats;
const runnerUp: InferredCellType | undefined = stats?.runnerUpType;
const range: Array<number | string | undefined> = [stats?.min, stats?.max];
const examples: string[] | undefined = stats?.examples;

// The settings go to `columns` as they are; the description of the inference stays out of them.
hot.updateSettings({
  columns: inferred.columns.map(entry => entry.settings),
  colHeaders: inferred.columns.map(({ title: header }) => header ?? ''),
  data: convertedRows,
});

// @ts-expect-error - the dropdown option takes a boolean or an object only.
inferColumnTypes(rawRows, { dropdown: 5 });
// @ts-expect-error - headerRow takes a boolean or 'auto' only.
inferColumnTypes(rawRows, { headerRow: 'yes' });
// @ts-expect-error - sampling takes 'head' or 'spread' only.
inferColumnTypes(rawRows, { sampling: 'random' });
// @ts-expect-error - each side of booleanValues is a list of words.
inferColumnTypes(rawRows, { booleanValues: { true: 'yes' } });
// @ts-expect-error - dateFormats is a list of formats.
inferColumnTypes(rawRows, { dateFormats: 'DD/MM/YYYY' });
// @ts-expect-error - the converter takes the result, not its columns.
convertToInferredTypes(rawRows, inferred.columns);
// @ts-expect-error - confidence is not a column option.
const notAColumnOption: InferredColumnSettings = { type: 'text', confidence: 1 };

// Rows typed with an interface, read-only arrays, and tuples are accepted.
interface Order {
  id: string;
  amount: string;
}

const orders: Order[] = [{ id: '1', amount: '2' }];
const readonlyRows: ReadonlyArray<ReadonlyArray<string>> = [['1', '2']];
const tupleRows: Array<[string, string]> = [['1', '2']];
const readonlyOrders: readonly Order[] = orders;
const fromInterface: InferColumnTypesResult = inferColumnTypes(orders);
const fromReadonly: InferColumnTypesResult = inferColumnTypes(readonlyRows);
const fromTuples: InferColumnTypesResult = inferColumnTypes(tupleRows);
const convertedOrders: Array<Record<string, unknown>> = convertToInferredTypes(orders, fromInterface);
const convertedReadonly: unknown[][] = convertToInferredTypes(readonlyRows, fromReadonly);
const convertedTuples: unknown[][] = convertToInferredTypes(tupleRows, fromTuples);
const convertedReadonlyOrders: Array<Record<string, unknown>> = convertToInferredTypes(
  readonlyOrders,
  inferColumnTypes(readonlyOrders)
);
// @ts-expect-error - an array of rows is not an array of objects.
const wrongRows: Array<Record<string, unknown>> = convertToInferredTypes(readonlyRows, fromReadonly);
