import { useRef } from 'react';
import { HotTable, HotTableRef } from '@handsontable/react-wrapper';
import { registerAllModules } from 'handsontable/registry';
import 'handsontable/styles/handsontable.css';
import 'handsontable/styles/ht-theme-main.css';

// register Handsontable's modules
registerAllModules();

const ExampleComponent = () => {
  const hotRef = useRef<HotTableRef>(null);

  const downloadWithNoSanitizationCallback = () => {
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
    });
  };

  const downloadWithRecommendedSanitizationCallback = () => {
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
      sanitizeValues: true,
    });
  };

  const downloadWithRegexpSanitizationCallback = () => {
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
      sanitizeValues: /WEBSERVICE/,
    });
  };

  const downloadWithFunctionSanitizationCallback = () => {
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
      sanitizeValues: (value) => {
        return /WEBSERVICE/.test(value) ? 'REMOVED SUSPICIOUS CELL CONTENT' : value;
      },
    });
  };

  return (
    <>
      <div className="example-controls-container">
        <div className="controls">
          <button onClick={() => downloadWithNoSanitizationCallback()}>Download CSV with no sanitization</button>
          <button onClick={() => downloadWithRecommendedSanitizationCallback()}>
            Download CSV with recommended sanitization
          </button>
          <button onClick={() => downloadWithRegexpSanitizationCallback()}>
            Download CSV with sanitization using a regexp
          </button>
          <button onClick={() => downloadWithFunctionSanitizationCallback()}>
            Download CSV with sanitization using a function
          </button>
        </div>
      </div>
      <HotTable
        themeName="ht-theme-main"
        ref={hotRef}
        data={[
          ['https://handsontable.com', '=WEBSERVICE(A1)'],
          ['https://github.com', '=WEBSERVICE(A2)'],
          ['http://example.com/malicious-script.exe', '=WEBSERVICE(A3)'],
        ]}
        colHeaders={true}
        rowHeaders={true}
        height="auto"
        autoWrapRow={true}
        autoWrapCol={true}
        licenseKey="non-commercial-and-evaluation"
      />
    </>
  );
};

export default ExampleComponent;
