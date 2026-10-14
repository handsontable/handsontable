import { HyperFormula } from 'hyperformula';
import { HotTable } from '@handsontable/react-wrapper';
import { registerAllModules } from 'handsontable/registry';

// register Handsontable's modules
registerAllModules();

const data: string[][] = [
  ['Company', 'Website'],
  ['Acme Corp', '=HYPERLINK("https://example.com/acme", "acme.example.com")'],
  ['Vertex Industries', '=HYPERLINK("https://example.com/vertex", "vertex.example.com")'],
  ['Harbor Goods', '=HYPERLINK("https://example.com/harbor", "harbor.example.com")'],
  ['Alpine Supply Co.', '=HYPERLINK("https://example.com/alpine", "alpine.example.com")'],
];

const ExampleComponent = () => {
  return (
    <HotTable
      data={data}
      colHeaders={true}
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
