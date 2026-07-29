import Handsontable from 'handsontable/base';
import { registerAllModules } from 'handsontable/registry';
// Register all Handsontable's modules.
registerAllModules();
const data = [
    { asset: 'Bitcoin', btcValue: 12.45, portfolioShare: 452 },
    { asset: 'Ethereum', btcValue: 3.82, portfolioShare: 268 },
    { asset: 'Solana', btcValue: 1.15, portfolioShare: 134 },
    { asset: 'Cardano', btcValue: 0.47, portfolioShare: 81 },
    { asset: 'Polkadot', btcValue: 0.29, portfolioShare: 65 },
];
const container = document.querySelector('#example6');
new Handsontable(container, {
    data,
    colHeaders: ['Asset', 'BTC-equivalent value', 'Portfolio share'],
    columns: [
        { data: 'asset' },
        {
            data: 'btcValue',
            type: 'numeric',
            // Bitcoin (₿) isn't an ISO 4217 currency, so `numericFormat` can't format it.
            // `valueFormatter` prepends the symbol instead.
            valueFormatter(value) {
                // `type: 'numeric'` turns numeric input into a number, but invalid input
                // stays a string, so check the type before calling `toFixed()`.
                if (typeof value !== 'number') {
                    return value;
                }
                return `₿${value.toFixed(4)}`;
            },
        },
        {
            data: 'portfolioShare',
            // Per mille (‰) isn't a unit sanctioned by `Intl.NumberFormat`, so `valueFormatter`
            // appends the symbol manually.
            valueFormatter(value) {
                return `${value}‰`;
            },
        },
    ],
    height: 'auto',
    licenseKey: 'non-commercial-and-evaluation',
});
