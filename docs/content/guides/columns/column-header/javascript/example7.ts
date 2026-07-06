import Handsontable from 'handsontable/base';
import { registerAllModules } from 'handsontable/registry';

// Register all Handsontable's modules.
registerAllModules();

const container = document.querySelector('#example7')!;

new Handsontable(container, {
  data: [
    [1, 'Ana Garcia', 'Product Manager', 'Spain', '2022-03-14'],
    [2, 'James Okafor', 'Senior Engineer', 'Nigeria', '2021-07-02'],
    [3, 'Li Wei', 'Data Analyst', 'China', '2023-01-19'],
    [4, 'Sofia Rossi', 'UX Designer', 'Italy', '2020-11-30'],
    [5, 'Mateo Fernandez', 'Engineering Lead', 'Argentina', '2019-05-08'],
  ],
  colHeaders: ['Employee ID', 'Employee full name', 'Current job title', 'Country of residence', 'Employment start date'],
  rowHeaders: true,
  colWidths: [100, 130, 130, 130, 130],
  columnHeaderHeight: 50,
  height: 'auto',
  autoWrapRow: true,
  autoWrapCol: true,
  licenseKey: 'non-commercial-and-evaluation',
});
