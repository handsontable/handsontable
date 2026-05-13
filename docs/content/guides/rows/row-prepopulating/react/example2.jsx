import { HotTable } from '@handsontable/react-wrapper';
import { registerAllModules } from 'handsontable/registry';
import { textRenderer } from 'handsontable/renderers/textRenderer';

registerAllModules();

const templateValues = ['one', 'two', 'three'];
const data = [
  ['', 'Tesla', 'Nissan', 'Toyota', 'Honda'],
  ['2017', 10, 11, 12, 13],
  ['2018', 20, 11, 14, 13],
  ['2019', 30, 15, 12, 13],
];

const ExampleComponent = () => {
  function isEmptyRow(instance, row) {
    const rowData = instance.getDataAtRow(row);

    for (let i = 0, ilen = rowData.length; i < ilen; i++) {
      if (rowData[i] !== null) {
        return false;
      }
    }

    return true;
  }

  function defaultValueRenderer(instance, td, row, col) {
    const args = arguments;

    if (args[5] === null && isEmptyRow(instance, row)) {
      args[5] = templateValues[col];
      td.style.color = '#999';
    } else {
      td.style.color = '';
    }

    textRenderer.apply(this, args);
  }

  return (
    <HotTable
      data={data}
      minSpareRows={1}
      height="auto"
      autoWrapRow={true}
      autoWrapCol={true}
      licenseKey="non-commercial-and-evaluation"
      cells={() => ({ renderer: defaultValueRenderer })}
    />
  );
};

export default ExampleComponent;
