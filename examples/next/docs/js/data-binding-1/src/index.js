import Handsontable from "handsontable";
import 'handsontable/dist/handsontable.full.css';

import "./styles.css";

const data = [
    ['', 'Tesla', 'Volvo', 'Toyota', 'Ford'],
    ['2019', 10, 11, 12, 13],
    ['2020', 20, 11, 14, 13],
    ['2021', 30, 15, 12, 13]
];

const container = document.getElementById('example');
const hot = new Handsontable(container, {
    data: data,
    rowHeaders: true,
    colHeaders: true,
    licenseKey: 'non-commercial-and-evaluation'
});
hot.setDataAtCell(0, 1, 'Ford');
