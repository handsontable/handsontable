import { HotTable, HotColumn } from '@handsontable/react-wrapper';

const shared = {
  // TODO(handsontable-codemod 18.0.0/correct-format-removed): The correctFormat option was removed in 18.0 and was deleted here. The date, time, intl-date, and intl-time cell types work with ISO 8601 values and do not reformat input. To normalize or correct entered values, use the valueParser or valueSetter option.
  colHeaders: true
};
const priceFormat = { pattern: '0,0.00', culture: 'de-DE' };

export function Orders({ extra, culture }: { extra: object, culture: string }) {
  // TODO(handsontable-codemod 18.0.0/correct-format-removed): The correctFormat option was removed in 18.0 and was deleted here. The date, time, intl-date, and intl-time cell types work with ISO 8601 values and do not reformat input. To normalize or correct entered values, use the valueParser or valueSetter option.
  // TODO(handsontable-codemod 18.0.0/date-picker-config-removed): The datePickerConfig option was removed in 18.0 and was deleted here. The date and intl-date cell types use the browser's native date input instead of Pikaday.
  return (
    <HotTable
      data={[]}
      {...shared}
      settings={{ columns: [{
        // TODO(handsontable-codemod 18.0.0/correct-format-removed): The correctFormat option was removed in 18.0 and was deleted here. The date, time, intl-date, and intl-time cell types work with ISO 8601 values and do not reformat input. To normalize or correct entered values, use the valueParser or valueSetter option.
        // TODO(handsontable-codemod 18.0.0/date-picker-config-removed): The datePickerConfig option was removed in 18.0 and was deleted here. The date and intl-date cell types use the browser's native date input instead of Pikaday.
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
