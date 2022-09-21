import Handsontable from "handsontable";
import {
  SELECTED_CLASS,
  ODD_ROW_CLASS
} from "./constants";
import { RefObject } from "react";

const headerAlignments = new Map([
  ["9", "htCenter"],
  ["10", "htRight"],
  ["12", "htCenter"]
]);

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
  const input = document.createElement("input");

  input.type = "checkbox";

  if (row >= 0 && this.getDataAtRowProp(row, "0")) {
    input.checked = true;
  }

  Handsontable.dom.empty(TH);

  TH.appendChild(input);
};

export function alignHeaders(this: Handsontable, column: number, TH: HTMLTableCellElement) {
  if (column < 0) {
    return;
  }

  const alignmentClass = this.isRtl() ? "htRight" : "htLeft";

  if (TH.firstChild) {
    if (headerAlignments.has(column.toString())) {
      Handsontable.dom.removeClass(TH.firstChild as HTMLElement, alignmentClass);
      Handsontable.dom.addClass(TH.firstChild as HTMLElement, headerAlignments.get(column.toString()) as string);
    } else {
      Handsontable.dom.addClass(TH.firstChild as HTMLElement, alignmentClass);
    }
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

  if (coords.col === -1 && event.target && target.nodeName === "INPUT") {
    event.preventDefault(); // Handsontable will render checked/unchecked checkbox by it own.

    this.setDataAtRowProp(coords.row, "0", !target.checked);
  }
};

export type EditorInstance = {
  getEditedCellRect: (...args: any[]) => any;
  editorRef: RefObject<HTMLDivElement>;
  hotInstance: Handsontable;
};

type PositionVertically = (editorInstance: EditorInstance) => void;

export const positionVertically: PositionVertically = function positionVertically(editorInstance) {
  const editedCellRect = editorInstance.getEditedCellRect();
  if (editedCellRect) {
    if (editedCellRect.maxHeight < editedCellRect.height) {
      editorInstance.editorRef.current!.style.top = 9 + 'px';
      return;
    }
    if (editedCellRect.top > 0) {
      editorInstance.editorRef.current!.style.top = editedCellRect.top + window.pageYOffset + 9 + 'px';
      return;
    }
  }
}

type PositionHorizontally = (editorInstance: EditorInstance) => void;

export const positionHorizontally: PositionHorizontally = function positionHorizontally(editorInstance) {
  const editedCellRect = editorInstance.getEditedCellRect();
  if (editedCellRect) {
      if (editedCellRect.start < 1) {
        editorInstance.editorRef.current!.style.display = 'none';
        return;
      }
      if (editedCellRect.start > 1 && editorInstance.editorRef.current!.style.display === 'none') {
        editorInstance.editorRef.current!.style.display = 'block';
        return;
      }
      editorInstance.editorRef.current!.style.left = editedCellRect.start + window.pageYOffset + 9 + 'px';
    }
}
