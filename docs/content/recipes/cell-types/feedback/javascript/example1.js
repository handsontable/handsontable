import Handsontable from 'handsontable/base';
import { registerAllModules } from 'handsontable/registry';
import { editorFactory } from 'handsontable/editors';
import { registerCellType } from 'handsontable/cellTypes';

// Register all Handsontable's modules.
registerAllModules();

/* start:skip-in-preview */
const data = [
  { feature: 'Dark Mode', category: 'UI', priority: 'High', feedback: '👍', votes: 124, status: 'Planned' },
  { feature: 'Bulk Edit', category: 'Core', priority: 'High', feedback: '👍', votes: 98, status: 'In Progress' },
  { feature: 'AI Suggestions', category: 'Beta', priority: 'Medium', feedback: '🤷', votes: 45, status: 'Research' },
  { feature: 'Offline Mode', category: 'Infra', priority: 'Low', feedback: '👎', votes: 12, status: 'Backlog' },
];
/* end:skip-in-preview */
// Get the DOM element with the ID 'example1' where the Handsontable will be rendered
const container = document.querySelector('#example1');
const cellDefinition = {
  editor: editorFactory({
    config: ['👍', '👎', '🤷'],
    value: '👍',
    shortcuts: [
      {
        keys: [['ArrowRight'], ['Tab']],
        callback: (editor, _event) => {
          let index = editor.config.indexOf(editor.value);

          index = index === editor.config.length - 1 ? 0 : index + 1;
          editor.setValue(editor.config[index]);

          return false; // Prevent default tabbing behavior
        },
      },
      {
        keys: [['ArrowLeft']],
        callback: (editor, _event) => {
          let index = editor.config.indexOf(editor.value);

          index = index === 0 ? editor.config.length - 1 : index - 1;
          editor.setValue(editor.config[index]);
        },
      },
    ],
    render: (editor) => {
      editor.input.innerHTML = editor.config
        .map((option) => `<button class="${editor.value === option ? 'active' : ''}">${option}</button>`)
        .join('');
    },
    init: (editor) => {
      editor.input = document.createElement('DIV');
      editor.input.classList.add('feedback-editor');
      editor._openedAt = 0;
      editor.input.addEventListener('click', (event) => {
        // Ignore synthetic click events that Android fires right after the editor
        // opens — they land on the button that just appeared at the touch position.
        if (Date.now() - editor._openedAt < 300) {
          return;
        }
        if (event.target instanceof HTMLButtonElement) {
          editor.setValue(event.target.innerText);
          editor.finishEditing();
        }
      });
      editor.render(editor);
    },
    afterOpen: (editor) => {
      editor._openedAt = Date.now();
    },
    beforeOpen: (editor, { originalValue, cellProperties }) => {
      editor.setValue(originalValue);
    },
  }),
};

registerCellType('feedback', cellDefinition);

// Define configuration options for the Handsontable
const hotOptions = {
  data,
  colHeaders: ['Feature', 'Category', 'Priority', 'Feedback', 'Votes', 'Status'],
  autoRowSize: true,
  rowHeaders: true,
  autoWrapRow: true,
  height: 'auto',
  width: '100%',
  headerClassName: 'htLeft',
  columns: [
    { data: 'feature', type: 'text', width: 200 },
    { data: 'category', type: 'text', width: 90 },
    { data: 'priority', type: 'text', width: 100 },
    { data: 'feedback', width: 100, type: 'feedback' },
    { data: 'votes', type: 'numeric', width: 60 },
    { data: 'status', type: 'text', width: 120 },
  ],
  licenseKey: 'non-commercial-and-evaluation',
};

// Initialize the Handsontable instance with the specified configuration options
// eslint-disable-next-line no-unused-vars
const hot = new Handsontable(container, hotOptions);
