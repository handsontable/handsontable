import 'reflect-metadata';
import { AppDataSource } from './data-source';
import { TicketEntity, TicketStatus, TicketPriority } from './ticket.entity';

type SeedRow = Pick<TicketEntity, 'subject' | 'status' | 'priority' | 'assignee' | 'createdAt'>;

const SEED_DATA: SeedRow[] = [
  { subject: 'Login page returns 500 on empty password', status: 'open', priority: 'critical', assignee: 'alice.johnson', createdAt: '2024-01-15' },
  { subject: 'Dashboard loading time exceeds 10 s on Firefox', status: 'in-progress', priority: 'high', assignee: 'bob.smith', createdAt: '2024-01-18' },
  { subject: 'Email notifications not sent after password reset', status: 'open', priority: 'high', assignee: 'carol.white', createdAt: '2024-01-22' },
  { subject: 'CSV export truncates rows on last page', status: 'resolved', priority: 'medium', assignee: 'david.lee', createdAt: '2024-01-25' },
  { subject: 'Date picker shows UTC instead of local timezone', status: 'open', priority: 'medium', assignee: 'alice.johnson', createdAt: '2024-02-01' },
  { subject: 'Column resizing breaks layout on iPad viewport', status: 'in-progress', priority: 'medium', assignee: 'eve.martinez', createdAt: '2024-02-04' },
  { subject: 'Search returns duplicate rows after filter is cleared', status: 'open', priority: 'high', assignee: 'frank.nguyen', createdAt: '2024-02-07' },
  { subject: 'Password reset link expires after 5 minutes instead of 60', status: 'resolved', priority: 'critical', assignee: 'carol.white', createdAt: '2024-02-10' },
  { subject: 'User session disconnects mid-edit with no warning', status: 'open', priority: 'high', assignee: 'bob.smith', createdAt: '2024-02-13' },
  { subject: 'Print stylesheet clips rightmost two columns', status: 'open', priority: 'low', assignee: 'grace.kim', createdAt: '2024-02-16' },
  { subject: 'Bulk delete fails silently when >100 rows selected', status: 'open', priority: 'critical', assignee: 'alice.johnson', createdAt: '2024-02-19' },
  { subject: 'Sort by salary column reverses on second click', status: 'in-progress', priority: 'medium', assignee: 'henry.patel', createdAt: '2024-02-22' },
  { subject: 'Department dropdown missing "Operations" option', status: 'resolved', priority: 'high', assignee: 'david.lee', createdAt: '2024-02-25' },
  { subject: 'Undo does not restore row position after drag-reorder', status: 'open', priority: 'medium', assignee: 'eve.martinez', createdAt: '2024-03-01' },
  { subject: 'Filter panel stays open after navigating to a new page', status: 'closed', priority: 'low', assignee: 'frank.nguyen', createdAt: '2024-03-04' },
  { subject: 'Row height auto-calculation ignores wrapped text', status: 'open', priority: 'medium', assignee: 'grace.kim', createdAt: '2024-03-07' },
  { subject: 'Freeze columns option disappears after window resize', status: 'in-progress', priority: 'medium', assignee: 'henry.patel', createdAt: '2024-03-10' },
  { subject: 'Keyboard navigation skips hidden columns', status: 'open', priority: 'low', assignee: 'alice.johnson', createdAt: '2024-03-13' },
  { subject: 'Copy-paste from Excel drops leading zeros in ZIP codes', status: 'open', priority: 'high', assignee: 'carol.white', createdAt: '2024-03-16' },
  { subject: 'Tooltip z-index overlaps modal dialog', status: 'resolved', priority: 'low', assignee: 'bob.smith', createdAt: '2024-03-19' },
  { subject: 'API rate limit error not shown to user on 429 response', status: 'open', priority: 'high', assignee: 'david.lee', createdAt: '2024-03-22' },
  { subject: 'Autocomplete dropdown overflows screen on last row', status: 'in-progress', priority: 'medium', assignee: 'eve.martinez', createdAt: '2024-03-25' },
  { subject: 'Cell validation runs on blur instead of on submit', status: 'open', priority: 'medium', assignee: 'frank.nguyen', createdAt: '2024-03-28' },
  { subject: 'Import wizard does not detect BOM in UTF-8 files', status: 'resolved', priority: 'medium', assignee: 'grace.kim', createdAt: '2024-04-01' },
  { subject: 'Context menu does not appear on right-click in Chrome 122', status: 'open', priority: 'critical', assignee: 'henry.patel', createdAt: '2024-04-04' },
  { subject: 'Row grouping collapses all groups after page refresh', status: 'in-progress', priority: 'high', assignee: 'alice.johnson', createdAt: '2024-04-07' },
  { subject: 'Number format ignores locale setting on non-US browsers', status: 'open', priority: 'medium', assignee: 'carol.white', createdAt: '2024-04-10' },
  { subject: 'Sticky header disappears when scrolling horizontally', status: 'resolved', priority: 'high', assignee: 'bob.smith', createdAt: '2024-04-13' },
  { subject: 'Merged cell selection throws console error', status: 'open', priority: 'high', assignee: 'david.lee', createdAt: '2024-04-16' },
  { subject: 'Column width not persisted after logout and re-login', status: 'closed', priority: 'low', assignee: 'eve.martinez', createdAt: '2024-04-19' },
  { subject: 'Inline edit activates on single click instead of double', status: 'in-progress', priority: 'medium', assignee: 'frank.nguyen', createdAt: '2024-04-22' },
  { subject: 'Select-all checkbox deselects on sort', status: 'open', priority: 'high', assignee: 'grace.kim', createdAt: '2024-04-25' },
  { subject: 'Row details panel does not update when row is edited', status: 'open', priority: 'medium', assignee: 'henry.patel', createdAt: '2024-04-28' },
  { subject: 'Export to PDF omits bold formatting in header cells', status: 'resolved', priority: 'low', assignee: 'alice.johnson', createdAt: '2024-05-01' },
  { subject: 'Drag-to-fill overwrites formula cells without warning', status: 'open', priority: 'critical', assignee: 'carol.white', createdAt: '2024-05-04' },
  { subject: 'Accessibility: screen reader does not announce cell changes', status: 'in-progress', priority: 'high', assignee: 'bob.smith', createdAt: '2024-05-07' },
  { subject: 'Pagination jumps to page 1 after inline edit', status: 'open', priority: 'medium', assignee: 'david.lee', createdAt: '2024-05-10' },
  { subject: 'Multi-column sort clears secondary sort on refresh', status: 'open', priority: 'medium', assignee: 'eve.martinez', createdAt: '2024-05-13' },
  { subject: 'Cell renderer throws when data contains null', status: 'resolved', priority: 'high', assignee: 'frank.nguyen', createdAt: '2024-05-16' },
  { subject: 'Dropdown editor closes on Tab key instead of committing', status: 'open', priority: 'medium', assignee: 'grace.kim', createdAt: '2024-05-19' },
  { subject: 'Column pinning resets after dataProvider reload', status: 'in-progress', priority: 'medium', assignee: 'henry.patel', createdAt: '2024-05-22' },
  { subject: 'Search highlight missing in read-only cells', status: 'open', priority: 'low', assignee: 'alice.johnson', createdAt: '2024-05-25' },
  { subject: 'Frozen row background bleeds into scrollable area', status: 'resolved', priority: 'low', assignee: 'carol.white', createdAt: '2024-05-28' },
  { subject: 'Number editor accepts alphabetic input without error', status: 'open', priority: 'medium', assignee: 'bob.smith', createdAt: '2024-06-01' },
  { subject: 'Custom renderer not called for empty string values', status: 'in-progress', priority: 'medium', assignee: 'david.lee', createdAt: '2024-06-04' },
  { subject: 'afterChange hook fires twice on programmatic update', status: 'open', priority: 'high', assignee: 'eve.martinez', createdAt: '2024-06-07' },
  { subject: 'Column header tooltip does not follow scroll position', status: 'open', priority: 'low', assignee: 'frank.nguyen', createdAt: '2024-06-10' },
  { subject: 'beforeRemoveRow returning false still removes the row', status: 'open', priority: 'critical', assignee: 'grace.kim', createdAt: '2024-06-13' },
  { subject: 'Resize handle invisible in dark-mode theme', status: 'closed', priority: 'low', assignee: 'henry.patel', createdAt: '2024-06-16' },
  { subject: 'Mobile: double-tap to zoom triggered during cell edit', status: 'open', priority: 'high', assignee: 'alice.johnson', createdAt: '2024-06-19' },
];

async function seed(): Promise<void> {
  await AppDataSource.initialize();
  const repo = AppDataSource.getRepository(TicketEntity);
  const count = await repo.count();

  if (count > 0) {
    console.log(`Database already contains ${count} tickets - skipping seed.`);
    await AppDataSource.destroy();
    return;
  }

  await repo.save(
    SEED_DATA.map((row) =>
      repo.create({
        subject: row.subject,
        status: row.status as TicketStatus,
        priority: row.priority as TicketPriority,
        assignee: row.assignee,
        createdAt: row.createdAt,
      })
    )
  );

  console.log(`Seeded ${SEED_DATA.length} tickets.`);
  await AppDataSource.destroy();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
