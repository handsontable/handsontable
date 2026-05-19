import { useRef } from 'react';
import { HotTable } from '@handsontable/react-wrapper';
import { registerAllModules } from 'handsontable/registry';
import { jsPDF } from 'jspdf';
import { autoTable } from 'jspdf-autotable';

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

const ExampleComponent = () => {
  const hotRef = useRef(null);

  const exportGridToPdf = () => {
    const hot = hotRef.current?.hotInstance;

    if (!hot) {
      return;
    }

    const body = hot.getData();
    const colCount = hot.countCols();
    const head = [
      Array.from({ length: colCount }, (_, col) => String(hot.getColHeader(col))),
    ];

    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

    autoTable(doc, {
      head,
      body,
      styles: { fontSize: 8, cellPadding: 1.5, overflow: 'linebreak' },
      headStyles: {
        fillColor: [26, 66, 232],
        textColor: 255,
        fontStyle: 'bold',
      },
      alternateRowStyles: { fillColor: [245, 247, 250] },
      margin: { top: 14, left: 12, right: 12, bottom: 14 },
      showHead: 'everyPage',
    });

    doc.save('export.pdf');
  };

  return (
    <>
      <div className="example-controls-container">
        <div className="controls">
          <button type="button" onClick={exportGridToPdf}>
            Export to PDF
          </button>
        </div>
      </div>
      <HotTable
        ref={hotRef}
        data={data}
        colHeaders={['SKU', 'Product', 'Qty', 'Unit price', 'Line total']}
        columnSorting={true}
        rowHeaders={true}
        height={320}
        width="100%"
        licenseKey="non-commercial-and-evaluation"
      />
    </>
  );
};

export default ExampleComponent;
