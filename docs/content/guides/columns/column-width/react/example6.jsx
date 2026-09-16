import { HotTable } from '@handsontable/react-wrapper';
import { registerAllModules } from 'handsontable/registry';
// register Handsontable's modules
registerAllModules();
const ExampleComponent = () => {
    return (<HotTable data={[
            ['H', 'Hydrogen', 1, 'Gas'],
            ['He', 'Helium', 2, 'Gas'],
            ['Li', 'Lithium', 3, 'Solid'],
            ['Be', 'Beryllium', 4, 'Solid'],
            ['B', 'Boron', 5, 'Solid'],
        ]} width="100%" height="auto" colWidths={80} colHeaders={['Symbol', 'Name', 'Atomic Number', 'State']} rowHeaders={true} stretchH="last" contextMenu={true} autoWrapRow={true} autoWrapCol={true} licenseKey="non-commercial-and-evaluation"/>);
};
export default ExampleComponent;
