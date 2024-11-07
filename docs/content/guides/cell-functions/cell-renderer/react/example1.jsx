import { HotTable, HotColumn } from '@handsontable/react-wrapper';
import 'handsontable/styles/handsontable.css';
import 'handsontable/styles/ht-theme-main.css';

// your renderer component
const RendererComponent = (props) => {
  // the available renderer-related props are:
  // - `row` (row index)
  // - `col` (column index)
  // - `prop` (column property name)
  // - `TD` (the HTML cell element)
  // - `cellProperties` (the `cellProperties` object for the edited cell)
  return (
    <>
      <i style={{ color: '#a9a9a9' }}>
        Row: {props.row}, column: {props.col},
      </i>{' '}
      value: {props.value}
    </>
  );
};

const hotData = [
  ['A1', 'B1', 'C1', 'D1', 'E1'],
  ['A2', 'B2', 'C2', 'D2', 'E2'],
  ['A3', 'B3', 'C3', 'D3', 'E3'],
  ['A4', 'B4', 'C4', 'D4', 'E4'],
  ['A5', 'B5', 'C5', 'D5', 'E5'],
  ['A6', 'B6', 'C6', 'D6', 'E6'],
  ['A7', 'B7', 'C7', 'D7', 'E7'],
  ['A8', 'B8', 'C8', 'D8', 'E8'],
  ['A9', 'B9', 'C9', 'D9', 'E9'],
];

const ExampleComponent = () => {
  return (
    <HotTable
      data={hotData}
      autoWrapRow={true}
      autoWrapCol={true}
      autoRowSize={false}
      autoColumnSize={false}
      height="auto"
      licenseKey="non-commercial-and-evaluation"
    >
      <HotColumn width={250} renderer={RendererComponent} />
    </HotTable>
  );
};

export default ExampleComponent;
