import { useRef } from 'react';
import { HotTable, HotTableRef } from '@handsontable/react-wrapper';
import { registerAllModules } from 'handsontable/registry';

// Register all Handsontable's modules.
registerAllModules();

const ExampleComponent = () => {
  const hotRef = useRef<HotTableRef>(null);

  const onExportClick = () => {
    const hot = hotRef.current?.hotInstance;
    const exportPlugin = hot?.getPlugin('exportExcel');

    exportPlugin?.downloadFile({
      filename: 'Handsontable-XLSX-file_[YYYY]-[MM]-[DD]',
      columnHeaders: true,
      rowHeaders: true,
      formulas: true,
    });
  };

  return (
    <>
      <div className="example-controls-container">
        <div className="controls">
          <button id="export-file" onClick={() => onExportClick()}>
            Download XLSX
          </button>
        </div>
      </div>
      <HotTable
        ref={hotRef}
        data={[
          ['Product', 'Price', 'Tax', '=B2*C2'],
          ['Keyboard', 120, 0.23, '=B3*C3'],
          ['Mouse', 60, 0.23, '=B4*C4'],
        ]}
        colHeaders={['Name', 'Net', 'VAT', 'VAT value']}
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
