import { useMemo } from 'react';
import { HotTable } from '@handsontable/react-wrapper';

const columnDefs = [
  {
    data: 'a',
    type: 'numeric',
    locale: 'de-DE',

    numericFormat: {
      pattern: '0,0'
    }
  },
  {
    data: 'b',

    // TODO(handsontable-codemod 18.0.0/correct-format-removed): Deleted correctFormat here. The correctFormat option was removed in 18.0. See https://handsontable.com/docs/javascript-data-grid/migration-from-17.1-to-18.0#correctformat-option
    type: 'date'
  },
];

export function Grids() {
  const memoColumns = useMemo(() => [{
    data: 'm',
    type: 'numeric',
    locale: 'fr-FR',

    numericFormat: {
      pattern: '0'
    }
  }], []);
  const branching = useMemo(() => {
    if (columnDefs.length) {
      return [{ data: 'n', correctFormat: true }];
    }

    return [{ data: 'o', correctFormat: true }];
  }, []);

  return (
    <>
      <HotTable licenseKey="k" columns={[{
        data: 'var99',
        type: 'numeric',
        locale: 'de-DE',

        numericFormat: {
          pattern: '0,0'
        }
      }, {
        data: 'limit',

        // TODO(handsontable-codemod 18.0.0/correct-format-removed): Deleted correctFormat here. The correctFormat option was removed in 18.0. See https://handsontable.com/docs/javascript-data-grid/migration-from-17.1-to-18.0#correctformat-option
        type: 'numeric'
      }]} />
      <HotTable licenseKey="k" settings={{ columns: [{
        data: 'var99',
        type: 'numeric',
        locale: 'de-DE',

        numericFormat: {
          pattern: '0,0'
        }
      }, {
        data: 'limit',

        // TODO(handsontable-codemod 18.0.0/correct-format-removed): Deleted correctFormat here. The correctFormat option was removed in 18.0. See https://handsontable.com/docs/javascript-data-grid/migration-from-17.1-to-18.0#correctformat-option
        type: 'numeric'
      }] }} />
      <HotTable licenseKey="k" columns={columnDefs} />
      <HotTable licenseKey="k" columns={memoColumns} />
      <HotTable licenseKey="k" columns={branching} />
      <HotTable
        licenseKey="k"
        columns={(index) => ({ data: index, type: 'numeric', locale: 'ja-JP', // TODO(handsontable-codemod 18.0.0/correct-format-removed): Deleted correctFormat here. The correctFormat option was removed in 18.0. See https://handsontable.com/docs/javascript-data-grid/migration-from-17.1-to-18.0#correctformat-option
        numericFormat: {} })}
        cells={(row) => ({
          // TODO(handsontable-codemod 18.0.0/correct-format-removed): Deleted correctFormat here. The correctFormat option was removed in 18.0. See https://handsontable.com/docs/javascript-data-grid/migration-from-17.1-to-18.0#correctformat-option
          className: String(row)
        })}
        cell={[{
          row: 0,

          // TODO(handsontable-codemod 18.0.0/correct-format-removed): Deleted correctFormat here. The correctFormat option was removed in 18.0. See https://handsontable.com/docs/javascript-data-grid/migration-from-17.1-to-18.0#correctformat-option
          col: 0
        }]}
      />
    </>
  );
}
