import { HotTable, HotColumn } from '@handsontable/react-wrapper';
import { registerAllModules } from 'handsontable/registry';
import { Flag, FlagOff } from 'lucide-react';
// Register all Handsontable's modules.
registerAllModules();
const data = [
    { task: 'Update API docs', assignee: 'Ana García', dueDate: '2025-06-30', flagged: true },
    { task: 'Deploy hotfix', assignee: 'James Okafor', dueDate: '2025-06-18', flagged: false },
    { task: 'Review pull request', assignee: 'Li Wei', dueDate: '2025-06-20', flagged: false },
    { task: 'Write release notes', assignee: 'Sara Nowak', dueDate: '2025-06-25', flagged: true },
    { task: 'Fix flaky test', assignee: 'Marco Rossi', dueDate: '2025-06-22', flagged: false },
];
// A renderer component receives the cell's value and coordinates, so the
// Lucide icon goes in as JSX. No `data-lucide` placeholder and no
// `createIcons()` scan - React renders the `<svg>` itself.
//
// Pass a renderer component through `<HotColumn renderer={...}>`, not through
// a `renderer` key in the `columns` array. Only the prop is wrapped for React;
// a component in `columns` reaches the grid as a plain renderer function and
// is called with `(instance, TD, row, ...)` instead of a props object.
const FlagCell = ({ instance, row, value }) => {
    const taskName = String(instance.getDataAtCell(row, 0));
    const flagged = Boolean(value);
    // The icon has no accessible name, so the button carries an `aria-label`
    // that describes what clicking it does.
    const label = flagged
        ? `Remove the follow-up flag from ${taskName}`
        : `Flag ${taskName} for follow-up`;
    return (<button type="button" aria-label={label} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem' }} onClick={() => instance.setDataAtCell(row, 3, !flagged)}>
      {/* `currentColor` is Lucide's default stroke, so the icon stays visible
            in both light and dark themes. */}
      {flagged ? <Flag size={18}/> : <FlagOff size={18}/>}
    </button>);
};
const ExampleComponent = () => {
    return (<HotTable data={data} colHeaders={['Task', 'Assignee', 'Due date', 'Flagged']} height="auto" autoWrapRow={true} autoWrapCol={true} licenseKey="non-commercial-and-evaluation">
      <HotColumn data="task"/>
      <HotColumn data="assignee"/>
      <HotColumn data="dueDate" type="date" dateFormat={{ year: 'numeric', month: '2-digit', day: '2-digit' }}/>
      <HotColumn data="flagged" className="htCenter" renderer={FlagCell}/>
    </HotTable>);
};
export default ExampleComponent;
