import { HotTable } from '@handsontable/react-wrapper';
import { registerAllModules } from 'handsontable/registry';
// register Handsontable's modules
registerAllModules();
const ExampleComponent = () => {
    return (<HotTable data={[
            {
                brand: 'Jetpulse',
                model: 'Racing Socks',
                price: 30,
                sellDate: '2023-10-11',
                inStock: false,
            },
            {
                brand: 'Gigabox',
                model: 'HL Mountain Frame',
                price: 1890.9,
                sellDate: '2023-05-03',
                inStock: false,
            },
            {
                brand: 'Camido',
                model: 'Cycling Cap',
                price: 130.1,
                sellDate: '2023-03-27',
                inStock: true,
            },
            {
                brand: 'Chatterpoint',
                model: 'Road Tire Tube',
                price: 59,
                sellDate: '2023-08-28',
                inStock: true,
            },
            {
                brand: 'Eidel',
                model: 'HL Road Tire',
                price: 279.99,
                sellDate: '2023-10-02',
                inStock: true,
            },
        ]} columns={[
            {
                title: 'Brand',
                type: 'text',
                data: 'brand',
            },
            {
                title: 'Model',
                type: 'text',
                data: 'model',
                // turn filtering off for this column only: its menu opens without the filter controls
                filters: false,
            },
            {
                title: 'Price',
                type: 'numeric',
                data: 'price',
                locale: 'en-US',
                numericFormat: {
                    style: 'currency',
                    currency: 'USD',
                    minimumFractionDigits: 2,
                },
            },
            {
                title: 'Date',
                type: 'intl-date',
                data: 'sellDate',
                locale: 'en-US',
                dateFormat: { month: 'short', day: 'numeric', year: 'numeric' },
                className: 'htRight',
            },
            {
                title: 'In stock',
                type: 'checkbox',
                data: 'inStock',
                className: 'htCenter',
            },
        ]} 
    // enable filtering for the whole grid
    filters={true} dropdownMenu={true} height="auto" autoWrapRow={true} autoWrapCol={true} licenseKey="non-commercial-and-evaluation"/>);
};
export default ExampleComponent;
