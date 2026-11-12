import React from 'react';
import Handsontable from 'handsontable/base';
import { HotTable } from '@handsontable/react-wrapper';

interface GridProps {
  start: Handsontable.CellCoords;
  options: Handsontable.SelectOptionsObject;
}

export const Grid = ({ start, options }: GridProps) => (
  <HotTable
    data={[[options]]}
    afterSelection={(row, col) => console.log(new Handsontable.CellCoords(row, col), start)}
  />
);
