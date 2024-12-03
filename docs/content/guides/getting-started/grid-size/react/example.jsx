import { useRef, useState, useEffect } from 'react';
import { HotTable } from '@handsontable/react-wrapper';
import { registerAllModules } from 'handsontable/registry';
import 'handsontable/styles/handsontable.css';
import 'handsontable/styles/ht-theme-main.css';

// register Handsontable's modules
registerAllModules();

// generate an array of arrays with dummy data
const data = new Array(100) // number of rows
  .fill(null)
  .map((_, row) =>
    new Array(50) // number of columns
      .fill(null)
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
    // @ts-ignore
    document.getElementById('exampleParent').style.height = isContainerExpanded
      ? '410px'
      : '157px';
    hotRef.current?.hotInstance?.refreshDimensions();
  });

  return (
    <>
      <div className="controls">
        <button
          id="triggerBtn"
          className="button button--primary"
          onClick={() => triggerBtnClickCallback()}
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
