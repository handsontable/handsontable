import Handsontable from "handsontable/base";
import { registerAllModules } from "handsontable/registry";
import { jsPDF } from "jspdf";
import { autoTable } from "jspdf-autotable";

registerAllModules();

/* start:skip-in-preview */
// Enough rows to span multiple A4 pages when exported (jspdf-autotable paginates automatically).
const ROWS = 85;
const data = Array.from({ length: ROWS }, (_, row) => [
  `SKU-${1000 + row}`,
  `Product ${row + 1}`,
  row % 12 + 1,
  (9.99 + row * 0.25).toFixed(2),
  ((row % 12 + 1) * (9.99 + row * 0.25)).toFixed(2),
]);
/* end:skip-in-preview */

const container = document.querySelector("#example1")!;

const hot = new Handsontable(container, {
  data,
  colHeaders: ["SKU", "Product", "Qty", "Unit price", "Line total"],
  columnSorting: true,
  rowHeaders: true,
  height: 320,
  width: "100%",
  licenseKey: "non-commercial-and-evaluation",
});

function exportGridToPdf() {
  const body = hot.getData();
  const colCount = hot.countCols();
  const head = [
    Array.from({ length: colCount }, (_, col) => String(hot.getColHeader(col))),
  ];

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  autoTable(doc, {
    head,
    body,
    styles: { fontSize: 8, cellPadding: 1.5, overflow: "linebreak" },
    headStyles: {
      fillColor: [26, 66, 232],
      textColor: 255,
      fontStyle: "bold",
    },
    alternateRowStyles: { fillColor: [245, 247, 250] },
    margin: { top: 14, left: 12, right: 12, bottom: 14 },
    showHead: "everyPage",
  });

  doc.save("export.pdf");
}

document.querySelector("#exportPdfBtn")!.addEventListener("click", exportGridToPdf);
