import { useCallback, useRef, useState } from 'react';
import { HotTable } from '@handsontable/react-wrapper';
import { registerAllModules } from 'handsontable/registry';
import type { HotTableRef } from '@handsontable/react-wrapper';
import './example1.css';

registerAllModules();

/* start:skip-in-preview */
type CampaignRow = {
  campaign: string;
  channel: string;
  impressions: number;
  clicks: number;
  conversions: number;
  cpc: number;
  revenue: number;
  roi: number;
};

const data: CampaignRow[] = [
  { campaign: 'Spring Sale', channel: 'Email', impressions: 120000, clicks: 4800, conversions: 320, cpc: 0.42, revenue: 9600, roi: 2.28 },
  { campaign: 'Summer Push', channel: 'Paid Search', impressions: 85000, clicks: 3100, conversions: 210, cpc: 1.15, revenue: 6300, roi: 1.82 },
  { campaign: 'Back to School', channel: 'Social', impressions: 200000, clicks: 7200, conversions: 540, cpc: 0.31, revenue: 16200, roi: 3.10 },
  { campaign: 'Black Friday', channel: 'Display', impressions: 450000, clicks: 9000, conversions: 720, cpc: 0.65, revenue: 28800, roi: 2.94 },
  { campaign: 'Holiday Deals', channel: 'Email', impressions: 310000, clicks: 11200, conversions: 890, cpc: 0.28, revenue: 35600, roi: 4.12 },
  { campaign: 'New Year Offer', channel: 'Paid Search', impressions: 95000, clicks: 3800, conversions: 290, cpc: 1.22, revenue: 8700, roi: 1.65 },
  { campaign: 'Valentine Push', channel: 'Social', impressions: 140000, clicks: 5600, conversions: 410, cpc: 0.38, revenue: 12300, roi: 2.56 },
  { campaign: 'Spring Relaunch', channel: 'Display', impressions: 175000, clicks: 6300, conversions: 480, cpc: 0.55, revenue: 14400, roi: 2.18 },
];
/* end:skip-in-preview */

const colHeaders = ['Campaign', 'Channel', 'Impressions', 'Clicks', 'Conversions', 'CPC ($)', 'Revenue ($)', 'ROI'];

const columns = [
  { data: 'campaign', type: 'text' as const },
  { data: 'channel', type: 'text' as const },
  { data: 'impressions', type: 'numeric' as const, numericFormat: { pattern: '0,0' } },
  { data: 'clicks', type: 'numeric' as const, numericFormat: { pattern: '0,0' } },
  { data: 'conversions', type: 'numeric' as const, numericFormat: { pattern: '0,0' } },
  { data: 'cpc', type: 'numeric' as const, numericFormat: { pattern: '0.00' } },
  { data: 'revenue', type: 'numeric' as const, numericFormat: { pattern: '$0,0' } },
  { data: 'roi', type: 'numeric' as const, numericFormat: { pattern: '0.00' } },
];

const ExampleComponent = () => {
  const hotRef = useRef<HotTableRef>(null);
  const [frozenCount, setFrozenCount] = useState(0);

  const freezeUpTo = useCallback((n: number) => {
    const hot = hotRef.current?.hotInstance;
    const total = hot ? hot.countCols() : colHeaders.length;

    setFrozenCount(Math.min(n, total));
  }, []);

  const unfreezeAll = useCallback(() => {
    setFrozenCount(0);
  }, []);

  const statusText = frozenCount === 0
    ? 'No columns frozen'
    : `${frozenCount} column${frozenCount > 1 ? 's' : ''} frozen`;

  return (
    <div>
      <div className="freeze-controls">
        <div className="freeze-controls__freeze-btns">
          {colHeaders.map((header, index) => (
            <button
              key={header}
              type="button"
              onClick={() => freezeUpTo(index + 1)}
            >
              Freeze up to &quot;{header}&quot;
            </button>
          ))}
        </div>
        <div className="freeze-controls__footer">
          <button type="button" onClick={unfreezeAll}>Unfreeze all</button>
          <span className="freeze-controls__status">{statusText}</span>
        </div>
      </div>
      <HotTable
        ref={hotRef}
        data={data}
        colHeaders={colHeaders}
        columns={columns}
        fixedColumnsStart={frozenCount}
        manualColumnMove={true}
        rowHeaders={true}
        height="auto"
        width="100%"
        autoWrapRow={true}
        licenseKey="non-commercial-and-evaluation"
      />
    </div>
  );
};

export default ExampleComponent;
