import { useRef, MouseEvent } from 'react';
import Handsontable from 'handsontable';
import { HotTable, HotTableRef } from '@handsontable/react-wrapper';
import { registerAllModules } from 'handsontable/registry';
import { textRenderer } from 'handsontable/renderers/textRenderer';
import 'handsontable/styles/handsontable.css';
import 'handsontable/styles/ht-theme-main.css';

// register Handsontable's modules
registerAllModules();

const ExampleComponent = () => {
  const hotRef = useRef<HotTableRef>(null);

  let isChecked = false;

  function customRenderer(
    this: Handsontable,
    _instance: Handsontable,
    td: HTMLTableCellElement
  ) {
    textRenderer.apply(this, arguments as any);

    if (isChecked) {
      td.style.backgroundColor = 'yellow';
    } else {
      td.style.backgroundColor = 'rgba(255,255,255,0.1)';
    }
  }

  const exampleContainerMouseupCallback = (event: MouseEvent) => {
    const hot = hotRef.current?.hotInstance;

    if (
      (event.target as HTMLInputElement).nodeName == 'INPUT' &&
      (event.target as HTMLInputElement).className == 'checker'
    ) {
      isChecked = !(event.target as HTMLInputElement).checked;
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
        colHeaders={function (col: number) {
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
