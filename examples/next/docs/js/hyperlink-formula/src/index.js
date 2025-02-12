import "handsontable/dist/handsontable.full.css";
import "./styles.css";

import Handsontable from "handsontable/dist/handsontable.full.min"
import HyperFormula from "hyperformula/dist/hyperformula";

const getDebugInfo = () => {
    let debug = 'Handsontable:';
    debug += ` v${Handsontable.version}`;
    debug += ` (${Handsontable.buildDate})`;
    debug += `\nHyperFormula: ${HyperFormula.version}`;
    return debug;
}

const hyperformulaInstance = HyperFormula.buildEmpty({
    licenseKey: 'internal-use-in-handsontable',
});

const data = [
    ['https://hyperformula.handsontable.com/', null],
    ['HyperFormula', null],
    ['=HYPERLINK("https://www.handsontable.com/")','=FORMULATEXT(A3)'],
    ['=HYPERLINK("http://www.handsontable.com","Handsontable")','=FORMULATEXT(A4)'],
    ['=HYPERLINK(A1,A2)','=FORMULATEXT(A5)'],
    ['=HYPERLINK(INDEX(A1:A2,1),INDEX(A1:A2,2))','=FORMULATEXT(A6)'],
    ['=CONCATENATE("Visit us at ", HYPERLINK(A1))','=FORMULATEXT(A7)'],
    ['=HYPERLINK()','=FORMULATEXT(A8)'],
    ['=HYPERLINK(123)','=FORMULATEXT(A9)'],
    ['=HYPERLINK(123,456)','=FORMULATEXT(A10)'],
    ['=HYPERLINK(123,456,789)','=FORMULATEXT(A11)'],
];

const container = document.getElementById('example');

const hot = new Handsontable(container, {
    data,
    formulas: {
        engine: hyperformulaInstance,
        sheetName: 'Sheet1'
    },
    width: '100%',
    height: '100%',
    rowHeaders: true,
    colHeaders: true,
    licenseKey: 'non-commercial-and-evaluation'
});

console.log(getDebugInfo());
