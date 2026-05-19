import { HotTable } from '@handsontable/react-wrapper';
import { registerAllModules } from 'handsontable/registry';
import { getRenderer } from 'handsontable/renderers';

registerAllModules();

/* start:skip-in-preview */
const data = [
  { name: 'Ana García',    department: 'Engineering',  role: 'Senior Engineer',    salary: 95000,  startDate: '2019-03-12' },
  { name: 'James Okafor',  department: 'Product',      role: 'Product Manager',    salary: 105000, startDate: '2020-07-01' },
  { name: 'Li Wei',        department: 'Design',       role: 'UX Designer',        salary: 88000,  startDate: '2021-01-15' },
  { name: 'Priya Sharma',  department: 'Engineering',  role: 'Tech Lead',          salary: 120000, startDate: '2018-09-05' },
  { name: 'Carlos Mendez', department: 'HR',           role: 'HR Specialist',      salary: 72000,  startDate: '2022-02-20' },
  { name: 'Sarah Chen',    department: 'Finance',      role: 'Financial Analyst',  salary: 91000,  startDate: '2020-11-30' },
  { name: 'Omar Hassan',   department: 'Engineering',  role: 'Backend Engineer',   salary: 98000,  startDate: '2021-06-14' },
  { name: 'Emma Wilson',   department: 'Marketing',    role: 'Marketing Lead',     salary: 85000,  startDate: '2019-08-22' },
];
/* end:skip-in-preview */

const colHeaders = ['Name', 'Department', 'Role', 'Salary', 'Start Date'];

const ExampleComponent = () => {
  return (
    <HotTable
      data={data}
      colHeaders={colHeaders}
      rowHeaders={true}
      height="auto"
      width="100%"
      ariaTags={true}
      tabMoves={{ row: 1, col: 0 }}
      enterMoves={{ row: 1, col: 0 }}
      autoWrapRow={false}
      autoWrapCol={false}
      columnSorting={true}
      columns={[
        { data: 'name' },
        { data: 'department' },
        { data: 'role' },
        { data: 'salary' },
        { data: 'startDate' },
      ]}
      cells={function() {
        return {
          renderer(hotInstance, TD, row, col, prop, value, cellProperties) {
            getRenderer('text')(hotInstance, TD, row, col, prop, value, cellProperties);
            TD.setAttribute('aria-label', `${colHeaders[col]}: ${value ?? 'empty'}`);
          },
        };
      }}
      afterGetColHeader={function(col, TH) {
        if (!TH.hasAttribute('aria-sort')) {
          TH.setAttribute('aria-sort', 'none');
        }
      }}
      licenseKey="non-commercial-and-evaluation"
    />
  );
};

export default ExampleComponent;
