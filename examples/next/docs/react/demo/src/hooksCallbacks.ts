import Handsontable from 'handsontable';
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

export const addClassesToRows: AddClassesToRows = function(
  TD,
  row,
  column,
  prop,
  value,
  cellProperties
) {
  // Adding classes to `TR` just while rendering first visible `TD` element
  if (column !== 0) {
    return;
  }

  const parentElement = TD.parentElement;

  if (parentElement === null) {
    return;
  }

  // Add class to selected rows
  if (
    cellProperties.instance.getSourceDataAtCell(row, -1) ||
    (cellProperties.instance.getDataAtRowProp(row, 'checked') && cellProperties.instance.getSourceDataAtCell(row, -1) === undefined))
  {
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
  input.type = 'checkbox';
  
  if (
    (row >= 0 && (this.getSourceDataAtCell(row, -1))) || 
    (this.getDataAtRowProp(row, 'checked') && this.getSourceDataAtCell(row, -1) === undefined))
  {
    input.checked = true;
  }
  
  Handsontable.dom.empty(TH);

  TH.appendChild(input);
};

export function alignHeaders(this: Handsontable, column: number, TH: HTMLTableCellElement) {
  if (column < 0) {
    return;
  }

  const alignmentClass = this.isRtl() ? 'htRight' : 'htLeft';

  if (TH.firstChild) {
      Handsontable.dom.addClass(TH.firstChild as HTMLElement, alignmentClass);
  }
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
    this.setSourceDataAtCell(coords.row, coords.col, !target.checked);
  }
};
