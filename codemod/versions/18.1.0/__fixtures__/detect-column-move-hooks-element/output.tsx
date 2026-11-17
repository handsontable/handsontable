import { HotTable } from '@handsontable/react-wrapper';
import { DeskGrid } from './desk-grid';
import { Chart } from './chart';

export function Page({ rows, columns, onMove }) {
  return (
    <>
      <HotTable data={rows} afterColumnMove={onMove} />
      <DeskGrid data={rows} columns={columns} afterColumnMove={onMove} />
      <Chart afterColumnMove={onMove} />
      <div afterColumnMove="x" />
    </>
  );
}
