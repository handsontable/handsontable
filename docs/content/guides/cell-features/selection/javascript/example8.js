import Handsontable from 'handsontable/base';
import { registerAllModules } from 'handsontable/registry';
// Register all Handsontable's modules.
registerAllModules();
const container = document.querySelector('#example8');
const hot = new Handsontable(container, {
    data: [
        ['Ana García', 'Engineering', 'Senior Engineer', 95000, 'Madrid', 12],
        ['James Okafor', 'Marketing', 'Product Manager', 88000, 'Lagos', 8],
        ['Li Wei', 'Engineering', 'Frontend Dev', 82000, 'Shanghai', 5],
        ['Maria Santos', 'HR', 'HR Specialist', 71000, 'Lisbon', 3],
        ['David Kim', 'Engineering', 'Backend Dev', 85000, 'Seoul', 7],
        ['Emma Wilson', 'Marketing', 'SEO Analyst', 68000, 'London', 2],
        ['Ahmed Hassan', 'Finance', 'Controller', 92000, 'Cairo', 10],
        ['Sara Johansson', 'Engineering', 'QA Engineer', 78000, 'Stockholm', 6],
    ],
    colHeaders: ['Name', 'Department', 'Role', 'Salary', 'City', 'Tenure'],
    rowHeaders: true,
    width: 'auto',
    height: 'auto',
    moveCells: true,
    autoWrapRow: true,
    autoWrapCol: true,
    licenseKey: 'non-commercial-and-evaluation',
});
// Pre-select an interior range so the move border is immediately discoverable.
hot.selectCell(1, 1, 3, 3);
