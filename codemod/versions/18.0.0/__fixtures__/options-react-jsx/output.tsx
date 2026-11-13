import { HotTable, HotColumn } from '@handsontable/react-wrapper';

const shared = {
  // TODO(handsontable-codemod 18.0.0/correct-format-removed): Deleted correctFormat here. Use valueParser or valueSetter to correct entered values. See https://handsontable.com/docs/javascript-data-grid/migration-from-17.1-to-18.0#correctformat-option
  colHeaders: true
};
const priceFormat = { pattern: '0,0.00', culture: 'de-DE' };

export function Orders({ extra, culture }: { extra: object, culture: string }) {
  // TODO(handsontable-codemod 18.0.0/correct-format-removed): Deleted correctFormat here. Use valueParser or valueSetter to correct entered values. See https://handsontable.com/docs/javascript-data-grid/migration-from-17.1-to-18.0#correctformat-option
  return (
    <HotTable
      data={[]}
      {...shared}
      settings={{ columns: [{
        // TODO(handsontable-codemod 18.0.0/correct-format-removed): Deleted correctFormat here. Use valueParser or valueSetter to correct entered values. See https://handsontable.com/docs/javascript-data-grid/migration-from-17.1-to-18.0#correctformat-option
        // TODO(handsontable-codemod 18.0.0/date-picker-config-removed): Deleted datePickerConfig here. Check the native date input, which replaces Pikaday. See https://handsontable.com/docs/javascript-data-grid/migration-from-17.1-to-18.0#datepickerconfig-option
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
      {/* TODO(handsontable-codemod 18.0.0/numeric-format-culture): Set locale to 'de-DE' if that was intended, then remove culture. See https://handsontable.com/docs/javascript-data-grid/migration-from-17.1-to-18.0#migrate-numeric-format-from-numbrojs-pattern-and-culture-to-intlnumberformat */}
      <HotColumn type="numeric" locale="fr-FR" numericFormat={{ pattern: '0,0', culture: 'de-DE' }} />
      {/* TODO(handsontable-codemod 18.0.0/numeric-format-culture): Check that numericFormat.culture is a BCP 47 tag such as de-DE: its value is not a string literal. See https://handsontable.com/docs/javascript-data-grid/migration-from-17.1-to-18.0#migrate-numeric-format-from-numbrojs-pattern-and-culture-to-intlnumberformat */}
      <HotColumn type="numeric" locale={culture} numericFormat={{}} />
      {/* TODO(handsontable-codemod 18.0.0/numeric-format-culture): Move numericFormat.culture to locale by hand: numericFormat comes from a variable that sets culture. See https://handsontable.com/docs/javascript-data-grid/migration-from-17.1-to-18.0#migrate-numeric-format-from-numbrojs-pattern-and-culture-to-intlnumberformat */}
      <HotColumn type="numeric" numericFormat={priceFormat} />
      {/* TODO(handsontable-codemod 18.0.0/date-picker-config-removed): Deleted datePickerConfig here. Check the native date input, which replaces Pikaday. See https://handsontable.com/docs/javascript-data-grid/migration-from-17.1-to-18.0#datepickerconfig-option */}
      <HotColumn type="date" />
    </HotTable>
  );
}
