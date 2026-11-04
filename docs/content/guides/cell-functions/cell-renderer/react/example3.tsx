import { HotTable } from '@handsontable/react-wrapper';
import { registerAllModules } from 'handsontable/registry';

// register Handsontable's modules
registerAllModules();

const data = [
  ['A1', '/docs/img/examples/professional-javascript-developers-nicholas-zakas.jpg'],
  ['A2', '/docs/img/examples/javascript-the-good-parts.jpg'],
];

const ExampleComponent = () => {
  return (
    <HotTable
      // licenseKey="your-license-key" // get a key at https://handsontable.com/pricing/
      id="hot"
      data={data}
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
      minRowHeights={55}
      height="auto"
      autoWrapRow={true}
      autoWrapCol={true}
    />
  );
};

export default ExampleComponent;
