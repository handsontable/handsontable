import Handsontable from 'handsontable';

const root = document.getElementById('root');
const iframe = document.createElement('iframe');
iframe.width = 500;
iframe.height = 500;

root.appendChild(iframe);

export function initializeIframeDemo() {
    const doc = root.querySelector("iframe").contentDocument,
        container = doc.createElement("div");

    const link = document.createElement("link");

    link.href = "https://cdn.jsdelivr.net/npm/handsontable@latest/dist/handsontable.css";
    link.rel = "stylesheet";
    link.type = "text/css";

    doc.head.append(link);
    doc.body.append(container);

    new Handsontable(container, {
        data: Handsontable.helper.createSpreadsheetObjectData(10, 10),
        height: 'auto',
        rowHeaders: true,
        colHeaders: true,
        licenseKey: 'non-commercial-and-evaluation'
    });

    console.log(
        `Handsontable: v${Handsontable.version} (${Handsontable.buildDate})`
    );
}
