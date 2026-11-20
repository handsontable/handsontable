import { HotColumn, HotTable } from '@handsontable/react-wrapper';
import { FMT } from './formats';

const PRESET = { eur: { culture: 'de-DE' }, plain: { style: 'percent' } };

export function Grid({ rows }) {
  return (
    <HotTable data={rows}>
      {/* TODO(handsontable-codemod 18.0.0/numeric-format-culture): Move numericFormat.culture to locale by hand if it sets culture. See https://handsontable.com/docs/javascript-data-grid/migration-from-17.1-to-18.0#migrate-numeric-format-from-numbrojs-pattern-and-culture-to-intlnumberformat */}
      <HotColumn data="a" numericFormat={FMT.amount} />
      {/* TODO(handsontable-codemod 18.0.0/numeric-format-culture): Move numericFormat.culture to locale by hand: numericFormat comes from a variable that sets culture. See https://handsontable.com/docs/javascript-data-grid/migration-from-17.1-to-18.0#migrate-numeric-format-from-numbrojs-pattern-and-culture-to-intlnumberformat */}
      <HotColumn data="b" numericFormat={PRESET.eur} />
      {/* TODO(handsontable-codemod 18.0.0/numeric-format-culture): Move numericFormat.culture to locale by hand if it sets culture. See https://handsontable.com/docs/javascript-data-grid/migration-from-17.1-to-18.0#migrate-numeric-format-from-numbrojs-pattern-and-culture-to-intlnumberformat */}
      <HotColumn data="c" numericFormat={{ ...FMT.amount }} />
      <HotColumn data="d" numericFormat={PRESET.plain} />
      <HotColumn data="e" numericFormat={{ ...PRESET.plain, currency: 'EUR' }} />
    </HotTable>
  );
}
