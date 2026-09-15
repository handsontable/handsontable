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
    return (<HotTable autoWrapRow={true} autoWrapCol={true} licenseKey="non-commercial-and-evaluation" data={data} height={200} colHeaders={true} rowHeaders={true} 
    // enable the context menu
    contextMenu={true} 
    // enable the `HiddenColumns` plugin
    // automatically adds the context menu's column hiding items
    hiddenColumns={{
            columns: [3, 5, 9],
            indicators: true,
        }}/>);
};
export default ExampleComponent;
