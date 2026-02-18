import { HotTable, HotColumn, EditorComponent } from '@handsontable/react-wrapper';
import { registerAllModules } from 'handsontable/registry';
import { HexColorPicker } from 'react-colorful';

registerAllModules();

const inputData = new Array(10)
  .fill(null)
  .map((_, row) => new Array(10).fill(null).map((_, column) => `${row}, ${column}`));

export const data = inputData.map((el) => ({
  ...el,
  color: `#${Math.round(0x1000000 + 0xffffff * Math.random())
    .toString(16)
    .slice(1)
    .toUpperCase()}`,
}));

export const ColorPickerEditor = () => {
  return (
    <EditorComponent>
      {({ value, setValue, finishEditing }) => (
        <div className="color-picker-editor">
          <HexColorPicker color={value || '#000000'} onChange={(color) => setValue(color)} />
          <button className="button" onClick={() => finishEditing()}>
            Apply Color
          </button>
        </div>
      )}
    </EditorComponent>
  );
};

const ExampleComponent = () => {
  return (
    <HotTable
      autoRowSize={true}
      rowHeaders={true}
      autoWrapRow={true}
      licenseKey="non-commercial-and-evaluation"
      height="auto"
      data={data}
      colHeaders={true}
    >
      <HotColumn width={250} editor={ColorPickerEditor} data="color" title="Colour" />
    </HotTable>
  );
};

export default ExampleComponent;
