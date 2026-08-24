/* file: app.component.ts */
import { Component, ViewChild } from '@angular/core';
import { GridSettings, HotTableComponent, HotTableModule } from '@handsontable/angular-wrapper';
import Handsontable from 'handsontable/base';

interface MasterRow {
  firstName: string;
  lastName: string;
  plan: string | null;
  seats: number;
  pricePerSeat: number;
  lastActive: string;
}

interface DetailRow {
  customer: string;
  plan: string;
  seats: number;
  monthlyRevenue: string;
  lastActive: string;
}

const SOURCE_SYNC_FROM_MASTER = 'sync-from-master';

const MASTER_DATA: MasterRow[] = [
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

const normalizePlanLabel = (plan: MasterRow['plan']): string => {
  return typeof plan === 'string' ? plan.toUpperCase() : 'N/A';
};

const normalizeCustomer = (firstName: string | null, lastName: string | null): string =>
  [firstName, lastName].filter(Boolean).join(' ');

const normalizeMonthlyRevenue = (seats: number | null, pricePerSeat: number | null): string =>
  `$${((seats ?? 0) * (pricePerSeat ?? 0)).toFixed(2)}`;

const toDetailRow = (row: MasterRow): DetailRow => ({
  customer: normalizeCustomer(row.firstName, row.lastName),
  plan: normalizePlanLabel(row.plan),
  seats: row.seats,
  monthlyRevenue: normalizeMonthlyRevenue(row.seats, row.pricePerSeat),
  lastActive: row.lastActive ?? '',
});

const DETAIL_COLUMN_MAP: Record<keyof DetailRow, number> = {
  customer: 0,
  plan: 1,
  seats: 2,
  monthlyRevenue: 3,
  lastActive: 4,
};

@Component({
  standalone: true,
  imports: [HotTableModule],
  selector: 'example1-sync-two-grids',
  template: `
    <div class="sync-grids-layout">
      <section class="sync-grids-card">
        <h4>Master grid (editable)</h4>
        <hot-table #masterGrid [data]="masterData" [settings]="masterSettings"></hot-table>
      </section>
      <section class="sync-grids-card">
        <h4>Detail grid (synced)</h4>
        <hot-table #detailGrid [data]="detailData" [settings]="detailSettings"></hot-table>
      </section>
    </div>
  `,
})
export class AppComponent {
  @ViewChild('masterGrid', { static: false }) masterHotTable!: HotTableComponent;
  @ViewChild('detailGrid', { static: false }) detailHotTable!: HotTableComponent;

  readonly masterData: MasterRow[] = MASTER_DATA;
  readonly detailData: DetailRow[] = MASTER_DATA.map(toDetailRow);

  readonly masterSettings: GridSettings = {
    colHeaders: ['First name', 'Last name', 'Plan', 'Seats', 'Price / seat', 'Last active'],
    columns: [
      { data: 'firstName', type: 'text', width: 120 },
      { data: 'lastName', type: 'text', width: 120 },
      { data: 'plan', type: 'dropdown', source: ['Starter', 'Team', 'Business', 'Enterprise'], width: 130 },
      { data: 'seats', type: 'numeric', width: 70 },
      { data: 'pricePerSeat', type: 'numeric', numericFormat: { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 }, width: 105 },
      { data: 'lastActive', type: 'date', width: 130 },
    ],
    rowHeaders: true,
    height: 260,
    width: '100%',
    autoWrapRow: true,
    stretchH: 'all',
    afterChange: (changes: Handsontable.CellChange[] | null, source: Handsontable.ChangeSource) => {
      if (!changes || (source as string) === SOURCE_SYNC_FROM_MASTER || source === 'loadData') {
        return;
      }

      const masterHot = this.masterHotTable?.hotInstance;
      const detailHot = this.detailHotTable?.hotInstance;

      if (!masterHot || !detailHot) {
        return;
      }

      const changedRows = new Set<number>();

      changes.forEach(([row]) => {
        if (typeof row === 'number') {
          changedRows.add(row);
        }
      });

      changedRows.forEach((rowIndex) => {
        const rowData = masterHot.getSourceDataAtRow(rowIndex) as MasterRow;
        const detailRow = toDetailRow(rowData);
        const updates = (Object.entries(DETAIL_COLUMN_MAP) as [keyof DetailRow, number][])
          .map(([prop, columnIndex]) => [rowIndex, columnIndex, detailRow[prop]] as [number, number, DetailRow[keyof DetailRow]]);

        detailHot.setDataAtCell(updates, SOURCE_SYNC_FROM_MASTER);
      });
    },
  };

  readonly detailSettings: GridSettings = {
    colHeaders: ['Customer', 'Plan', 'Seats', 'Monthly revenue', 'Last active'],
    columns: [
      { data: 'customer', readOnly: true, width: 170 },
      { data: 'plan', readOnly: true, width: 130 },
      { data: 'seats', readOnly: true, type: 'numeric', width: 70 },
      { data: 'monthlyRevenue', readOnly: true, width: 130 },
      { data: 'lastActive', readOnly: true, width: 110 },
    ],
    rowHeaders: true,
    height: 260,
    width: '100%',
    autoWrapRow: true,
    stretchH: 'all',
  };
}
/* end-file */

/* file: app.config.ts */
import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { registerAllModules } from 'handsontable/registry';
import { HOT_GLOBAL_CONFIG, HotGlobalConfig, NON_COMMERCIAL_LICENSE } from '@handsontable/angular-wrapper';

registerAllModules();

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    {
      provide: HOT_GLOBAL_CONFIG,
      useValue: { license: NON_COMMERCIAL_LICENSE } as HotGlobalConfig,
    },
  ],
};
/* end-file */
