import { HotTable } from '@handsontable/react-wrapper';

export function Ledger() {
  return (
    <HotTable
      licenseKey="non-commercial-and-evaluation"
      columns={[
        {
          data: 'net',
          type: 'numeric',
          locale: 'de-DE',
          numericFormat: {},

          title: `Net
amount (EUR)`
        },
        {
          data: 'fx',
          type: 'numeric',
          locale: 'fr-FR',
          numericFormat: {},

          title: `FX
    rate`,

          renderer: () => <b title="Rate
   in EUR">rate</b>
        },
      ]}
    />
  );
}
