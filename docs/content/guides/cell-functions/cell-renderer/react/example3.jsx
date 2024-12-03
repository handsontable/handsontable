import { HotTable } from '@handsontable/react-wrapper';
import { registerAllModules } from 'handsontable/registry';
import 'handsontable/styles/handsontable.css';
import 'handsontable/styles/ht-theme-main.css';

// register Handsontable's modules
registerAllModules();

const ExampleComponent = () => {
  return (
    <HotTable
      id="hot"
      data={[
        [
          'A1',
          '{{$basePath}}/img/examples/professional-javascript-developers-nicholas-zakas.jpg',
        ],
        ['A2', '{{$basePath}}/img/examples/javascript-the-good-parts.jpg'],
      ]}
      columns={[
        {},
        {
          renderer(instance, td, row, col, prop, value, cellProperties) {
            const img = document.createElement('img');

            img.src = value;
            img.addEventListener('mousedown', (event) => {
              event.preventDefault();
            });
            td.innerText = '';
            td.appendChild(img);

            return td;
          },
        },
      ]}
      colHeaders={true}
      rowHeights={55}
      height="auto"
      autoWrapRow={true}
      autoWrapCol={true}
      licenseKey="non-commercial-and-evaluation"
    />
  );
};

export default ExampleComponent;
