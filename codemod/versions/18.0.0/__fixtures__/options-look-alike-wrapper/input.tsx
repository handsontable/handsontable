import { HotTable } from '@handsontable/react-wrapper';
import { Chart } from './chart';
import { DeskGrid } from './desk-grid';

export function Page({ rows, columns }) {
  return (
    <>
      <DeskGrid
        data={rows}
        columns={columns}
        correctFormat
        numericFormat={{ pattern: '0,0.00', culture: 'de-CH' }}
      />
      <Chart correctFormat />
      <Chart numericFormat={{ style: 'percent' }} />
      <div correctFormat="yes" />
      <HotTable data={rows} columns={columns} correctFormat />
    </>
  );
}
