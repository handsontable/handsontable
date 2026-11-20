import { HotTable, HotColumn } from '@handsontable/react-wrapper';

const shared = { colHeaders: true, correctFormat: true };
const priceFormat = { pattern: '0,0.00', culture: 'de-DE' };

export function Orders({ extra, culture }: { extra: object, culture: string }) {
  return (
    <HotTable
      data={[]}
      {...shared}
      correctFormat={false}
      settings={{ columns: [{ type: 'date', correctFormat: true, datePickerConfig: {} }], ...extra }}
    >
      <HotColumn type="numeric" numericFormat={{ pattern: '0,0', culture: 'ja-JP' }} />
      <HotColumn type="numeric" locale="fr-FR" numericFormat={{ pattern: '0,0', culture: 'fr-FR' }} />
      <HotColumn type="numeric" locale="fr-FR" numericFormat={{ pattern: '0,0', culture: 'de-DE' }} />
      <HotColumn type="numeric" numericFormat={{ culture }} />
      <HotColumn type="numeric" numericFormat={priceFormat} />
      <HotColumn type="date" datePickerConfig={{}} />
    </HotTable>
  );
}
