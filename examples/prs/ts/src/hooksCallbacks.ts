import Handsontable from "handsontable";

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

  if (row >= 0 && this.getDataAtRowProp(row, "0")) {
    input.checked = true;
  }

  Handsontable.dom.empty(TH);

  TH.appendChild(input);
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

    this.setDataAtRowProp(coords.row, "0", !target.checked);
  }
};
