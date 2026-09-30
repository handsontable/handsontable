import { HotTable } from '@handsontable/react-wrapper';
import { registerAllModules } from 'handsontable/registry';
import { textRenderer } from 'handsontable/renderers/textRenderer';

registerAllModules();

const templateValues = ['one', 'two', 'three'];
const data = [
  ['Hydrogen', 'H', 1, 1.008, 7],
  ['Helium', 'He', 2, 4.003, 9],
  ['Lithium', 'Li', 3, 6.94, 9],
  ['Beryllium', 'Be', 4, 9.012, 11],
  ['Boron', 'B', 5, 10.81, 15],
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
      colHeaders={['Name', 'Symbol', 'Atomic number', 'Atomic mass', 'Known isotopes']}
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
