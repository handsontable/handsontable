import { useMemo } from 'react';
import { HotTable } from '@handsontable/react-wrapper';

const columnDefs = [
  { data: 'a', type: 'numeric', numericFormat: { pattern: '0,0', culture: 'de-DE' } },
  { data: 'b', type: 'date', correctFormat: true },
];

export function Grids() {
  const memoColumns = useMemo(() => [{ data: 'm', type: 'numeric', numericFormat: { pattern: '0', culture: 'fr-FR' } }], []);
  const branching = useMemo(() => {
    if (columnDefs.length) {
      return [{ data: 'n', correctFormat: true }];
    }

    return [{ data: 'o', correctFormat: true }];
  }, []);

  return (
    <>
      <HotTable licenseKey="k" columns={[{ data: 'var99', type: 'numeric', numericFormat: { pattern: '0,0', culture: 'de-DE' } }, { data: 'limit', type: 'numeric', correctFormat: true }]} />
      <HotTable licenseKey="k" settings={{ columns: [{ data: 'var99', type: 'numeric', numericFormat: { pattern: '0,0', culture: 'de-DE' } }, { data: 'limit', type: 'numeric', correctFormat: true }] }} />
      <HotTable licenseKey="k" columns={columnDefs} />
      <HotTable licenseKey="k" columns={memoColumns} />
      <HotTable licenseKey="k" columns={branching} />
      <HotTable
        licenseKey="k"
        columns={(index) => ({ data: index, type: 'numeric', numericFormat: { culture: 'ja-JP' }, correctFormat: false })}
        cells={(row) => ({ className: String(row), correctFormat: true })}
        cell={[{ row: 0, col: 0, correctFormat: true }]}
      />
    </>
  );
}
