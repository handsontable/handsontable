import { HotTable } from '@handsontable/react-wrapper';
import { registerAllModules } from 'handsontable/registry';
import { registerRenderer } from 'handsontable/renderers';
import { textRenderer } from 'handsontable/renderers/textRenderer';
// register Handsontable's modules
registerAllModules();
const data = [
    ['Acme Corp', 4.2, 5.1, -1.3, 6.8],
    ['Vertex Industries', 12.5, 11.9, 13.2, 14],
    ['Harbor Analytics', -2.4, 0.8, 2.1, 3.5],
    ['Summit Logistics', 8.7, -3.2, 4.4, 5.9],
    ['Pioneer Foods', 1.1, 1.4, 0.9, -0.5],
    ['Meridian Retail', 6, 7.3, 8.1, 9.4],
];
// display losses in an accounting format, so color is not the only signal
const profitRenderer = (instance, td, row, col, prop, value, cellProperties) => {
    const amount = Number(value);
    td.classList.remove('loss-cell');
    if (!Number.isFinite(amount)) {
        textRenderer(instance, td, row, col, prop, value, cellProperties);
        return;
    }
    const formatted = amount < 0
        ? `($${Math.abs(amount).toFixed(1)}M)`
        : `$${amount.toFixed(1)}M`;
    textRenderer(instance, td, row, col, prop, formatted, cellProperties);
    if (amount < 0) {
        td.classList.add('loss-cell');
    }
};
registerRenderer('profitRenderer', profitRenderer);
const ExampleComponent = () => {
    return (<HotTable data={data} colHeaders={['Company', 'Q1', 'Q2', 'Q3', 'Q4']} licenseKey="non-commercial-and-evaluation" height="auto" columns={[
            {},
            { renderer: 'profitRenderer' },
            { renderer: 'profitRenderer' },
            { renderer: 'profitRenderer' },
            { renderer: 'profitRenderer' },
        ]}/>);
};
export default ExampleComponent;
