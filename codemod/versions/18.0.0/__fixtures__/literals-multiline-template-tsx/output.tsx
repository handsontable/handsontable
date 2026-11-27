import { HotTable } from '@handsontable/react-wrapper';

export function Ledger() {
  return (
    <HotTable
      licenseKey="non-commercial-and-evaluation"
      columns={[
        // TODO(handsontable-codemod 18.0.0/numeric-format-culture): Check the numbers this column shows. See https://handsontable.com/docs/javascript-data-grid/migration-from-17.1-to-18.0#migrate-numeric-format-from-numbrojs-pattern-and-culture-to-intlnumberformat
        {
          data: 'net',
          type: 'numeric',
          locale: 'de-DE',
          numericFormat: {},

          title: `Net
amount (EUR)`
        },
        // TODO(handsontable-codemod 18.0.0/numeric-format-culture): Check the numbers this column shows. See https://handsontable.com/docs/javascript-data-grid/migration-from-17.1-to-18.0#migrate-numeric-format-from-numbrojs-pattern-and-culture-to-intlnumberformat
        {
          data: 'fx',
          type: 'numeric',
          locale: 'fr-FR',
          numericFormat: {},

          title: `FX
    rate`,

          source: () => <b title="Rate
   in EUR">rate</b>
        },
      ]}
    />
  );
}
