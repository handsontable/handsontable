import { HyperFormula } from 'hyperformula';
import { HotTable } from '@handsontable/react-wrapper';
import { registerAllModules } from 'handsontable/registry';

// register Handsontable's modules
registerAllModules();

const data = [
  ['Acme Corp', '=HYPERLINK("https://example.com/acme", "acme.example.com")'],
  ['Vertex Industries', '=HYPERLINK("https://example.com/vertex", "vertex.example.com")'],
  ['Harbor Goods', '=HYPERLINK("https://example.com/harbor", "harbor.example.com")'],
  ['Alpine Supply Co.', '=HYPERLINK("https://example.com/alpine", "alpine.example.com")'],
  ['Summit Logistics', '=HYPERLINK("https://example.com/summit", "summit.example.com")'],
];

const ExampleComponent = () => {
  return (
    <HotTable
      data={data}
      colHeaders={['Company', 'Website']}
      rowHeaders={true}
      height="auto"
      colWidths={[180, 220]}
      formulas={{ engine: HyperFormula, hyperlinks: true }}
      autoWrapRow={true}
      autoWrapCol={true}
      licenseKey="non-commercial-and-evaluation"
    />
  );
};

export default ExampleComponent;
