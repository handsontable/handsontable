import { HotColumn, HotTable } from '@handsontable/react-wrapper';

export function Grid({ rows, quoteRenderer }) {
  return (
    <HotTable data={rows}>
      {/* TODO(handsontable-codemod 18.0.0/numeric-format-culture): Move numericFormat.culture to locale and update the renderer in the same change. See https://handsontable.com/docs/javascript-data-grid/migration-from-17.1-to-18.0#migrate-numeric-format-from-numbrojs-pattern-and-culture-to-intlnumberformat */}
      <HotColumn data="a" renderer="nwm.signedAmount" numericFormat={{ culture: 'de-DE' }} />
      {/* TODO(handsontable-codemod 18.0.0/numeric-format-culture): Move numericFormat.culture to locale and update the renderer in the same change. See https://handsontable.com/docs/javascript-data-grid/migration-from-17.1-to-18.0#migrate-numeric-format-from-numbrojs-pattern-and-culture-to-intlnumberformat */}
      <HotColumn data="b" renderer={quoteRenderer} numericFormat={{ culture: 'de-CH' }} />
      <HotColumn data="c" renderer="numeric" locale="pl-PL" numericFormat={{}} />
      <HotColumn data="d" locale="en-GB" numericFormat={{}} />
    </HotTable>
  );
}
