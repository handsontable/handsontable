import { HotTable } from '@handsontable/react-wrapper';
import { Chart } from './chart';
import { DeskGrid } from './desk-grid';

export function Page({ rows, columns }) {
  return (
    <>
      {/* TODO(handsontable-codemod 18.0.0/numeric-format-culture): Move numericFormat.culture to locale by hand if <DeskGrid> is a Handsontable component. See https://handsontable.com/docs/javascript-data-grid/migration-from-17.1-to-18.0#migrate-numeric-format-from-numbrojs-pattern-and-culture-to-intlnumberformat */}
      {/* TODO(handsontable-codemod 18.0.0/correct-format-removed): Remove correctFormat by hand if <DeskGrid> is a Handsontable component. See https://handsontable.com/docs/javascript-data-grid/migration-from-17.1-to-18.0#correctformat-option */}
      <DeskGrid
        data={rows}
        columns={columns}
        correctFormat
        numericFormat={{ pattern: '0,0.00', culture: 'de-CH' }}
      />
      <Chart correctFormat />
      <Chart numericFormat={{ style: 'percent' }} />
      <div correctFormat="yes" />
      {/* TODO(handsontable-codemod 18.0.0/correct-format-removed): Deleted correctFormat here. Use valueParser or valueSetter to correct entered values. See https://handsontable.com/docs/javascript-data-grid/migration-from-17.1-to-18.0#correctformat-option */}
      <HotTable data={rows} columns={columns} />
    </>
  );
}
