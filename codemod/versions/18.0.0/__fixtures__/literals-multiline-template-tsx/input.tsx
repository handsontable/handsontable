import { HotTable } from '@handsontable/react-wrapper';

export function Ledger() {
  return (
    <HotTable
      licenseKey="non-commercial-and-evaluation"
      columns={[
        { data: 'net', type: 'numeric', numericFormat: { culture: 'de-DE' }, title: `Net
amount (EUR)` },
        { data: 'fx', type: 'numeric', numericFormat: { culture: 'fr-FR' }, title: `FX
    rate`, renderer: () => <b title="Rate
   in EUR">rate</b> },
      ]}
    />
  );
}
