import Handsontable from 'handsontable';

const root = document.getElementById('root');

export function initializeIframeDemo() {
    const iframe = document.createElement('iframe');
    iframe.width = 500;
    iframe.height = 500;

    root.appendChild(iframe);
    const doc = root.querySelector("iframe").contentDocument,
        container = doc.createElement("div");

    const link = document.createElement("link");

    link.href = "http://localhost:8082/assets/handsontable/dist/handsontable.full.css";
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
