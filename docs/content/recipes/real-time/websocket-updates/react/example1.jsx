import { useEffect, useRef } from 'react';
import { HotTable } from '@handsontable/react-wrapper';
import { registerAllModules } from 'handsontable/registry';
import './example1.css';

registerAllModules();

/* start:skip-in-preview */
const stockData = [
  { symbol: 'AAPL', company: 'Apple Inc.', price: 189.25, change: 1.45, volume: 52341200, marketCap: '2.94T' },
  { symbol: 'MSFT', company: 'Microsoft Corp.', price: 415.80, change: -0.72, volume: 18920400, marketCap: '3.08T' },
  { symbol: 'GOOG', company: 'Alphabet Inc.', price: 175.40, change: 2.13, volume: 21780000, marketCap: '2.19T' },
  { symbol: 'AMZN', company: 'Amazon.com Inc.', price: 198.60, change: -1.30, volume: 34560000, marketCap: '2.09T' },
  { symbol: 'NVDA', company: 'NVIDIA Corp.', price: 875.35, change: 14.20, volume: 41230000, marketCap: '2.15T' },
  { symbol: 'META', company: 'Meta Platforms Inc.', price: 512.90, change: 3.55, volume: 15670000, marketCap: '1.30T' },
  { symbol: 'TSLA', company: 'Tesla Inc.', price: 248.75, change: -5.60, volume: 98120000, marketCap: '793B' },
  { symbol: 'BRK', company: 'Berkshire Hathaway', price: 3890.00, change: 12.00, volume: 3450000, marketCap: '876B' },
];
/* end:skip-in-preview */

const flashCell = (hot, row, col) => {
  const td = hot.getCell(row, col);

  if (td) {
    td.classList.remove('ht-cell-flash');
    void td.offsetWidth;
    td.classList.add('ht-cell-flash');
    td.addEventListener('animationend', () => td.classList.remove('ht-cell-flash'), { once: true });
  }
};

const ExampleComponent = () => {
  const hotRef = useRef(null);

  const handleAfterChange = (changes, source) => {
    if (source !== 'external' || !changes) {
      return;
    }

    const hot = hotRef.current?.hotInstance;

    if (!hot) {
      return;
    }

    changes.forEach(([row]) => {
      [2, 3].forEach((col) => flashCell(hot, row, col));
    });
  };

  useEffect(() => {
    const intervalId = setInterval(() => {
      const hot = hotRef.current?.hotInstance;

      if (!hot) {
        return;
      }

      const row = Math.floor(Math.random() * stockData.length);
      const basePrice = stockData[row].price;
      const newPrice = parseFloat((basePrice + (Math.random() - 0.5) * 4).toFixed(2));
      const newChange = parseFloat((newPrice - basePrice + stockData[row].change).toFixed(2));

      hot.setDataAtRowProp(row, 'price', newPrice, 'external');
      hot.setDataAtRowProp(row, 'change', newChange, 'external');
    }, 1500);

    return () => clearInterval(intervalId);
  }, []);

  return (
    <HotTable
      ref={hotRef}
      data={stockData}
      colHeaders={['Symbol', 'Company', 'Price ($)', 'Change ($)', 'Volume', 'Market Cap']}
      columns={[
        { data: 'symbol', readOnly: true },
        { data: 'company', readOnly: true, width: 180 },
        { data: 'price', type: 'numeric', numericFormat: { minimumFractionDigits: 2, maximumFractionDigits: 2 } },
        { data: 'change', type: 'numeric', numericFormat: { minimumFractionDigits: 2, maximumFractionDigits: 2 } },
        { data: 'volume', type: 'numeric', numericFormat: { useGrouping: true, maximumFractionDigits: 0 } },
        { data: 'marketCap', readOnly: true },
      ]}
      rowHeaders={true}
      height="auto"
      width="100%"
      stretchH="all"
      afterChange={handleAfterChange}
      licenseKey="non-commercial-and-evaluation"
    />
  );
};

export default ExampleComponent;
