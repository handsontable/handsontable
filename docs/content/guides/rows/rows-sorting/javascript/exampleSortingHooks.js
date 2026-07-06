import Handsontable from 'handsontable/base';
import { registerAllModules } from 'handsontable/registry';
// Register all Handsontable's modules.
registerAllModules();
const container = document.querySelector('#exampleSortingHooks');
const status = document.querySelector('#exampleSortingHooksStatus');
const data = [
    { brand: 'Jetpulse', model: 'Racing Socks', price: 30, sellDate: '2023-10-11' },
    { brand: 'Gigabox', model: 'HL Mountain Frame', price: 1890.9, sellDate: '2023-05-03' },
    { brand: 'Camido', model: 'Cycling Cap', price: 130.1, sellDate: '2023-03-27' },
    { brand: 'Chatterpoint', model: 'Road Tire Tube', price: 59, sellDate: '2023-08-28' },
    { brand: 'Eidel', model: 'HL Road Tire', price: 279.99, sellDate: '2023-10-02' },
];
const columnDataKeys = ['brand', 'model', 'price', 'sellDate'];
// Simulates a server that receives a sort request and returns sorted rows.
function sortOnServer(columnKey, sortOrder) {
    return new Promise((resolve) => {
        setTimeout(() => {
            const sortedData = [...data].sort((rowA, rowB) => {
                if (rowA[columnKey] === rowB[columnKey]) {
                    return 0;
                }
                return (rowA[columnKey] > rowB[columnKey]) === (sortOrder === 'asc') ? 1 : -1;
            });
            resolve(sortedData);
        }, 600);
    });
}
const hot = new Handsontable(container, {
    data,
    columns: [
        { title: 'Brand', type: 'text', data: 'brand' },
        { title: 'Model', type: 'text', data: 'model' },
        {
            title: 'Price',
            type: 'numeric',
            data: 'price',
            locale: 'en-US',
            numericFormat: { style: 'currency', currency: 'USD', minimumFractionDigits: 2 },
        },
        {
            title: 'Date',
            type: 'intl-date',
            data: 'sellDate',
            locale: 'en-US',
            dateFormat: { month: 'short', day: 'numeric', year: 'numeric' },
            className: 'htRight',
        },
    ],
    columnSorting: true,
    height: 'auto',
    stretchH: 'all',
    autoWrapRow: true,
    autoWrapCol: true,
    beforeColumnSort(currentSortConfig, destinationSortConfigs) {
        const [sortConfig] = destinationSortConfigs;
        if (!sortConfig || sortConfig.sortOrder === 'none') {
            // the sorting was cleared, let Handsontable reset the row order on the front end
            return true;
        }
        status.textContent = 'Sorting on the server...';
        sortOnServer(columnDataKeys[sortConfig.column], sortConfig.sortOrder).then((sortedData) => {
            hot.loadData(sortedData);
            status.textContent = 'Sorted on the server.';
        });
        // return `false` to cancel Handsontable's own front-end sort
        return false;
    },
    licenseKey: 'non-commercial-and-evaluation',
});
