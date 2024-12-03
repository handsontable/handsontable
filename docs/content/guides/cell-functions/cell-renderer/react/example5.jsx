import { useRef } from 'react';
import { HotTable } from '@handsontable/react-wrapper';
import { registerAllModules } from 'handsontable/registry';
import { textRenderer } from 'handsontable/renderers/textRenderer';
import 'handsontable/styles/handsontable.css';
import 'handsontable/styles/ht-theme-main.css';

// register Handsontable's modules
registerAllModules();

const ExampleComponent = () => {
  const hotRef = useRef(null);
  let isChecked = false;

  function customRenderer(_instance, td) {
    textRenderer.apply(this, arguments);

    if (isChecked) {
      td.style.backgroundColor = 'yellow';
    } else {
      td.style.backgroundColor = 'rgba(255,255,255,0.1)';
    }
  }

  const exampleContainerMouseupCallback = (event) => {
    const hot = hotRef.current?.hotInstance;

    if (
      event.target.nodeName == 'INPUT' &&
      event.target.className == 'checker'
    ) {
      isChecked = !event.target.checked;
      hot?.render();
    }
  };

  return (
    <div
      id="exampleContainer5"
      onMouseUp={(...args) => exampleContainerMouseupCallback(...args)}
    >
      <HotTable
        ref={hotRef}
        height="auto"
        columns={[{}, { renderer: customRenderer }]}
        colHeaders={function (col) {
          switch (col) {
            case 0:
              return '<b>Bold</b> and <em>Beautiful</em>';
            case 1:
              return `Some <input type="checkbox" class="checker" ${
                isChecked ? `checked="checked"` : ''
              }> checkbox`;
            default:
              return '';
          }
        }}
        autoWrapRow={true}
        autoWrapCol={true}
        licenseKey="non-commercial-and-evaluation"
      />
    </div>
  );
};

export default ExampleComponent;
