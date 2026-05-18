import './VersionComparison.css';
import { useEffect, useMemo, useState } from 'react';
import type { ChangeCategory, FilterKind, ReleaseSummary, VersionComparisonData, VersionEntry } from './types';

function readData(): VersionComparisonData {
  const el = document.getElementById('version-comparison-data');
  if (!el) throw new Error('version-comparison-data script tag not found');
  return JSON.parse(el.textContent || '{}') as VersionComparisonData;
}

function compareVersions(a: string, b: string): number {
  const [am, an] = a.split('.').map(Number);
  const [bm, bn] = b.split('.').map(Number);
  return am !== bm ? am - bm : an - bn;
}

function defaultRange(releases: ReleaseSummary[]) {
  if (releases.length === 0) return { from: '', to: '' };
  const to = releases[0].version;
  const targetMajor = releases[0].major - 3;
  // Pick the oldest minor of the target major (3 majors back), e.g. 14.0 when current is 17.x.
  // Releases are sorted descending, so iterate from the end to find the smallest minor.
  let fromCandidate: ReleaseSummary | undefined;
  for (let i = releases.length - 1; i >= 0; i -= 1) {
    if (releases[i].major === targetMajor) {
      fromCandidate = releases[i];
      break;
    }
  }
  if (!fromCandidate) fromCandidate = releases[releases.length - 1];
  return { from: fromCandidate.version, to };
}

interface VersionSelectorProps {
  label: string;
  value: string;
  releases: ReleaseSummary[];
  onChange: (v: string) => void;
  disableNewerThan?: string;
  disableOlderThan?: string;
}

function VersionSelector({ label, value, releases, onChange, disableNewerThan, disableOlderThan }: VersionSelectorProps) {
  return (
    <label className="vc-selector">
      <span>{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        {releases.map((r) => {
          const tooNew = disableNewerThan ? compareVersions(r.version, disableNewerThan) > 0 : false;
          const tooOld = disableOlderThan ? compareVersions(r.version, disableOlderThan) < 0 : false;
          return (
            <option key={r.version} value={r.version} disabled={tooNew || tooOld}>
              {r.version}
              {r.isCurrent ? ' (current)' : ''}
            </option>
          );
        })}
      </select>
    </label>
  );
}

function entriesInRange(entries: VersionEntry[], from: string, to: string): VersionEntry[] {
  return entries.filter((e) => {
    const [maj, min] = e.version.split('.');
    const minor = `${maj}.${min}`;
    return compareVersions(minor, from) > 0 && compareVersions(minor, to) <= 0;
  });
}

const FILTER_LABELS: Record<FilterKind, string> = {
  all: 'All',
  new: 'New',
  fixed: 'Fixed',
  deprecated: 'Deprecated',
  breaking: 'Breaking',
};

function matchesFilter(entry: VersionEntry, filter: FilterKind): boolean {
  switch (filter) {
    case 'all': return true;
    case 'breaking': return entry.breaking;
    case 'deprecated': return entry.category === 'deprecated';
    case 'new': return entry.category === 'added' && !entry.breaking;
    case 'fixed': return entry.category === 'fixed';
  }
}

interface FilterTabsProps {
  value: FilterKind;
  onChange: (v: FilterKind) => void;
  entries: VersionEntry[];
}

function FilterTabs({ value, onChange, entries }: FilterTabsProps) {
  const counts: Record<FilterKind, number> = {
    all: entries.length,
    new: 0,
    fixed: 0,
    deprecated: 0,
    breaking: 0,
  };
  for (const e of entries) {
    if (matchesFilter(e, 'new')) counts.new += 1;
    if (matchesFilter(e, 'fixed')) counts.fixed += 1;
    if (matchesFilter(e, 'deprecated')) counts.deprecated += 1;
    if (matchesFilter(e, 'breaking')) counts.breaking += 1;
  }
  return (
    <div className="vc-filter-tabs" role="tablist">
      {(Object.keys(FILTER_LABELS) as FilterKind[]).map((k) => (
        <button
          key={k}
          role="tab"
          aria-selected={value === k}
          className={`vc-filter-tab vc-filter-tab-${k} ${value === k ? 'is-active' : ''}`}
          onClick={() => onChange(k)}
        >
          <span className="vc-filter-tab-label">{FILTER_LABELS[k]}</span>
          <span className="vc-filter-tab-count">{counts[k]}</span>
        </button>
      ))}
    </div>
  );
}

function pillClass(category: ChangeCategory, breaking: boolean) {
  if (breaking) return 'vc-pill vc-pill-breaking';
  return `vc-pill vc-pill-${category}`;
}

function pillLabel(category: ChangeCategory, breaking: boolean) {
  if (breaking) return 'breaking';
  return category;
}

function PrLink({ prNumber }: { prNumber: number | null }) {
  if (prNumber === null) return null;
  const href = `https://github.com/handsontable/handsontable/pull/${prNumber}`;
  return <a href={href} target="_blank" rel="noreferrer">#{prNumber}</a>;
}

function FeaturedEntry({ entry }: { entry: VersionEntry }) {
  return (
    <article className="vc-featured-card">
      <header className="vc-featured-card-header">
        <span className={pillClass(entry.category, entry.breaking)}>{pillLabel(entry.category, entry.breaking)}</span>
        {entry.prNumber !== null && (
          <a
            className="vc-featured-card-pr"
            href={`https://github.com/handsontable/handsontable/pull/${entry.prNumber}`}
            target="_blank"
            rel="noreferrer"
          >
            #{entry.prNumber}
          </a>
        )}
      </header>
      <p className="vc-featured-card-title">{entry.tagline ?? entry.title}</p>
      {entry.whyItMatters && <p className="vc-featured-card-why">{entry.whyItMatters}</p>}
    </article>
  );
}

function CompactEntry({ entry }: { entry: VersionEntry }) {
  return (
    <li className="vc-entry vc-entry-compact">
      <span className={pillClass(entry.category, entry.breaking)}>{pillLabel(entry.category, entry.breaking)}</span>
      <span className="vc-entry-title">{entry.title}</span>
      <PrLink prNumber={entry.prNumber} />
    </li>
  );
}

const COMPACT_THRESHOLD = 10;

function ReleaseGroup({ version, entries }: { version: string; entries: VersionEntry[] }) {
  const [expanded, setExpanded] = useState(false);
  const featured = entries.filter((e) => e.highlighted);
  const compact = entries.filter((e) => !e.highlighted);
  const shown = expanded || compact.length <= COMPACT_THRESHOLD
    ? compact
    : compact.slice(0, COMPACT_THRESHOLD);
  const hiddenCount = compact.length - shown.length;

  return (
    <section className="vc-release-group">
      <h2 className="vc-release-heading">{version}</h2>
      {featured.length > 0 && (
        <div className="vc-featured-grid">
          {featured.map((e) => <FeaturedEntry key={`${e.version}-${e.prNumber}-${e.title}`} entry={e} />)}
        </div>
      )}
      {compact.length > 0 && (
        <ul className="vc-entry-list">
          {shown.map((e) => <CompactEntry key={`${e.version}-${e.prNumber}-${e.title}`} entry={e} />)}
        </ul>
      )}
      {hiddenCount > 0 && (
        <button type="button" className="vc-show-all" onClick={() => setExpanded(true)}>
          Show all {compact.length} changes
        </button>
      )}
    </section>
  );
}

function patchOrder(version: string) {
  return Number(version.split('.')[2] ?? 0);
}

function groupByRelease(entries: VersionEntry[]): { version: string; entries: VersionEntry[] }[] {
  const map = new Map<string, VersionEntry[]>();
  for (const e of entries) {
    const list = map.get(e.version) ?? [];
    list.push(e);
    map.set(e.version, list);
  }
  return Array.from(map.entries())
    .sort((a, b) => {
      const aMinor = a[0].split('.').slice(0, 2).join('.');
      const bMinor = b[0].split('.').slice(0, 2).join('.');
      const minorCmp = compareVersions(bMinor, aMinor);
      if (minorCmp !== 0) return minorCmp;
      return patchOrder(b[0]) - patchOrder(a[0]);
    })
    .map(([version, entries]) => ({ version, entries }));
}

function useUrlSync(state: { from: string; to: string; filter: FilterKind }) {
  useEffect(() => {
    const params = new URLSearchParams();
    params.set('from', state.from);
    params.set('to', state.to);
    if (state.filter !== 'new') params.set('category', state.filter);
    const next = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState(null, '', next);
  }, [state.from, state.to, state.filter]);
}

function readUrlState(
  releases: ReleaseSummary[],
  fallback: { from: string; to: string },
): { from: string; to: string; filter: FilterKind } {
  const params = new URLSearchParams(window.location.search);
  const versions = new Set(releases.map((r) => r.version));
  const fromParam = params.get('from');
  const toParam = params.get('to');
  const from = fromParam && versions.has(fromParam) ? fromParam : fallback.from;
  const to = toParam && versions.has(toParam) ? toParam : fallback.to;
  const cat = params.get('category');
  const filter: FilterKind = (['all', 'breaking', 'deprecated', 'new', 'fixed'] as const).includes(cat as never)
    ? (cat as FilterKind)
    : 'new';
  return { from, to, filter };
}

export function VersionComparison() {
  const data = useMemo(() => readData(), []);
  const [state, setState] = useState(() => {
    const fb = defaultRange(data.releases);
    return readUrlState(data.releases, fb);
  });
  const { from, to, filter } = state;
  useUrlSync(state);

  const filtered = useMemo(
    () => entriesInRange(data.entries, from, to),
    [data.entries, from, to],
  );

  const visible = useMemo(
    () => filtered.filter((e) => matchesFilter(e, filter)),
    [filtered, filter],
  );

  const groups = useMemo(() => groupByRelease(visible), [visible]);

  return (
    <div className="version-comparison">
      <div className="vc-controls">
        <VersionSelector
          label="From"
          value={from}
          releases={data.releases}
          disableNewerThan={to}
          onChange={(v) => setState((s) => ({ ...s, from: v }))}
        />
        <VersionSelector
          label="To"
          value={to}
          releases={data.releases}
          disableOlderThan={from}
          onChange={(v) => setState((s) => ({ ...s, to: v }))}
        />
      </div>
      <FilterTabs value={filter} entries={filtered} onChange={(f) => setState((s) => ({ ...s, filter: f }))} />
      <p data-testid="entry-count">{visible.length} of {filtered.length} changes</p>
      {groups.map((g) => <ReleaseGroup key={g.version} version={g.version} entries={g.entries} />)}
    </div>
  );
}
