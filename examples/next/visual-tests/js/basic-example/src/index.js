import Handsontable from "handsontable";
import "./styles.css";

const data = [
    ['', 'Tesla', 'Volvo', 'Toyota', 'Ford'],
    ['2019', 10, 11, 12, 13],
    ['2020', 20, 11, 14, 13],
    ['2021', 30, 15, 12, 13]
];

// The container id matches the `#example` element in index.html that the visual run screenshots.
const container = document.getElementById('example');

const hot = new Handsontable(container, {
    data,
    width: '100%',
    height: 'auto',
    rowHeaders: true,
    colHeaders: true,
    licenseKey: 'non-commercial-and-evaluation'
});

console.log(`Handsontable: v${Handsontable.version} (${Handsontable.buildDate})`);
