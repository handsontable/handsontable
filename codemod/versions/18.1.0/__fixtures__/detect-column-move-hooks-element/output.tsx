import { HotTable } from '@handsontable/react-wrapper';
import { DeskGrid } from './desk-grid';
import { Chart } from './chart';

export function Page({ rows, columns, onMove }) {
  return (
    <>
      {/* TODO(handsontable-codemod 18.1.0/column-move-hooks): Move header-click logic from this hook to afterColumnSort or afterOnCellMouseUp. See https://handsontable.com/docs/javascript-data-grid/migration-from-18.0-to-18.1#update-code-that-reacts-to-a-column-header-click */}
      <HotTable data={rows} afterColumnMove={onMove} />
      {/* TODO(handsontable-codemod 18.1.0/column-move-hooks): Move header-click logic from this hook to afterColumnSort or afterOnCellMouseUp. See https://handsontable.com/docs/javascript-data-grid/migration-from-18.0-to-18.1#update-code-that-reacts-to-a-column-header-click */}
      <DeskGrid data={rows} columns={columns} afterColumnMove={onMove} />
      <Chart afterColumnMove={onMove} />
      <div afterColumnMove="x" />
    </>
  );
}
