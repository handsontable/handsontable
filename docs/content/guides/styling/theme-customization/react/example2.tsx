import { HotTable } from '@handsontable/react-wrapper';
import { registerAllModules } from 'handsontable/registry';
import { horizonTheme, registerTheme } from 'handsontable/themes';

// Register Handsontable's modules
registerAllModules();

// Register the main theme with custom parameters
const myTheme = registerTheme(horizonTheme);

// Configure theme parameters using the params() method
myTheme.params({
  colors: {
    primary: {
      500: '#9333ea', // Change primary color
    },
  },
  tokens: {
    fontSize: '16px',
    iconSize: 'sizing.size_5',
    accentColor: ['colors.primary.500', 'colors.primary.600'],
  },
});

// Set color scheme and density type
myTheme.setColorScheme('light');
myTheme.setDensityType('default');

const ExampleComponent = () => {
  return (
    <HotTable
      theme={myTheme}
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
      dropdownMenu={true}
      width="100%"
      height="auto"
      licenseKey="non-commercial-and-evaluation"
    />
  );
};

export default ExampleComponent;
