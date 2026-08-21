import { useRef, useState } from 'react';
import { HotTable, HotTableRef } from '@handsontable/react-wrapper';
import { registerAllModules } from 'handsontable/registry';

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

const ExampleComponent = () => {
  const hotRef = useRef<HotTableRef>(null);
  const [output, setOutput] = useState('Click a button to call a method.');

  const getPlugin = () => hotRef.current?.hotInstance?.getPlugin('nestedRows');
  const countRows = () => hotRef.current?.hotInstance?.countRows();

  return (
    <>
      <div className="example-controls-container">
        <div className="controls">
          <button
            className="button button--primary"
            onClick={() => {
              getPlugin()?.collapseAll();
              setOutput(`collapseAll() -> ${countRows()} rows are visible now`);
            }}
          >
            collapseAll()
          </button>
          <button
            className="button button--primary"
            onClick={() => {
              getPlugin()?.expandAll();
              setOutput(`expandAll() -> ${countRows()} rows are visible now`);
            }}
          >
            expandAll()
          </button>
          <button
            className="button button--primary"
            onClick={() => {
              // `toggleParent` takes a visual row index and returns `true` when the state changed.
              const plugin = getPlugin();
              const changed = plugin?.toggleParent(0);

              setOutput(`toggleParent(0) -> ${changed}, collapsed: ${plugin?.isParentCollapsed(0)}`);
            }}
          >
            toggleParent(0)
          </button>
          <button
            className="button button--primary"
            onClick={() => {
              // `getCollapsedParents` returns physical row indexes, because a parent collapsed
              // inside another collapsed parent has no visual index at all.
              const plugin = getPlugin();

              setOutput(
                `getCollapsedParents() -> [${plugin?.getCollapsedParents()}]\n` +
                  `getRowLevel(0) -> ${plugin?.getRowLevel(0)}\n` +
                  `countChildren(0) -> ${plugin?.countChildren(0)}`
              );
            }}
          >
            Read the state
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
        contextMenu={true}
        height="auto"
        licenseKey="non-commercial-and-evaluation"
      />
    </>
  );
};

export default ExampleComponent;
