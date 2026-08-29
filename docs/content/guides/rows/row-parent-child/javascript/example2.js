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
const container = document.querySelector('#example2');
const output = document.querySelector('#output');
const hot = new Handsontable(container, {
  data: projectPlan,
  columns: [{ data: 'task' }, { data: 'owner' }, { data: 'status' }],
  colHeaders: ['Task', 'Owner', 'Status'],
  rowHeaders: true,
  nestedRows: true,
  contextMenu: true,
  height: 'auto',
  licenseKey: 'non-commercial-and-evaluation',
});
const plugin = hot.getPlugin('nestedRows');
const log = (message) => {
  output.innerText = message;
};
document.querySelector('#collapseAll').addEventListener('click', () => {
  plugin.collapseAll();
  log(`collapseAll() -> ${hot.countRows()} rows are visible now`);
});
document.querySelector('#expandAll').addEventListener('click', () => {
  plugin.expandAll();
  log(`expandAll() -> ${hot.countRows()} rows are visible now`);
});
document.querySelector('#toggleFirst').addEventListener('click', () => {
  // `toggleParent` takes a visual row index and returns `true` when the state changed.
  const changed = plugin.toggleParent(0);
  log(`toggleParent(0) -> ${changed}, collapsed: ${plugin.isParentCollapsed(0)}`);
});
document.querySelector('#readState').addEventListener('click', () => {
  // `getCollapsedParents` returns physical row indexes, because a parent collapsed inside
  // another collapsed parent has no visual index at all.
  log(`getCollapsedParents() -> [${plugin.getCollapsedParents()}]\n` +
    `getRowLevel(0) -> ${plugin.getRowLevel(0)}\n` +
    `countChildren(0) -> ${plugin.countChildren(0)}`);
});
