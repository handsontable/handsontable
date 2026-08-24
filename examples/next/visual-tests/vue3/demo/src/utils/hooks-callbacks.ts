import Handsontable from "handsontable";
import {
  SELECTED_CLASS
} from "./constants";

const dom = (Handsontable as unknown as {
  dom: {
    addClass(el: HTMLElement, className: string): void;
    removeClass(el: HTMLElement, className: string): void;
  };
}).dom;

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

  // Add class to selected rows
  if (cellProperties.instance.getDataAtRowProp(row, "0")) {
    dom.addClass(parentElement, SELECTED_CLASS);
  } else {
    dom.removeClass(parentElement, SELECTED_CLASS);
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

  if (coords.col === -1 && event.target && target.nodeName === "INPUT") {
    event.preventDefault(); // Handsontable will render checked/unchecked checkbox by it own.

    const hot = this as unknown as Handsontable;
    (hot.setDataAtRowProp as (row: number, prop: string, value: boolean) => void)(coords.row, "0", !target.checked);
  }
};
