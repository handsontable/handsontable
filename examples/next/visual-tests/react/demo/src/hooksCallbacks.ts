import Handsontable from "handsontable";
import {
  SELECTED_CLASS,
  ODD_ROW_CLASS
} from "./constants";
import { Events } from "handsontable";

export const addClassesToRows: Events['beforeRenderer'] = (
  TD,
  row,
  column,
  _prop,
  _value,
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

  // Add class to selected rows
  if (cellProperties.instance.getDataAtRowProp(row, "0")) {
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

export const drawCheckboxInRowHeaders: Events["afterGetRowHeader"] = function drawCheckboxInRowHeaders(
  this: Handsontable,
  row,
  TH
) {
  const input = document.createElement("input");

  input.type = "checkbox";
  input.tabIndex = -1;
  input.classList.add("htCheckboxRendererInput");

  if (row >= 0 && this.getDataAtRowProp(row, "0")) {
    input.checked = true;
  }

  const relative = TH.querySelector(".relative .rowHeader");

  if (relative) {
    relative.textContent = "";
    relative.appendChild(input);
  }
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
