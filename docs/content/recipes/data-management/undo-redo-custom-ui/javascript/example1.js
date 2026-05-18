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
const rootContainer = document.querySelector('#example1');
if (rootContainer instanceof HTMLElement) {
    const toolbar = document.createElement('div');
    const controls = document.createElement('div');
    const gridContainer = document.createElement('div');
    toolbar.className = 'example-controls-container';
    controls.className = 'controls';
    const undoButton = document.createElement('button');
    const redoButton = document.createElement('button');
    undoButton.type = 'button';
    undoButton.textContent = 'Undo';
    redoButton.type = 'button';
    redoButton.textContent = 'Redo';
    controls.appendChild(undoButton);
    controls.appendChild(redoButton);
    toolbar.appendChild(controls);
    rootContainer.appendChild(toolbar);
    rootContainer.appendChild(gridContainer);
    const hot = new Handsontable(gridContainer, {
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
    const undoRedoPlugin = hot.getPlugin('undoRedo');
    function updateButtonsState() {
        undoButton.disabled = !undoRedoPlugin.isUndoAvailable();
        redoButton.disabled = !undoRedoPlugin.isRedoAvailable();
    }
    undoButton.addEventListener('click', () => {
        undoRedoPlugin.undo();
        updateButtonsState();
    });
    redoButton.addEventListener('click', () => {
        undoRedoPlugin.redo();
        updateButtonsState();
    });
    updateButtonsState();
}
