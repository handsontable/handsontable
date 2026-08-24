import { HotTable } from '@handsontable/react-wrapper';
import { registerAllModules } from 'handsontable/registry';

// register Handsontable's modules
registerAllModules();

const jobTitles = [
  'Software Engineer',
  'Senior Software Engineer',
  'Staff Engineer',
  'Engineering Manager',
  'Product Manager',
  'Product Designer',
  'Data Analyst',
  'Data Scientist',
  'Marketing Specialist',
  'Account Executive',
  'Customer Success Manager',
  'Finance Analyst',
  'Recruiter',
  'Office Manager',
];

const ExampleComponent = () => {
  return (
    <HotTable
      height="auto"
      data={[
        ['Ana García', 'Senior Software Engineer', 'Senior Software Engineer'],
        ['James Okafor', 'Product Manager', 'Product Manager'],
        ['Li Wei', 'Data Scientist', 'Data Scientist'],
        ['Sofia Rossi', 'Account Executive', 'Account Executive'],
      ]}
      colHeaders={['Employee', 'Job title (default)', 'Job title (compact)']}
      columns={[
        {},
        {
          type: 'dropdown',
          source: jobTitles,
        },
        {
          type: 'dropdown',
          source: jobTitles,
          // show 3 options at a time, then scroll
          visibleRows: 3,
        },
      ]}
      autoWrapRow={true}
      autoWrapCol={true}
      licenseKey="non-commercial-and-evaluation"
    />
  );
};

export default ExampleComponent;
