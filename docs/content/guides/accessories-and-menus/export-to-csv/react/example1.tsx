import { useRef } from 'react';
import { HotTable, HotTableRef } from '@handsontable/react-wrapper';
import { registerAllModules } from 'handsontable/registry';

// register Handsontable's modules
registerAllModules();

const ExampleComponent = () => {
  const hotRef = useRef<HotTableRef>(null);

  const buttonClickCallback = () => {
    const hot = hotRef.current?.hotInstance;
    const exportPlugin = hot?.getPlugin('exportFile');

    exportPlugin?.downloadFile('csv', {
      bom: false,
      columnDelimiter: ',',
      colHeaders: false,
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
          ['Spring Launch', 'Email', 'North America', '1240', '4.2%', '$12000', 'Q1 2025'],
          ['Partner Webinar', 'Paid Search', 'EMEA', '860', '6.1%', '$9400', 'Q1 2025'],
          ['Summer Upsell', 'Social', 'APAC', '1520', '3.7%', '$13800', 'Q2 2025'],
          ['Product Video', 'Email', 'North America', '980', '5.4%', '$8600', 'Q2 2025'],
          ['Back-to-School', 'Display', 'LATAM', '1110', '4.8%', '$10100', 'Q3 2025'],
          ['Holiday Teaser', 'Affiliate', 'EMEA', '1340', '5.9%', '$12700', 'Q4 2025'],
          ['Loyalty Drive', 'SMS', 'APAC', '790', '7.3%', '$6200', 'Q4 2025'],
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
