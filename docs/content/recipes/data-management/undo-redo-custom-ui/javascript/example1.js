import Handsontable from 'handsontable/base';
import { registerAllModules } from 'handsontable/registry';

registerAllModules();

/* start:skip-in-preview */
const data = [
  { id: 1, task: 'Write release notes', status: 'Done', owner: 'Mia' },
  { id: 2, task: 'Update API docs', status: 'In progress', owner: 'Owen' },
  { id: 3, task: 'Review recipes', status: 'Blocked', owner: 'Lena' },
  { id: 4, task: 'Ship hotfix', status: 'Done', owner: 'Kai' },
];
/* end:skip-in-preview */

const container = document.querySelector('#example1');
const controls = document.createElement('div');
controls.classList.add('undo-redo-controls');
controls.innerHTML = `
  <button id="undo-action" type="button">Undo</button>
  <button id="redo-action" type="button">Redo</button>
`;
container.before(controls);

const undoButton = controls.querySelector('#undo-action');
const redoButton = controls.querySelector('#redo-action');

const hot = new Handsontable(container, {
  data,
  colHeaders: ['ID', 'Task', 'Status', 'Owner'],
  rowHeaders: true,
  width: '100%',
  height: 'auto',
  autoWrapRow: true,
  autoWrapCol: true,
  undoRedo: true,
  columns: [
    { data: 'id', type: 'numeric', width: 60, readOnly: true },
    { data: 'task', type: 'text', width: 220 },
    { data: 'status', type: 'text', width: 130 },
    { data: 'owner', type: 'text', width: 120 },
  ],
  afterChange: (_changes, source) => {
    if (source !== 'loadData') {
      updateButtonsState();
    }
  },
  afterUndo: () => {
    updateButtonsState();
  },
  afterRedo: () => {
    updateButtonsState();
  },
  licenseKey: 'non-commercial-and-evaluation',
});

function updateButtonsState() {
  const undoRedoPlugin = hot.getPlugin('undoRedo');

  undoButton.disabled = !undoRedoPlugin.isUndoAvailable();
  redoButton.disabled = !undoRedoPlugin.isRedoAvailable();
}

undoButton.addEventListener('click', () => {
  hot.getPlugin('undoRedo').undo();
  updateButtonsState();
});

redoButton.addEventListener('click', () => {
  hot.getPlugin('undoRedo').redo();
  updateButtonsState();
});

updateButtonsState();
