import Handsontable from "handsontable";

const headerAlignments = new Map([
  ["9", "htCenter"],
  ["10", "htRight"],
  ["12", "htCenter"],
]);

export function alignHeaders(
  this: Handsontable,
  column: number,
  TH: HTMLTableCellElement
) {
  if (column < 0) {
    return;
  }

  const alignmentClass = this.isRtl() ? "htRight" : "htLeft";

  if (TH.firstChild) {
    if (headerAlignments.has(column.toString())) {
      Handsontable.dom.removeClass(
        TH.firstChild as HTMLElement,
        alignmentClass
      );
      Handsontable.dom.addClass(
        TH.firstChild as HTMLElement,
        headerAlignments.get(column.toString()) as string
      );
    } else {
      Handsontable.dom.addClass(TH.firstChild as HTMLElement, alignmentClass);
    }
  }
}
