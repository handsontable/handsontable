import { HotTable } from '@handsontable/react-wrapper';
import { registerAllModules } from 'handsontable/registry';

// register Handsontable's modules
registerAllModules();

const ExampleComponent = () => {
  return (
    <HotTable
      data={[
        ['North America', 4200, 3800, 4500, 12500],
        ['Europe', 3100, 2900, 3300, 9300],
        ['Asia Pacific', 2600, 2400, 2800, 7800],
        ['Latin America', 1500, 1700, 1600, 4800],
        ['Middle East', 1200, 1300, 1450, 3950],
      ]}
      colHeaders={true}
      rowHeaders={true}
      colWidths={90}
      height="auto"
      nestedHeaders={[
        ['Region', { label: 'Q1 2025', colspan: 4 }],
        [
          'Region',
          { label: 'Jan', visibleWhen: 'expanded' },
          { label: 'Feb', visibleWhen: 'expanded' },
          { label: 'Mar', visibleWhen: 'expanded' },
          { label: 'Total', visibleWhen: 'collapsed' },
        ],
      ]}
      collapsibleColumns={true}
      autoWrapRow={true}
      autoWrapCol={true}
      licenseKey="non-commercial-and-evaluation"
    />
  );
};

export default ExampleComponent;
