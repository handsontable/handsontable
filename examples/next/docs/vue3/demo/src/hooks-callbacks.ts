import Handsontable from 'handsontable';
import type { RowObject } from 'handsontable/types/common';

import {
  SELECTED_CLASS,
  ODD_ROW_CLASS
} from './constants';

type AddClassesToRows = (
  TD: HTMLTableCellElement,
  row: number,
  column: number,
  prop: number | string,
  value: any,
  cellProperties: Handsontable.CellProperties
) => void;

export const addClassesToRows: AddClassesToRows = (
  TD,
  row,
  column,
  prop,
  value,
  cellProperties
) => {
  // Adding classes to `TR` just while rendering first visible `TD` element
  if (column !== 0) {
    return;
  }

  const parentElement = TD.parentElement;

  if (parentElement === null) {
    return;
  }

  const rowData = cellProperties.instance.getSourceDataAtRow(row) as RowObject;

  // Add class to selected rows
  if (rowData?.checked) {
    Handsontable.dom.addClass(parentElement, SELECTED_CLASS);
  } else {
    Handsontable.dom.removeClass(parentElement, SELECTED_CLASS);
  }

  // Add class to odd TRs
  if (row % 2 === 0) {
    Handsontable.dom.addClass(parentElement, ODD_ROW_CLASS);
  } else {
    Handsontable.dom.removeClass(parentElement, ODD_ROW_CLASS);
  }
};

type DrawCheckboxInRowHeaders = (
  this: Handsontable,
  row: number,
  TH: HTMLTableCellElement
) => void;

export const drawCheckboxInRowHeaders: DrawCheckboxInRowHeaders = function drawCheckboxInRowHeaders(
  row,
  TH
) {
  const input = document.createElement('input');
  const rowData = this.getSourceDataAtRow(row) as RowObject;
  
  input.type = 'checkbox';
  input.checked = !!rowData?.checked;
  
  Handsontable.dom.empty(TH);

  TH.appendChild(input);
};

export function alignHeaders(this: Handsontable, column: number, TH: HTMLTableCellElement) {
  if (column < 0) {
    return;
  }

  if (!TH.firstChild) {
    return;
  }
  
  const alignmentClass = this.isRtl() ? 'htRight' : 'htLeft';
  Handsontable.dom.addClass(TH.firstChild as HTMLElement, alignmentClass);
}

type ChangeCheckboxCell = (
  this: Handsontable,
  event: MouseEvent,
  coords: { row: number; col: number }
) => void;

export const changeCheckboxCell: ChangeCheckboxCell = function changeCheckboxCell(
  event,
  coords
) {
  const target = event.target as HTMLInputElement;

  if (coords.col === -1 && event.target && target.nodeName === 'INPUT') {
    event.preventDefault(); // Handsontable will render checked/unchecked checkbox by it own.
    this.setSourceDataAtCell(coords.row, 'checked', !target.checked);
  }
};
