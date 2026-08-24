import { useRef } from 'react';
import { HotTable } from '@handsontable/react-wrapper';
import { registerAllModules } from 'handsontable/registry';
import './example1.css';

registerAllModules();

const SOURCE_SYNC_FROM_MASTER = 'sync-from-master';

/* start:skip-in-preview */
const masterData = [
  { firstName: 'Mia', lastName: 'Johnson', plan: 'Starter', seats: 5, pricePerSeat: 29, lastActive: '2026-03-09' },
  { firstName: 'Noah', lastName: 'Chen', plan: 'Team', seats: 12, pricePerSeat: 24, lastActive: '2026-03-10' },
  { firstName: 'Ava', lastName: 'Miller', plan: 'Business', seats: 18, pricePerSeat: 21, lastActive: '2026-03-08' },
  { firstName: 'Liam', lastName: 'Davis', plan: 'Enterprise', seats: 35, pricePerSeat: 19, lastActive: '2026-03-11' },
  { firstName: 'Emma', lastName: 'Wilson', plan: 'Team', seats: 9, pricePerSeat: 24, lastActive: '2026-03-06' },
  { firstName: 'Oliver', lastName: 'Khan', plan: 'Starter', seats: 4, pricePerSeat: 29, lastActive: '2026-03-07' },
  { firstName: 'Sophia', lastName: 'Lee', plan: 'Business', seats: 22, pricePerSeat: 21, lastActive: '2026-03-05' },
  { firstName: 'James', lastName: 'Patel', plan: 'Team', seats: 14, pricePerSeat: 24, lastActive: '2026-03-12' },
  { firstName: 'Isabella', lastName: 'Rossi', plan: 'Starter', seats: 6, pricePerSeat: 29, lastActive: '2026-03-04' },
  { firstName: 'Benjamin', lastName: 'Garcia', plan: 'Enterprise', seats: 41, pricePerSeat: 19, lastActive: '2026-03-03' },
  { firstName: 'Charlotte', lastName: 'Nguyen', plan: 'Business', seats: 19, pricePerSeat: 21, lastActive: '2026-03-02' },
  { firstName: 'Elijah', lastName: 'Brown', plan: 'Team', seats: 11, pricePerSeat: 24, lastActive: '2026-03-01' },
];
/* end:skip-in-preview */

const normalizePlanLabel = (plan) => typeof plan === 'string' ? plan.toUpperCase() : 'N/A';

const normalizeCustomer = (firstName, lastName) => [firstName, lastName].filter(Boolean).join(' ');

const normalizeMonthlyRevenue = (seats, pricePerSeat) =>
  `$${((seats ?? 0) * (pricePerSeat ?? 0)).toFixed(2)}`;

const toDetailRow = (row) => ({
  customer: normalizeCustomer(row.firstName, row.lastName),
  plan: normalizePlanLabel(row.plan),
  seats: row.seats,
  monthlyRevenue: normalizeMonthlyRevenue(row.seats, row.pricePerSeat),
  lastActive: row.lastActive ?? '',
});

const detailColumnMap = {
  customer: 0,
  plan: 1,
  seats: 2,
  monthlyRevenue: 3,
  lastActive: 4,
};

const ExampleComponent = () => {
  const masterHotRef = useRef(null);
  const detailHotRef = useRef(null);

  const syncDetailRow = (rowIndex, rowData) => {
    const detailHot = detailHotRef.current?.hotInstance;

    if (!detailHot) {
      return;
    }

    const detailRow = toDetailRow(rowData);
    const detailChanges = Object.entries(detailColumnMap).map(([prop, columnIndex]) => [
      rowIndex,
      columnIndex,
      detailRow[prop],
    ]);

    detailHot.setDataAtCell(detailChanges, SOURCE_SYNC_FROM_MASTER);
  };

  const handleMasterAfterChange = (changes, source) => {
    // Ignore init/sync writes to prevent re-entrant updates.
    if (!changes || source === SOURCE_SYNC_FROM_MASTER || source === 'loadData') {
      return;
    }

    const masterHot = masterHotRef.current?.hotInstance;

    if (!masterHot) {
      return;
    }

    const changedRows = new Set();

    changes.forEach(([row]) => {
      if (typeof row === 'number') {
        changedRows.add(row);
      }
    });

    changedRows.forEach((rowIndex) => {
      const rowData = masterHot.getSourceDataAtRow(rowIndex);

      syncDetailRow(rowIndex, rowData);
    });
  };

  return (
    <div className="sync-grids-layout">
      <section className="sync-grids-card">
        <h4>Master grid (editable)</h4>
        <HotTable
          ref={masterHotRef}
          data={masterData}
          colHeaders={['First name', 'Last name', 'Plan', 'Seats', 'Price / seat', 'Last active']}
          columns={[
            { data: 'firstName', type: 'text', width: 120 },
            { data: 'lastName', type: 'text', width: 120 },
            { data: 'plan', type: 'dropdown', source: ['Starter', 'Team', 'Business', 'Enterprise'], width: 130 },
            { data: 'seats', type: 'numeric', width: 70 },
            { data: 'pricePerSeat', type: 'numeric', numericFormat: { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 }, width: 105 },
            { data: 'lastActive', type: 'date', dateFormat: { year: 'numeric', month: '2-digit', day: '2-digit' }, correctFormat: true, width: 130 },
          ]}
          rowHeaders={true}
          height={260}
          width="100%"
          autoWrapRow={true}
          stretchH="all"
          afterChange={handleMasterAfterChange}
          licenseKey="non-commercial-and-evaluation"
        />
      </section>
      <section className="sync-grids-card">
        <h4>Detail grid (synced)</h4>
        <HotTable
          ref={detailHotRef}
          data={masterData.map(toDetailRow)}
          colHeaders={['Customer', 'Plan', 'Seats', 'Monthly revenue', 'Last active']}
          columns={[
            { data: 'customer', readOnly: true, width: 170 },
            { data: 'plan', readOnly: true, width: 130 },
            { data: 'seats', readOnly: true, type: 'numeric', width: 70 },
            { data: 'monthlyRevenue', readOnly: true, width: 130 },
            { data: 'lastActive', readOnly: true, width: 110 },
          ]}
          rowHeaders={true}
          height={260}
          width="100%"
          autoWrapRow={true}
          stretchH="all"
          licenseKey="non-commercial-and-evaluation"
        />
      </section>
    </div>
  );
};

export default ExampleComponent;
