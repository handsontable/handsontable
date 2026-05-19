import { useRef } from 'react';
import { HotTable, HotTableRef } from '@handsontable/react-wrapper';
import { registerAllModules } from 'handsontable/registry';
import './example1.css';

registerAllModules();

/* start:skip-in-preview */
const data = [
  { task: 'Deploy API v2', assignee: 'Alice Chen', status: 'In Progress', priority: 'High', dueDate: '2026-05-10' },
  { task: 'Write unit tests', assignee: 'Bob Smith', status: 'To Do', priority: 'Medium', dueDate: '2026-05-15' },
  { task: 'Review PR #142', assignee: 'Carol Davis', status: 'Done', priority: 'Low', dueDate: '2026-04-30' },
  { task: 'Fix login timeout', assignee: 'David Lee', status: 'In Progress', priority: 'High', dueDate: '2026-05-08' },
  { task: 'Update SSL certs', assignee: 'Eve Martin', status: 'To Do', priority: 'Urgent', dueDate: '2026-05-01' },
  { task: 'Migrate DB schema', assignee: 'Frank Wang', status: 'To Do', priority: 'High', dueDate: '2026-05-20' },
  { task: 'Refactor auth module', assignee: 'Grace Kim', status: 'In Progress', priority: 'Medium', dueDate: '2026-05-25' },
  { task: 'Load test staging', assignee: 'Henry Park', status: 'To Do', priority: 'Low', dueDate: '2026-06-01' },
];
/* end:skip-in-preview */

const flaggedRows = new Set<number>();

const ExampleComponent = () => {
  const hotRef = useRef<HotTableRef>(null);

  return (
    <HotTable
      ref={hotRef}
      id="example1"
      data={data}
      rowHeaders={true}
      colHeaders={['Task', 'Assignee', 'Status', 'Priority', 'Due Date']}
      columns={[
        { data: 'task', width: 200 },
        { data: 'assignee', width: 130 },
        { data: 'status', width: 110 },
        { data: 'priority', width: 90 },
        { data: 'dueDate', width: 110 },
      ]}
      height="auto"
      width="100%"
      autoWrapRow={true}
      cells={function(row: number) {
        if (flaggedRows.has(row)) {
          return { className: 'ht-flagged-row' };
        }
      }}
      contextMenu={{
        items: {
          duplicate_row: {
            name: 'Duplicate row',
            callback(_key: string, selection: Array<{ start: { row: number } }>) {
              const hot = hotRef.current?.hotInstance;

              if (!hot) return;

              const row = selection[0].start.row;
              const rowData = hot.getSourceDataAtRow(hot.toPhysicalRow(row)) as Record<string, unknown>;

              hot.alter('insert_row_below', row, 1);
              hot.populateFromArray(row + 1, 0, [Object.values(rowData)]);
            },
          },
          flag_row: {
            name() {
              const row = hotRef.current?.hotInstance?.getSelectedRangeLast()?.from.row;

              return flaggedRows.has(row as number) ? 'Unflag row' : 'Flag row';
            },
            callback(_key: string, selection: Array<{ start: { row: number } }>) {
              const hot = hotRef.current?.hotInstance;

              if (!hot) return;

              const row = selection[0].start.row;

              if (flaggedRows.has(row)) {
                flaggedRows.delete(row);
              } else {
                flaggedRows.add(row);
              }

              hot.render();
            },
          },
          copy_row_as_json: {
            name: 'Copy row as JSON',
            callback(_key: string, selection: Array<{ start: { row: number } }>) {
              const hot = hotRef.current?.hotInstance;

              if (!hot) return;

              const row = selection[0].start.row;
              const rowData = hot.getSourceDataAtRow(hot.toPhysicalRow(row));

              navigator.clipboard.writeText(JSON.stringify(rowData));
            },
          },
          sep1: '-',
          row_above: { name: 'Insert row above' },
          row_below: { name: 'Insert row below' },
          remove_row: { name: 'Remove row' },
          sep2: '-',
          undo: { name: 'Undo' },
          redo: { name: 'Redo' },
        },
      }}
      licenseKey="non-commercial-and-evaluation"
    />
  );
};

export default ExampleComponent;
