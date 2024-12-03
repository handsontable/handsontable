import { useRef } from 'react';
import { HotTable } from '@handsontable/react-wrapper';
import { registerAllModules } from 'handsontable/registry';
import 'handsontable/styles/handsontable.css';
import 'handsontable/styles/ht-theme-main.css';

// register Handsontable's modules
registerAllModules();

const ExampleComponent = () => {
  const hotRef = useRef(null);
  const buttonClickCallback = () => {
    const hot = hotRef.current?.hotInstance;
    const exportPlugin = hot?.getPlugin('exportFile');

    exportPlugin?.downloadFile('csv', {
      bom: false,
      columnDelimiter: ',',
      columnHeaders: false,
      exportHiddenColumns: true,
      exportHiddenRows: true,
      fileExtension: 'csv',
      filename: 'Handsontable-CSV-file_[YYYY]-[MM]-[DD]',
      mimeType: 'text/csv',
      rowDelimiter: '\r\n',
      rowHeaders: true,
    });
  };

  return (
    <>
      <div className="example-controls-container">
        <div className="controls">
          <button id="export-file" onClick={() => buttonClickCallback()}>
            Download CSV
          </button>
        </div>
      </div>
      <HotTable
        ref={hotRef}
        data={[
          ['A1', 'B1', 'C1', 'D1', 'E1', 'F1', 'G1'],
          ['A2', 'B2', 'C2', 'D2', 'E2', 'F2', 'G2'],
          ['A3', 'B3', 'C3', 'D3', 'E3', 'F3', 'G3'],
          ['A4', 'B4', 'C4', 'D4', 'E4', 'F4', 'G4'],
          ['A5', 'B5', 'C5', 'D5', 'E5', 'F5', 'G5'],
          ['A6', 'B6', 'C6', 'D6', 'E6', 'F6', 'G6'],
          ['A7', 'B7', 'C7', 'D7', 'E7', 'F7', 'G7'],
        ]}
        colHeaders={true}
        rowHeaders={true}
        hiddenRows={{ rows: [1, 3, 5], indicators: true }}
        hiddenColumns={{ columns: [1, 3, 5], indicators: true }}
        height="auto"
        autoWrapRow={true}
        autoWrapCol={true}
        licenseKey="non-commercial-and-evaluation"
      />
    </>
  );
};

export default ExampleComponent;
