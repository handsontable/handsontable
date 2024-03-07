import { HotTable } from '@handsontable/react';
import { textRenderer } from 'handsontable/renderers/textRenderer';
import { registerAllModules } from 'handsontable/registry';
import 'handsontable/dist/handsontable.full.min.css';

// register Handsontable's modules
registerAllModules();

export const ExampleComponent = () => {
  return (
    <HotTable
      id="hot"
      data={[
        ['A1', '{{$basePath}}/img/examples/professional-javascript-developers-nicholas-zakas.jpg'],
        ['A2', '{{$basePath}}/img/examples/javascript-the-good-parts.jpg']
      ]}
      columns={[
        {},
        {
          renderer(instance, td, row, col, prop, value, cellProperties) {
            const img = document.createElement('img');

            img.src = value;

            img.addEventListener('mousedown', event => {
              event.preventDefault();
            });

            td.innerText = '';
            td.appendChild(img);

            return td;
          }
        }
      ]}
      colHeaders={true}
      rowHeights={55}
      height="auto"
      autoWrapRow={true}
      autoWrapCol={true}
      licenseKey="non-commercial-and-evaluation"
    />
  );
}

/* start:skip-in-preview */
ReactDOM.render(<ExampleComponent />, document.getElementById('example3'));
/* end:skip-in-preview */