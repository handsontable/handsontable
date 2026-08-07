import Handsontable from 'handsontable/base';
import { registerAllModules } from 'handsontable/registry';
import { registerCellType, DateCellType } from 'handsontable/cellTypes';
import moment from 'moment';
// Register all Handsontable's modules.
registerAllModules();
/* start:skip-in-preview */
const data = [
    {
        id: 640329,
        itemName: 'Lunar Core',
        itemNo: 'XJ-12',
        leadEngineer: 'Ellen Ripley',
        cost: 350000,
        inStock: true,
        category: 'Lander',
        itemQuality: 87,
        origin: '🇺🇸 USA',
        quantity: 2,
        valueStock: 700000,
        repairable: false,
        supplierName: 'TechNova',
        restockDate: '2025-08-01',
        operationalStatus: 'Awaiting Parts',
    },
    {
        id: 863104,
        itemName: 'Zero Thrusters',
        itemNo: 'QL-54',
        leadEngineer: 'Sam Bell',
        cost: 450000,
        inStock: false,
        category: 'Propulsion',
        itemQuality: 0,
        origin: '🇩🇪 Germany',
        quantity: 0,
        valueStock: 0,
        repairable: true,
        supplierName: 'PropelMax',
        restockDate: '2025-09-15',
        operationalStatus: 'In Maintenance',
    },
    {
        id: 395603,
        itemName: 'EVA Suits',
        itemNo: 'PM-67',
        leadEngineer: 'Alex Rogan',
        cost: 150000,
        inStock: true,
        category: 'Equipment',
        itemQuality: 79,
        origin: '🇮🇹 Italy',
        quantity: 50,
        valueStock: 7500000,
        repairable: true,
        supplierName: 'SuitCraft',
        restockDate: '2025-10-05',
        operationalStatus: 'Ready for Testing',
    },
    {
        id: 679083,
        itemName: 'Solar Panels',
        itemNo: 'BW-09',
        leadEngineer: 'Dave Bowman',
        cost: 75000,
        inStock: true,
        category: 'Energy',
        itemQuality: 95,
        origin: '🇺🇸 USA',
        quantity: 10,
        valueStock: 750000,
        repairable: false,
        supplierName: 'SolarStream',
        restockDate: '2025-11-10',
        operationalStatus: 'Operational',
    },
    {
        id: 912663,
        itemName: 'Comm Array',
        itemNo: 'ZR-56',
        leadEngineer: 'Louise Banks',
        cost: 125000,
        inStock: false,
        category: 'Communication',
        itemQuality: 0,
        origin: '🇯🇵 Japan',
        quantity: 0,
        valueStock: 0,
        repairable: true,
        supplierName: 'CommTech',
        restockDate: '2025-12-20',
        operationalStatus: 'Decommissioned',
    },
    {
        id: 315806,
        itemName: 'Habitat Dome',
        itemNo: 'UJ-23',
        leadEngineer: 'Dr. Ryan Stone',
        cost: 1000000,
        inStock: true,
        category: 'Shelter',
        itemQuality: 93,
        origin: '🇨🇦 Canada',
        quantity: 3,
        valueStock: 3000000,
        repairable: false,
        supplierName: 'DomeInnovate',
        restockDate: '2026-01-25',
        operationalStatus: 'Operational',
    },
];
/* end:skip-in-preview */
// Get the DOM element with the ID 'example1' where the Handsontable will be rendered
const container = document.querySelector('#example1');
// The built-in `date` cell type stores every value in the ISO 8601 format.
const ISO_FORMAT = 'YYYY-MM-DD';
// Converts a loosely written date into ISO.
const toISODate = (value, inputFormat) => {
    // The column's own format wins, parsed strictly so a near-miss does not silently shift.
    const fromInputFormat = moment(value, inputFormat, true);
    if (fromInputFormat.isValid()) {
        return fromInputFormat.format(ISO_FORMAT);
    }
    // Fall back to the browser's parsing for values that format cannot describe, such as
    // "March 14, 2025". Handing Moment a Date avoids its string-parsing deprecation warning.
    const nativeDate = new Date(value);
    return Number.isNaN(nativeDate.getTime()) ? value : moment(nativeDate).format(ISO_FORMAT);
};
const cellDateTypeDefinition = {
    // Inherit the built-in date editor (a native date input), its ISO validator, and the source-data
    // check that warns when the underlying data is not ISO.
    ...DateCellType,
    // Display the ISO source value in the column's own Moment format. `valueFormatter` runs before the
    // renderer, so the inherited renderer receives the formatted string and no custom renderer is needed.
    valueFormatter: (value, cellProperties) => {
        if (typeof value !== 'string' || value === '') {
            return value;
        }
        const date = moment(value, ISO_FORMAT, true);
        return date.isValid() ? date.format(cellProperties.renderFormat ?? ISO_FORMAT) : value;
    },
};
// Rewrites a non-ISO value into ISO before it reaches the cell. This runs ahead of both the editor
// and the validator, which is what keeps the built-in ISO-only editor from warning about the raw
// value. It also covers pasted and programmatically written values, which never touch the editor.
function correctDatesBeforeChange(changes) {
    changes.forEach((change) => {
        if (!change) {
            return;
        }
        const [visualRow, prop, , newValue] = change;
        const cellMeta = this.getCellMeta(visualRow, this.propToCol(prop));
        if (cellMeta.type !== 'moment-date' ||
            cellMeta.correctFormat !== true ||
            typeof newValue !== 'string' ||
            newValue === '') {
            return;
        }
        if (!moment(newValue, ISO_FORMAT, true).isValid()) {
            change[3] = toISODate(newValue, cellMeta.inputFormat ?? ISO_FORMAT);
        }
    });
}
registerCellType('moment-date', cellDateTypeDefinition);
// Define configuration options for the Handsontable
const hotOptions = {
    data,
    colHeaders: ['Item Name', 'Category', 'Lead Engineer', 'Restock Date', 'Cost'],
    autoRowSize: true,
    rowHeaders: true,
    height: 'auto',
    width: '100%',
    autoWrapRow: true,
    headerClassName: 'htLeft',
    columns: [
        { data: 'itemName', type: 'text', width: 130 },
        { data: 'category', type: 'text', width: 120 },
        { data: 'leadEngineer', type: 'text', width: 150 },
        {
            data: 'restockDate',
            type: 'moment-date',
            width: 150,
            // Display format, applied by `valueFormatter`. The stored value stays ISO.
            renderFormat: 'MMM D, YYYY',
            // Format tried first when correcting a pasted value.
            inputFormat: 'MM/DD/YYYY',
            correctFormat: true,
        },
        {
            data: 'cost',
            type: 'numeric',
            width: 120,
            className: 'htRight',
            locale: 'en-US',
            numericFormat: {
                style: 'currency',
                currency: 'USD',
                minimumFractionDigits: 2,
            },
        },
    ],
    licenseKey: 'non-commercial-and-evaluation',
    beforeChange: correctDatesBeforeChange,
};
// Initialize the Handsontable instance with the specified configuration options
// eslint-disable-next-line no-unused-vars
const hot = new Handsontable(container, hotOptions);
