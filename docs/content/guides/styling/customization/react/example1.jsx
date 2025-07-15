import { HotTable } from '@handsontable/react-wrapper';
import { registerAllModules } from 'handsontable/registry';
import 'handsontable/styles/handsontable.css';
import 'handsontable/styles/ht-theme-main.css';

// register Handsontable's modules
registerAllModules();

const ExampleComponent = () => {
  return (
    <>
      <style>{`
        .ht-theme-main {
          --ht-accent-color: #2c78d4;
          --ht-foreground-color: #1a2533;
          --ht-background-color: #f8f9fa;
          --ht-row-header-odd-background-color: #f8f9fa;
          --ht-row-header-even-background-color: #e9ecef;
          --ht-row-cell-odd-background-color: #f8f9fa;
          --ht-row-cell-even-background-color: #e9ecef;
          --ht-cell-horizontal-border-color: #cbd5e0;
          --ht-cell-vertical-border-color: #cbd5e0;
          --ht-wrapper-border-color: #a0aec0;
        }
      `}</style>

      <HotTable
        themeName="ht-theme-main"
        data={[
          ['John Doe', 'johndoe@example.com', 'New York', 32, 'Engineer'],
          ['Jane Smith', 'janesmith@example.com', 'Los Angeles', 29, 'Designer'],
          ['Sam Wilson', 'samwilson@example.com', 'Chicago', 41, 'Manager'],
          ['Emily Johnson', 'emilyj@example.com', 'San Francisco', 35, 'Developer'],
          ['Michael Brown', 'mbrown@example.com', 'Boston', 38, 'Analyst'],
        ]}
        colHeaders={['Name', 'Email', 'City', 'Age', 'Position']}
        columns={[
          { data: 0, type: 'text' },
          { data: 1, type: 'text' },
          { data: 2, type: 'text' },
          { data: 3, type: 'numeric' },
          { data: 4, type: 'text' },
        ]}
        rowHeaders={true}
        width="100%"
        height="auto"
        licenseKey="non-commercial-and-evaluation"
      />
    </>
  );
};

export default ExampleComponent;
