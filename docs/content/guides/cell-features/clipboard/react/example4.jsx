import { useRef } from 'react';
import { HotTable } from '@handsontable/react-wrapper';
import { registerAllModules } from 'handsontable/registry';
// register Handsontable's modules
registerAllModules();
function collectClassNames(hot, coords) {
    const source = coords[0];
    const classNames = [];
    if (!source) {
        return classNames;
    }
    for (let row = source.startRow; row <= source.endRow; row += 1) {
        const rowClassNames = [];
        for (let col = source.startCol; col <= source.endCol; col += 1) {
            rowClassNames.push(hot.getCellMeta(row, col).className ?? '');
        }
        classNames.push(rowClassNames);
    }
    return classNames;
}
const ExampleComponent = () => {
    const copiedClassNames = useRef([]);
    return (<HotTable data={[
            ['Wireless mouse', 142, 'In stock'],
            ['USB-C cable', 67, 'In stock'],
            ['Mechanical keyboard', 0, 'Backordered'],
            ['Laptop stand', 38, 'In stock'],
            ['HDMI adapter', 210, 'In stock'],
        ]} colHeaders={['Product', 'Stock', 'Status']} rowHeaders={true} cell={[
            { row: 0, col: 1, className: 'htRight' },
            { row: 0, col: 2, className: 'htCenter' },
            { row: 2, col: 1, className: 'htRight htDimmed' },
            { row: 2, col: 2, className: 'htCenter htDimmed' },
        ]} afterCopy={function (_data, coords) {
            copiedClassNames.current = collectClassNames(this, coords);
        }} afterPaste={function (_data, coords) {
            const target = coords[0];
            if (!target) {
                return;
            }
            this.batch(() => {
                copiedClassNames.current.forEach((rowClassNames, rowOffset) => {
                    rowClassNames.forEach((className, colOffset) => {
                        this.setCellMeta(target.startRow + rowOffset, target.startCol + colOffset, 'className', className);
                    });
                });
            });
            this.render();
        }} height="auto" autoWrapRow={true} autoWrapCol={true} licenseKey="non-commercial-and-evaluation"/>);
};
export default ExampleComponent;
