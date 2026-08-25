import Handsontable from 'handsontable/base';
import { registerAllModules } from 'handsontable/registry';
// Register all Handsontable's modules.
registerAllModules();
const projectPlan = [
  {
    task: 'Marketing',
    owner: 'Dana',
    status: 'In progress',
    __children: [
      {
        task: 'Website refresh',
        owner: 'Ivy',
        status: 'In progress',
        __children: [
          { task: 'Copywriting', owner: 'Leo', status: 'Done' },
          { task: 'Visual design', owner: 'Mia', status: 'In review' },
        ],
      },
      { task: 'Ad campaign', owner: 'Nico', status: 'Planned' },
    ],
  },
  {
    task: 'Engineering',
    owner: 'Sam',
    status: 'In progress',
    __children: [
      {
        task: 'API v2',
        owner: 'Ravi',
        status: 'In progress',
        __children: [{ task: 'Auth endpoints', owner: 'Tess', status: 'Done' }],
      },
      { task: 'Bug triage', owner: 'Kai', status: 'Planned' },
    ],
  },
];
const container = document.querySelector('#example3');
const output = document.querySelector('#revealOutput');
// Physical row indexes follow the source data, depth first. Walk the tree once to map every task
// name to its physical row - that is the index `expandToRow` needs.
const physicalRowOf = new Map();
let physicalRow = 0;
(function walk(rows) {
  rows.forEach((row) => {
    physicalRowOf.set(row.task, physicalRow);
    physicalRow += 1;
    walk(row.__children ?? []);
  });
})(projectPlan);
const hot = new Handsontable(container, {
  data: projectPlan,
  columns: [{ data: 'task' }, { data: 'owner' }, { data: 'status' }],
  colHeaders: ['Task', 'Owner', 'Status'],
  rowHeaders: true,
  nestedRows: true,
  height: 'auto',
  licenseKey: 'non-commercial-and-evaluation',
  afterInit() {
    this.getPlugin('nestedRows').collapseAll();
  },
});
const plugin = hot.getPlugin('nestedRows');
// Reveals a task that is currently hidden inside collapsed parents, then selects it.
const revealTask = (taskName) => {
  const row = physicalRowOf.get(taskName);
  const wasHidden = hot.toVisualRow(row) === null;
  // `expandToRow` takes a PHYSICAL index, because a hidden row has no visual index yet.
  plugin.expandToRow(row);
  const visualRow = hot.toVisualRow(row);
  hot.selectCell(visualRow, 0);
  output.innerText =
    `"${taskName}" was ${wasHidden ? 'hidden' : 'already visible'}.\n` +
      `physical row ${row} -> visual row ${visualRow}, nesting level ${plugin.getRowLevel(visualRow)}`;
};
document.querySelector('#findAuth').addEventListener('click', () => revealTask('Auth endpoints'));
document.querySelector('#findDesign').addEventListener('click', () => revealTask('Visual design'));
document.querySelector('#collapseBack').addEventListener('click', () => {
  plugin.collapseAll();
  output.innerText = `Collapsed again - ${hot.countRows()} rows are visible.`;
});
