import { useRef, useState } from 'react';
import { HotTable } from '@handsontable/react-wrapper';
import { registerAllModules } from 'handsontable/registry';
import { HyperFormula } from 'hyperformula';

registerAllModules();

const SAMPLE_URL = '/docs/scripts/xlsx/employees.xlsx';

const hotData = [
  ['Ana García', 'Engineering', 'Senior Engineer', 98000, true, '2022-03-14'],
  ['James Okafor', 'Marketing', 'Marketing Manager', 87500, true, '2021-07-01'],
  ['Li Wei', 'Engineering', 'Product Manager', 104000, false, '2020-11-23'],
  ['Priya Nair', 'Sales', 'Account Executive', 76200, true, '2023-01-09'],
  ['Tom Bakker', 'Support', 'Support Specialist', 58900, true, '2019-05-30'],
];

// The controls and their status live in their own component. A re-render of the component that
// renders `HotTable` makes the wrapper send `data` and `colHeaders` to `updateSettings` again,
// which replaces the imported sheet with the sample rows. A grid fed by a server prop must keep
// its first value, for example with `const [firstRows] = useState(rows);`.
const ImportControls = ({ hotRef }) => {
  const [status, setStatus] = useState('');

  const importWorkbook = async (blob, name) => {
    const importPlugin = hotRef.current?.hotInstance?.getPlugin('importFile');

    if (!importPlugin) {
      // No grid is mounted, for example while it sits in a hidden tab.
      setStatus('The grid is not ready.');

      return;
    }

    try {
      const result = await importPlugin.importFromBlob('xlsx', blob, {
        colHeaders: 'firstRow',
        importStyles: true,
      });

      setStatus(`Imported ${name}`);
      console.log('Dropped features:', result.dropped);
    } catch (error) {
      // A refused file (an .xls, a password-protected or damaged workbook) rejects with a message
      // that says what to do; the grid keeps its data.
      setStatus(error.message);
    }
  };

  const loadSample = async () => {
    const response = await fetch(SAMPLE_URL);

    await importWorkbook(await response.blob(), 'employees.xlsx');
  };

  const importFile = async (event) => {
    const file = event.target.files?.[0];

    if (file) {
      await importWorkbook(file, file.name);
    }

    // Cleared on every path, so picking the same file again fires `change` again. No `finally`:
    // React Compiler does not compile a `try` with a `finally` clause.
    event.target.value = '';
  };

  return (
    <div className="example-controls-container">
      <div className="controls">
        <button onClick={loadSample}>Load sample</button>
        <label htmlFor="import-file">Import XLSX</label>
        <input type="file" id="import-file" accept=".xlsx" onChange={importFile} />
        <output role="status">{status}</output>
      </div>
    </div>
  );
};

const ExampleComponent = () => {
  const hotRef = useRef(null);

  return (
    <>
      <ImportControls hotRef={hotRef} />
      <HotTable
        ref={hotRef}
        data={hotData}
        colHeaders={['Name', 'Department', 'Job title', 'Salary ($)', 'Active', 'Hire date']}
        columns={[
          { type: 'text' },
          { type: 'dropdown', source: ['Engineering', 'Marketing', 'Sales', 'Support'] },
          { type: 'text' },
          { type: 'numeric', numericFormat: { style: 'currency', currency: 'USD', minimumFractionDigits: 2 } },
          { type: 'checkbox' },
          { type: 'date', dateFormat: { year: 'numeric', month: '2-digit', day: '2-digit' } },
        ]}
        rowHeaders={true}
        formulas={{ engine: HyperFormula }}
        comments={true}
        mergeCells={true}
        hiddenColumns={true}
        customBorders={true}
        height="auto"
        autoWrapRow={true}
        autoWrapCol={true}
        importFile={true}
        licenseKey="non-commercial-and-evaluation"
      />
    </>
  );
};

export default ExampleComponent;
