import { useRef } from 'react';
import { HotTable, HotTableRef } from '@handsontable/react-wrapper';
import { registerAllModules } from 'handsontable/registry';

// register Handsontable's modules
registerAllModules();

const data = [
  ['Spring Launch', 'Email', 'North America', '1240', '4.2%', '$12000', 'Q1 2025'],
  ['Partner Webinar', 'Paid Search', 'EMEA', '860', '6.1%', '$9400', 'Q1 2025'],
  ['Summer Upsell', 'Social', 'APAC', '1520', '3.7%', '$13800', 'Q2 2025'],
  ['Product Video', 'Email', 'North America', '980', '5.4%', '$8600', 'Q2 2025'],
  ['Back-to-School', 'Display', 'LATAM', '1110', '4.8%', '$10100', 'Q3 2025'],
  ['Holiday Teaser', 'Affiliate', 'EMEA', '1340', '5.9%', '$12700', 'Q4 2025'],
  ['Loyalty Drive', 'SMS', 'APAC', '790', '7.3%', '$6200', 'Q4 2025'],
];

// Hidden rows and columns stay out of both exports.
const options = {
  colHeaders: true,
  rowHeaders: true,
  exportHiddenColumns: false,
  exportHiddenRows: false,
};

const ExampleComponent = () => {
  const hotRef = useRef<HotTableRef>(null);

  const exportBlob = () => {
    const exportPlugin = hotRef.current?.hotInstance?.getPlugin('exportFile');

    console.log(exportPlugin?.exportAsBlob('csv', options));
  };

  const exportString = () => {
    const exportPlugin = hotRef.current?.hotInstance?.getPlugin('exportFile');

    console.log(exportPlugin?.exportAsString('csv', options));
  };

  return (
    <>
      <div className="example-controls-container">
        <div className="controls">
          <button id="export-blob" onClick={exportBlob}>
            Export as a Blob
          </button>
          <button id="export-string" onClick={exportString}>
            Export as a string
          </button>
        </div>
      </div>
      <HotTable
        ref={hotRef}
        data={data}
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
