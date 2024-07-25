import Handsontable from "handsontable";
import type { RowObject } from "handsontable/common";

import { ODD_ROW_CLASS } from "./constants";
import { Events } from "handsontable/pluginHooks";

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

  // Add class to odd TRs
  if (row % 2 === 0) {
    Handsontable.dom.addClass(parentElement, ODD_ROW_CLASS);
  } else {
    Handsontable.dom.removeClass(parentElement, ODD_ROW_CLASS);
  }
};

export const drawCheckboxInRowHeaders: Events["afterGetRowHeader"] = function drawCheckboxInRowHeaders(
  this: Handsontable,
  row,
  TH
) {
  const input = document.createElement("input");

  input.type = "checkbox";
  input.tabIndex = -1;

  if (row >= 0 && this.getDataAtRowProp(row, "0")) {
    input.checked = true;
  }

  Handsontable.dom.empty(TH);

  TH.appendChild(input);
};

export const changeCheckboxCell: Events["afterOnCellMouseDown"] = function changeCheckboxCell(
  this: Handsontable,
  event,
  coords
) {
  const target = event.target as HTMLInputElement;

  if (coords.col === -1 && event.target && target.nodeName === "INPUT") {
    event.preventDefault(); // Handsontable will render checked/unchecked checkbox by it own.

    this.setDataAtRowProp(coords.row, "0", !target.checked);
  }
};