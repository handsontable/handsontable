import React from 'react';
import Handsontable from 'handsontable/base';
import type { CellCoords, SelectOptionsObject } from 'handsontable/base';
import { HotTable } from '@handsontable/react-wrapper';

interface GridProps {
  start: CellCoords;
  options: SelectOptionsObject;
}

export const Grid = ({ start, options }: GridProps) => (
  <HotTable
    data={[[options]]}
    afterSelection={(row, col) => console.log(new Handsontable.CellCoords(row, col), start)}
  />
);
