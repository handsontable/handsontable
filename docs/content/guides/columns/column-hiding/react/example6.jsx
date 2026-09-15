import { HotTable } from '@handsontable/react-wrapper';
import { registerAllModules } from 'handsontable/registry';
// register Handsontable's modules
registerAllModules();
// generate an array of arrays with dummy data
const data = new Array(10) // number of rows
    .fill(null)
    .map((_, row) => new Array(10) // number of columns
    .fill(null)
    .map((_, column) => `${row}, ${column}`));
const ExampleComponent = () => {
    return (<HotTable autoWrapRow={true} autoWrapCol={true} licenseKey="non-commercial-and-evaluation" data={data} height={200} colHeaders={true} rowHeaders={true} contextMenu={['hidden_columns_show', 'hidden_columns_hide']} hiddenColumns={{
            columns: [3, 5, 9],
            indicators: true,
            // exclude hidden columns from copying and pasting
            copyPasteEnabled: false,
        }}/>);
};
export default ExampleComponent;
