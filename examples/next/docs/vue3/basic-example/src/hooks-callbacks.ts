import Handsontable from "handsontable";
import type { RowObject } from "handsontable/common";

import { ODD_ROW_CLASS } from "./constants";

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

export function alignHeaders(
  this: Handsontable,
  column: number,
  TH: HTMLTableCellElement
) {
  if (column < 0) {
    return;
  }

  if (!TH.firstChild) {
    return;
  }

  const alignmentClass = this.isRtl() ? "htRight" : "htLeft";
  Handsontable.dom.addClass(TH.firstChild as HTMLElement, alignmentClass);
}

