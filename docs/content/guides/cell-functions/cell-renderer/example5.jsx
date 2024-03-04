import { useEffect, useRef } from 'react';
import { HotTable } from '@handsontable/react';
import { registerAllModules } from 'handsontable/registry';
import { textRenderer } from 'handsontable/renderers/textRenderer';
import 'handsontable/dist/handsontable.full.min.css';

// register Handsontable's modules
registerAllModules();

export const ExampleComponent = () => {
  const hotRef = useRef(null);

  let isChecked = false;

  function customRenderer(instance, td) {
    textRenderer.apply(this, arguments);

    if (isChecked) {
      td.style.backgroundColor = 'yellow';
    } else {
      td.style.backgroundColor = 'white';
    }
  }

  const exampleContainerMousedownCallback = event => {
    if (event.target.nodeName == 'INPUT' && event.target.className == 'checker') {
      event.stopPropagation();
    }
  };
  let exampleContainerMouseupCallback;

  useEffect(() => {
    const hot = hotRef.current.hotInstance;

    exampleContainerMouseupCallback = event => {
      if (event.target.nodeName == 'INPUT' && event.target.className == 'checker') {
        isChecked = !event.target.checked;
        hot.render();
      }
    };
  });

  return (
    <div id="exampleContainer5" onMouseUp={(...args) => exampleContainerMouseupCallback(...args)}>
      <HotTable
        ref={hotRef}
        height="auto"
        columns={[
          {},
          { renderer: customRenderer }
        ]}
        colHeaders={
          function(col) {
            switch (col) {
            case 0:
            return '<b>Bold</b> and <em>Beautiful</em>';

            case 1:
            return `Some <input type="checkbox" class="checker" ${isChecked ? `checked="checked"` : ''}> checkbox`;
          }
        }}
        autoWrapRow={true}
        autoWrapCol={true}
        licenseKey="non-commercial-and-evaluation"
      />
    </div>
  );
};

/* start:skip-in-preview */
ReactDOM.render(<ExampleComponent />, document.getElementById('example5'));
/* end:skip-in-preview */