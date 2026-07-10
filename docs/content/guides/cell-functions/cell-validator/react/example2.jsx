import { HotTable } from '@handsontable/react-wrapper';
import { registerAllModules } from 'handsontable/registry';
// register Handsontable's modules
registerAllModules();
const data = [
    ['Spring Sale 2025', 'Email', '3.4'],
    ['Brand Awareness Q3', 'Paid Search', '8,1'],
    ['Retention Push', 'In-app', '12.0'],
    ['Partner Webinar', 'Organic', '6,75'],
    ['Holiday Preview', 'Social', '9.25'],
];
const decimalValidator = (value, callback) => {
    callback(/^\d+[.,]\d+$/.test(value));
};
const ExampleComponent = () => {
    return (<HotTable data={data} colHeaders={['Campaign', 'Channel', 'Conversion rate']} columns={[
            {},
            {},
            {
                validator: decimalValidator,
                allowInvalid: false,
            },
        ]} height="auto" autoWrapRow={true} autoWrapCol={true} licenseKey="non-commercial-and-evaluation"/>);
};
export default ExampleComponent;
