import { HotTable, HotColumn } from '@handsontable/react-wrapper';
import { registerAllModules } from 'handsontable/registry';
import { CellProperties } from 'handsontable/settings';
import { BaseEditor } from 'handsontable/editors/baseEditor';
import { editorFactory } from 'handsontable/editors';
import { registerCellType } from 'handsontable/cellTypes';
import './example1.css';

registerAllModules();

/* start:skip-in-preview */
const data = [
  { feature: 'Dark Mode', category: 'UI', priority: 'High', feedback: '👍', votes: 124, status: 'Planned' },
  { feature: 'Bulk Edit', category: 'Core', priority: 'High', feedback: '👍', votes: 98, status: 'In Progress' },
  { feature: 'AI Suggestions', category: 'Beta', priority: 'Medium', feedback: '🤷', votes: 45, status: 'Research' },
  { feature: 'Offline Mode', category: 'Infra', priority: 'Low', feedback: '👎', votes: 12, status: 'Backlog' },
];
/* end:skip-in-preview */

interface FeedbackEditorInstance {
  input: HTMLDivElement;
  value: string;
  config: string[];
  _openedAt: number;
}

const feedbackCellDefinition: Pick<CellProperties, 'renderer' | 'validator' | 'editor'> = {
  editor: editorFactory<FeedbackEditorInstance>({
    config: ['👍', '👎', '🤷'],
    value: '👍',
    shortcuts: [
      {
        keys: [['ArrowRight'], ['Tab']],
        callback: (editor, _event) => {
          let index = editor.config.indexOf(editor.value);

          index = index === editor.config.length - 1 ? 0 : index + 1;
          editor.setValue(editor.config[index]);

          return false;
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
        .map(
          (option) =>
            `<button class="${editor.value === option ? 'active' : ''}">${option}</button>`,
        )
        .join('');
    },
    init: (editor) => {
      editor.input = document.createElement('DIV') as HTMLDivElement;
      editor.input.classList.add('feedback-editor');
      editor._openedAt = 0;
      editor.input.addEventListener('click', (event) => {
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
    beforeOpen: (editor, { originalValue }) => {
      editor.setValue(originalValue);
    },
  }),
};

registerCellType('feedback', feedbackCellDefinition as BaseEditor);

const ExampleComponent = () => {
  return (
    <HotTable
      data={data}
      colHeaders={['Feature', 'Category', 'Priority', 'Feedback', 'Votes', 'Status']}
      autoRowSize={true}
      rowHeaders={true}
      autoWrapRow={true}
      height="auto"
      width="100%"
      headerClassName="htLeft"
      licenseKey="non-commercial-and-evaluation"
    >
      <HotColumn data="feature" type="text" width={200} />
      <HotColumn data="category" type="text" width={90} />
      <HotColumn data="priority" type="text" width={100} />
      <HotColumn data="feedback" type="feedback" width={100} />
      <HotColumn data="votes" type="numeric" width={60} />
      <HotColumn data="status" type="text" width={120} />
    </HotTable>
  );
};

export default ExampleComponent;
