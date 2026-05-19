import Handsontable from "handsontable";

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

