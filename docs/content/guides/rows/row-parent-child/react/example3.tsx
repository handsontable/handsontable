import { useRef, useState } from 'react';
import { HotTable, HotTableRef } from '@handsontable/react-wrapper';
import { registerAllModules } from 'handsontable/registry';
import type Handsontable from 'handsontable/base';

// register Handsontable's modules
registerAllModules();

interface TaskRow {
  task: string;
  owner: string;
  status: string;
  __children?: TaskRow[];
}

const projectPlan: TaskRow[] = [
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

// Physical row indexes follow the source data, depth first. Walk the tree once to map every task
// name to its physical row - that is the index `expandToRow` needs.
const physicalRowOf = new Map<string, number>();

let physicalRow = 0;

(function walk(rows: TaskRow[]) {
  rows.forEach((row) => {
    physicalRowOf.set(row.task, physicalRow);
    physicalRow += 1;
    walk(row.__children ?? []);
  });
})(projectPlan);

const ExampleComponent = () => {
  const hotRef = useRef<HotTableRef>(null);
  const [output, setOutput] = useState('Everything starts collapsed. Pick a task to jump to.');

  // Reveals a task that is currently hidden inside collapsed parents, then selects it.
  const revealTask = (taskName: string) => {
    const hot = hotRef.current?.hotInstance;

    if (!hot) {
      return;
    }

    const plugin = hot.getPlugin('nestedRows');
    const row = physicalRowOf.get(taskName)!;
    const wasHidden = hot.toVisualRow(row) === null;

    // `expandToRow` takes a PHYSICAL index, because a hidden row has no visual index yet.
    plugin.expandToRow(row);

    const visualRow = hot.toVisualRow(row)!;

    hot.selectCell(visualRow, 0);

    setOutput(
      `"${taskName}" was ${wasHidden ? 'hidden' : 'already visible'}.\n` +
        `physical row ${row} -> visual row ${visualRow}, nesting level ${plugin.getRowLevel(visualRow)}`
    );
  };

  return (
    <>
      <div className="example-controls-container">
        <div className="controls">
          <button className="button button--primary" onClick={() => revealTask('Auth endpoints')}>
            Find "Auth endpoints"
          </button>
          <button className="button button--primary" onClick={() => revealTask('Visual design')}>
            Find "Visual design"
          </button>
          <button
            className="button button--primary"
            onClick={() => {
              const hot = hotRef.current?.hotInstance;

              hot?.getPlugin('nestedRows').collapseAll();
              setOutput(`Collapsed again - ${hot?.countRows()} rows are visible.`);
            }}
          >
            Collapse everything
          </button>
        </div>
        <output className="console">{output}</output>
      </div>
      <HotTable
        ref={hotRef}
        data={projectPlan}
        columns={[{ data: 'task' }, { data: 'owner' }, { data: 'status' }]}
        colHeaders={['Task', 'Owner', 'Status']}
        rowHeaders={true}
        nestedRows={true}
        height="auto"
        licenseKey="non-commercial-and-evaluation"
        afterInit={function (this: Handsontable) {
          this.getPlugin('nestedRows').collapseAll();
        }}
      />
    </>
  );
};

export default ExampleComponent;
