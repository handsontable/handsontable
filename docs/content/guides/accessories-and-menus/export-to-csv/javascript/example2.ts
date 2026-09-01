import Handsontable from 'handsontable/base';
import { registerAllModules } from 'handsontable/registry';
import { ExportFile } from 'handsontable/plugins';

// Register all Handsontable's modules.
registerAllModules();

const container = document.querySelector('#example2')!;

const hot = new Handsontable(container, {
  data: [
    ['Spring Launch', 'Email', 'North America', '1240', '4.2%', '$12000', 'Q1 2025'],
    ['Partner Webinar', 'Paid Search', 'EMEA', '860', '6.1%', '$9400', 'Q1 2025'],
    ['Summer Upsell', 'Social', 'APAC', '1520', '3.7%', '$13800', 'Q2 2025'],
    ['Product Video', 'Email', 'North America', '980', '5.4%', '$8600', 'Q2 2025'],
    ['Back-to-School', 'Display', 'LATAM', '1110', '4.8%', '$10100', 'Q3 2025'],
    ['Holiday Teaser', 'Affiliate', 'EMEA', '1340', '5.9%', '$12700', 'Q4 2025'],
    ['Loyalty Drive', 'SMS', 'APAC', '790', '7.3%', '$6200', 'Q4 2025'],
  ],
  colHeaders: true,
  rowHeaders: true,
  hiddenRows: { rows: [1, 3, 5], indicators: true },
  hiddenColumns: { columns: [1, 3, 5], indicators: true },
  height: 'auto',
  autoWrapRow: true,
  autoWrapCol: true,
  licenseKey: 'non-commercial-and-evaluation',
});

const exportPlugin: ExportFile = hot.getPlugin('exportFile');

const button = document.querySelector('#export-blob')!;

button.addEventListener('click', () => {
  const exportedBlob = exportPlugin.exportAsBlob('csv', {
    bom: false,
    columnDelimiter: ',',
    colHeaders: false,
    exportHiddenColumns: false,
    exportHiddenRows: false,
    mimeType: 'text/csv',
    rowDelimiter: '\r\n',
    rowHeaders: true,
  });

  console.log(exportedBlob);
});
