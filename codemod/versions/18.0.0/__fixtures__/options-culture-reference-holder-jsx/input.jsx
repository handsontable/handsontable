import { HotColumn, HotTable } from '@handsontable/react-wrapper';
import { FMT } from './formats';

const PRESET = { eur: { culture: 'de-DE' }, plain: { style: 'percent' } };

export function Grid({ rows }) {
  return (
    <HotTable data={rows}>
      <HotColumn data="a" numericFormat={FMT.amount} />
      <HotColumn data="b" numericFormat={PRESET.eur} />
      <HotColumn data="c" numericFormat={{ ...FMT.amount }} />
      <HotColumn data="d" numericFormat={PRESET.plain} />
      <HotColumn data="e" numericFormat={{ ...PRESET.plain, currency: 'EUR' }} />
    </HotTable>
  );
}
