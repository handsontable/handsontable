import { HotTable, HotColumn } from '@handsontable/react';
import { registerAllModules } from 'handsontable/registry';
import 'handsontable/dist/handsontable.full.min.css';

// register Handsontable's modules
registerAllModules();

// a renderer component
const ScoreRenderer = (props: { value?: any }) => {
  const { value } = props;
  const color = value > 60 ? '#2ECC40' : '#FF4136';

  return <span style={{ color }}>{value}</span>;
};

// a renderer component
const PromotionRenderer = (props: { value?: any }) => {
  const { value } = props;

  if (value) {
    return <span>&#10004;</span>;
  }

  return <span>&#10007;</span>;
};

// you can set `data` to an array of objects
const data = [
  {
    id: 1,
    name: 'Alex',
    score: 10,
    isPromoted: false,
  },
  {
    id: 2,
    name: 'Adam',
    score: 55,
    isPromoted: false,
  },
  {
    id: 3,
    name: 'Kate',
    score: 61,
    isPromoted: true,
  },
  {
    id: 4,
    name: 'Max',
    score: 98,
    isPromoted: true,
  },
  {
    id: 5,
    name: 'Lucy',
    score: 59,
    isPromoted: false,
  },
];

const ExampleComponent = () => {
  return (
    <HotTable
      data={data}
      autoWrapRow={true}
      autoWrapCol={true}
      licenseKey="non-commercial-and-evaluation"
      autoRowSize={false}
      autoColumnSize={false}
      height="auto"
    >
      {/* use the `data` prop to reference the column data */}
      <HotColumn data="id" />
      <HotColumn data="name" />
      <HotColumn data="score">
        {/* add the `hot-renderer` attribute to mark the component as a Handsontable renderer */}
        <ScoreRenderer hot-renderer />
      </HotColumn>
      <HotColumn data="isPromoted">
        {/* add the `hot-renderer` attribute to mark the component as a Handsontable renderer */}
        <PromotionRenderer hot-renderer />
      </HotColumn>
    </HotTable>
  );
};

export default ExampleComponent;
