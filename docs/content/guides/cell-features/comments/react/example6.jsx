import { useRef, useState } from 'react';
import { HotTable } from '@handsontable/react-wrapper';
import { registerAllModules } from 'handsontable/registry';
// register Handsontable's modules
registerAllModules();
const ExampleComponent = () => {
    const hotRef = useRef(null);
    const [output, setOutput] = useState('');
    const listComments = () => {
        const hot = hotRef.current?.hotInstance;
        if (!hot) {
            return;
        }
        const found = [];
        // `getCellMetaAtRow()` takes a physical row index (equal to the visual index here, with no sorting or trimming).
        for (let row = 0; row < hot.countRows(); row += 1) {
            hot.getCellMetaAtRow(row).forEach((cellMeta, col) => {
                const comment = cellMeta.comment;
                if (comment?.value !== undefined) {
                    found.push(`Row ${row + 1}, "${hot.getColHeader(col)}": ${comment.value}`);
                }
            });
        }
        setOutput(found.length > 0 ? found.join('\n') : 'No comments found.');
    };
    return (<>
      <div className="example-controls-container">
        <div className="controls">
          <button id="list-comments" onClick={() => listComments()}>
            List all comments
          </button>
        </div>
      </div>
      <HotTable ref={hotRef} data={[
            ['Update API docs', 'Ana García', 'In progress'],
            ['Deploy hotfix', 'James Okafor', 'Blocked'],
            ['Review pull requests', 'Li Wei', 'Done'],
            ['Plan Q3 roadmap', 'Maria Santos', 'In progress'],
            ['Refactor auth module', 'David Kim', 'In review'],
        ]} colHeaders={['Task', 'Assignee', 'Status']} rowHeaders={true} comments={true} cell={[
            { row: 1, col: 2, comment: { value: 'Waiting on infrastructure approval.' } },
            { row: 3, col: 1, comment: { value: 'Reassign if capacity is tight.' } },
            { row: 4, col: 0, comment: { value: 'Blocked on the security review.' } },
        ]} height="auto" autoWrapRow={true} autoWrapCol={true} licenseKey="non-commercial-and-evaluation"/>
      <output className="comments-output" style={{ whiteSpace: 'pre-wrap' }}>
        {output}
      </output>
    </>);
};
export default ExampleComponent;
