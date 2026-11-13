import { HotColumn, HotTable } from '@handsontable/react-wrapper';

export function Grid({ rows, quoteRenderer }) {
  return (
    <HotTable data={rows}>
      <HotColumn data="a" renderer="nwm.signedAmount" numericFormat={{ culture: 'de-DE' }} />
      <HotColumn data="b" renderer={quoteRenderer} numericFormat={{ culture: 'de-CH' }} />
      <HotColumn data="c" renderer="numeric" numericFormat={{ culture: 'pl-PL' }} />
      <HotColumn data="d" numericFormat={{ culture: 'en-GB' }} />
    </HotTable>
  );
}
