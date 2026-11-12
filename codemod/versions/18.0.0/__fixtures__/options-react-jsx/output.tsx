import { HotTable, HotColumn } from '@handsontable/react-wrapper';

const shared = {
  // TODO(handsontable-codemod 18.0.0/correct-format-removed): Deleted correctFormat here. The correctFormat option was removed in 18.0. See https://handsontable.com/docs/javascript-data-grid/migration-from-17.1-to-18.0#correctformat-option
  colHeaders: true
};
const priceFormat = { pattern: '0,0.00', culture: 'de-DE' };

export function Orders({ extra, culture }: { extra: object, culture: string }) {
  // TODO(handsontable-codemod 18.0.0/correct-format-removed): Deleted correctFormat here. The correctFormat option was removed in 18.0. See https://handsontable.com/docs/javascript-data-grid/migration-from-17.1-to-18.0#correctformat-option
  // TODO(handsontable-codemod 18.0.0/date-picker-config-removed): Deleted datePickerConfig here. The datePickerConfig option was removed in 18.0. See https://handsontable.com/docs/javascript-data-grid/migration-from-17.1-to-18.0#datepickerconfig-option
  return (
    <HotTable
      data={[]}
      {...shared}
      settings={{ columns: [{
        // TODO(handsontable-codemod 18.0.0/correct-format-removed): Deleted correctFormat here. The correctFormat option was removed in 18.0. See https://handsontable.com/docs/javascript-data-grid/migration-from-17.1-to-18.0#correctformat-option
        // TODO(handsontable-codemod 18.0.0/date-picker-config-removed): Deleted datePickerConfig here. The datePickerConfig option was removed in 18.0. See https://handsontable.com/docs/javascript-data-grid/migration-from-17.1-to-18.0#datepickerconfig-option
        type: 'date'
      }], ...extra }}>
      <HotColumn
        type="numeric"
        locale="ja-JP"
        numericFormat={{
          pattern: '0,0'
        }} />
      <HotColumn type="numeric" locale="fr-FR" numericFormat={{
        pattern: '0,0'
      }} />
      <HotColumn type="numeric" locale="fr-FR" numericFormat={{ pattern: '0,0', culture: 'de-DE' }} />
      <HotColumn type="numeric" locale={culture} numericFormat={{}} />
      <HotColumn type="numeric" numericFormat={priceFormat} />
      <HotColumn type="date" />
    </HotTable>
  );
}
