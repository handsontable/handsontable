import Handsontable from "handsontable";

const headerAlignments = new Map([
  ["9", "htCenter"],
  ["10", "htRight"],
  ["12", "htCenter"],
]);

export function alignHeaders(column, TH) {
  if (column < 0) {
    return;
  }

  if (TH.firstChild) {
    const alignmentClass = this.isRtl() ? "htRight" : "htLeft";

    if (headerAlignments.has(column.toString())) {
      Handsontable.dom.removeClass(TH.firstChild, alignmentClass);
      Handsontable.dom.addClass(
        TH.firstChild,
        headerAlignments.get(column.toString())
      );
    } else {
      Handsontable.dom.addClass(TH.firstChild, alignmentClass);
    }
  }
}