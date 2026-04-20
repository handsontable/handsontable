import { useRef } from 'react';
import { HotTable, HotTableRef } from '@handsontable/react-wrapper';
import { registerAllModules } from 'handsontable/registry';
import ExcelJS from 'exceljs';

registerAllModules();

const q1Data = [
  ['Alice Martin',  'North', 142000, true ],
  ['Bob Chen',      'East',   98500, true ],
  ['Carol Davies',  'South',  76200, false],
  ['David Kim',     'West',  115300, true ],
  ['Eva Rossi',     'North',  54800, false],
];

const q2Data = [
  ['Alice Martin',  'North', 158000, true ],
  ['Bob Chen',      'East',  112400, true ],
  ['Carol Davies',  'South',  89100, true ],
  ['David Kim',     'West',   97600, false],
  ['Eva Rossi',     'North',  63200, true ],
];

const columns = [
  { type: 'text' as const },
  { type: 'dropdown' as const, source: ['North', 'South', 'East', 'West'] },
  {
    type: 'numeric' as const,
    locale: 'en-US',
    numericFormat: { style: 'currency', currency: 'USD', minimumFractionDigits: 2 },
  },
  { type: 'checkbox' as const },
];

const ExampleComponent = () => {
  const hotQ1Ref = useRef<HotTableRef>(null);
  const hotQ2Ref = useRef<HotTableRef>(null);

  const exportSheets = async () => {
    const hotQ1 = hotQ1Ref.current?.hotInstance;
    const exportPlugin = hotQ1?.getPlugin('exportFile');

    await exportPlugin?.downloadFileAsync('xlsx', {
      filename: 'Annual-Sales-Report',
      sheets: [
        { instance: hotQ1!, name: 'Q1 Sales', colHeaders: true, rowHeaders: true },
        { instance: hotQ2Ref.current?.hotInstance!, name: 'Q2 Sales', colHeaders: true, rowHeaders: true },
      ],
    });
  };

  const sharedProps = {
    columns,
    colHeaders: ['Name', 'Region', 'Revenue ($)', 'Hit Target?'],
    rowHeaders: true,
    height: 'auto' as const,
    autoWrapRow: true,
    autoWrapCol: true,
    exportFile: { engines: { xlsx: ExcelJS } },
    licenseKey: 'non-commercial-and-evaluation' as const,
  };

  return (
    <>
      <div className="example-controls-container">
        <div className="controls">
          <button onClick={exportSheets}>Export XLSX</button>
        </div>
      </div>
      <p><strong>Q1 Sales</strong></p>
      <HotTable ref={hotQ1Ref} data={q1Data} {...sharedProps} />
      <p><strong>Q2 Sales</strong></p>
      <HotTable ref={hotQ2Ref} data={q2Data} {...sharedProps} />
    </>
  );
};

export default ExampleComponent;
