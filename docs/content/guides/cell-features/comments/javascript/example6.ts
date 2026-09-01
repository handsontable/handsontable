import Handsontable from 'handsontable/base';
import { registerAllModules } from 'handsontable/registry';

// Register all Handsontable's modules.
registerAllModules();

const container = document.querySelector('#example6')!;

const hot = new Handsontable(container, {
  data: [
    ['Update API docs', 'Ana García', 'In progress'],
    ['Deploy hotfix', 'James Okafor', 'Blocked'],
    ['Review pull requests', 'Li Wei', 'Done'],
    ['Plan Q3 roadmap', 'Maria Santos', 'In progress'],
    ['Refactor auth module', 'David Kim', 'In review'],
  ],
  colHeaders: ['Task', 'Assignee', 'Status'],
  rowHeaders: true,
  comments: true,
  cell: [
    { row: 1, col: 2, comment: { value: 'Waiting on infrastructure approval.' } },
    { row: 3, col: 1, comment: { value: 'Reassign if capacity is tight.' } },
    { row: 4, col: 0, comment: { value: 'Blocked on the security review.' } },
  ],
  height: 'auto',
  autoWrapRow: true,
  autoWrapCol: true,
  licenseKey: 'non-commercial-and-evaluation',
});

const button = document.querySelector('#list-comments')!;
const output = document.querySelector('#comments-output')!;

button.addEventListener('click', () => {
  const found: string[] = [];

  // `getCellMetaAtRow()` takes a physical row index (equal to the visual index here, with no sorting or trimming).
  for (let row = 0; row < hot.countRows(); row += 1) {
    hot.getCellMetaAtRow(row).forEach((cellMeta, col) => {
      const comment = cellMeta.comment as { value?: string } | undefined;

      if (comment?.value !== undefined) {
        found.push(`Row ${row + 1}, "${hot.getColHeader(col)}": ${comment.value}`);
      }
    });
  }

  output.textContent = found.length > 0 ? found.join('\n') : 'No comments found.';
});
