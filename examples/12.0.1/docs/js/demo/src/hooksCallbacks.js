import Handsontable from "handsontable";
import {
  SELECTED_CLASS,
  ODD_ROW_CLASS
} from "./constants";

const headerAlignments = new Map([
  ["9", "htCenter"],
  ["10", "htRight"],
  ["12", "htCenter"]
]);

export function addClassesToRows(TD, row, column, prop, value, cellProperties) {
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
}

export function drawCheckboxInRowHeaders(row, TH) {
  const input = document.createElement("input");

  input.type = "checkbox";

  if (row >= 0 && this.getDataAtRowProp(row, "0")) {
    input.checked = true;
  }

  Handsontable.dom.empty(TH);

  TH.appendChild(input);
}

export function alignHeaders(column, TH) {
  if (column < 0) {
    return;
  }

  const alignmentClass = this.isRtl() ? "htRight" : "htLeft";

  if (TH.firstChild) {
    if (headerAlignments.has(column.toString())) {
      Handsontable.dom.removeClass(TH.firstChild, alignmentClass);
      Handsontable.dom.addClass(TH.firstChild, headerAlignments.get(column.toString()));
    } else {
      Handsontable.dom.addClass(TH.firstChild, alignmentClass);
    }
  }
}

export function changeCheckboxCell(event, coords) {
  const target = event.target;

  if (coords.col === -1 && target && target.nodeName === "INPUT") {
    event.preventDefault(); // Handsontable will render checked/unchecked checkbox by it own.

    this.setDataAtRowProp(coords.row, "0", !target.checked);
  }
}
