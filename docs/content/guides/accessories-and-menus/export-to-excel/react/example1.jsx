import { useRef } from 'react';
import { HotTable } from '@handsontable/react-wrapper';
import { registerAllModules } from 'handsontable/registry';

registerAllModules();

function createExceljsDependency() {
  class WorksheetMock {
    rows = [];
    addRow(values) {
      this.rows.push(values);
    }
  }
  class WorkbookMock {
    worksheets = [];
    xlsx = {
      writeBuffer: async () => {
        const textEncoder = new TextEncoder();

        return textEncoder.encode(JSON.stringify(this.worksheets.map(({ rows }) => rows))).buffer;
      },
    };
    addWorksheet() {
      const worksheet = new WorksheetMock();

      this.worksheets.push(worksheet);

      return worksheet;
    }
  }
  return {
    Workbook: WorkbookMock,
  };
}

const exceljsDependency = createExceljsDependency();
const ExampleComponent = () => {
  const hotRef = useRef(null);
  const buttonClickCallback = async () => {
    const hot = hotRef.current?.hotInstance;
    const exportPlugin = hot?.getPlugin('exportExcel');

    await exportPlugin?.downloadFile({
      filename: 'Handsontable-XLSX-file_[YYYY]-[MM]-[DD]',
      sheetName: 'Report',
      formulas: true,
      columnHeaders: true,
      rowHeaders: true,
    });
  };

  return (
    <>
      <div className="example-controls-container">
        <div className="controls">
          <button id="export-file" onClick={() => buttonClickCallback()}>
            Download XLSX
          </button>
        </div>
      </div>
      <HotTable
        ref={hotRef}
        data={[
          ['A1', 'B1', '=SUM(1,1)'],
          ['A2', 'B2', '=SUM(2,2)'],
          ['A3', 'B3', '=SUM(3,3)'],
        ]}
        colHeaders={true}
        rowHeaders={true}
        exportExcel={{ exceljs: exceljsDependency }}
        height="auto"
        autoWrapRow={true}
        autoWrapCol={true}
        licenseKey="non-commercial-and-evaluation"
      />
    </>
  );
};

export default ExampleComponent;
