import { useRef, useState, useEffect } from 'react';
import { HotTable } from '@handsontable/react';
import { registerAllModules } from 'handsontable/registry';
import 'handsontable/dist/handsontable.full.min.css';

// register Handsontable's modules
registerAllModules();

// generate an array of arrays with dummy data
const data = new Array(100) // number of rows
  .fill()
  .map((_, row) => new Array(50) // number of columns
    .fill()
    .map((_, column) => `${row}, ${column}`)
  );

const ExampleComponent = () => {
  const [isContainerExpanded, setIsContainerExpanded] = useState(false);
  const hotRef = useRef(null);

  const triggerBtnClickCallback = () => {
    setIsContainerExpanded(!isContainerExpanded);
  };

  useEffect(() => {
    // simulate layout change outside of React lifecycle
    document.getElementById('exampleParent').style.height = isContainerExpanded ? '410px' : '157px';
    hotRef.current.hotInstance.refreshDimensions();
  });

  return (
    <>
      <div className="controls">
        <button
          id="triggerBtn"
          className="button button--primary"
          onClick={(...args) => triggerBtnClickCallback(...args)}
        >
          {isContainerExpanded ? 'Collapse container' : 'Expand container'}
        </button>
      </div>
      <div id="exampleParent" className="exampleParent">
        <HotTable
          data={data}
          rowHeaders={true}
          colHeaders={true}
          width="100%"
          height="100%"
          rowHeights={23}
          colWidths={100}
          autoWrapRow={true}
          autoWrapCol={true}
          licenseKey="non-commercial-and-evaluation"
          ref={hotRef}
        />
      </div>
    </>
  );
};

export default ExampleComponent;
