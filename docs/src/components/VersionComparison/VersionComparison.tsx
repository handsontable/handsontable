import { useMemo, useState } from 'react';
import type { FilterKind, ReleaseSummary, VersionComparisonData, VersionEntry } from './types';

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
  const fromIdx = Math.min(releases.length - 1, 2);
  return { from: releases[fromIdx].version, to };
}

interface VersionSelectorProps {
  label: string;
  value: string;
  releases: ReleaseSummary[];
  onChange: (v: string) => void;
}

function VersionSelector({ label, value, releases, onChange }: VersionSelectorProps) {
  return (
    <label className="vc-selector">
      <span>{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        {releases.map((r) => (
          <option key={r.version} value={r.version}>
            {r.version}
            {r.isCurrent ? ' (current)' : ''}
          </option>
        ))}
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
  breaking: 'Breaking',
  deprecated: 'Deprecated',
  new: 'New',
  fixed: 'Fixed',
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
}

function FilterTabs({ value, onChange }: FilterTabsProps) {
  return (
    <div className="vc-filter-tabs" role="tablist">
      {(Object.keys(FILTER_LABELS) as FilterKind[]).map((k) => (
        <button
          key={k}
          role="tab"
          aria-selected={value === k}
          className={value === k ? 'is-active' : ''}
          onClick={() => onChange(k)}
        >
          {FILTER_LABELS[k]}
        </button>
      ))}
    </div>
  );
}

export function VersionComparison() {
  const data = useMemo(() => readData(), []);
  const [{ from, to }, setRange] = useState(() => defaultRange(data.releases));
  const [filter, setFilter] = useState<FilterKind>('all');

  const filtered = useMemo(
    () => entriesInRange(data.entries, from, to),
    [data.entries, from, to],
  );

  const visible = useMemo(
    () => filtered.filter((e) => matchesFilter(e, filter)),
    [filtered, filter],
  );

  return (
    <div className="version-comparison">
      <div className="vc-controls">
        <VersionSelector label="From" value={from} releases={data.releases} onChange={(v) => setRange((s) => ({ ...s, from: v }))} />
        <VersionSelector label="To" value={to} releases={data.releases} onChange={(v) => setRange((s) => ({ ...s, to: v }))} />
      </div>
      <FilterTabs value={filter} onChange={setFilter} />
      <p data-testid="entry-count">{visible.length} of {filtered.length} changes</p>
    </div>
  );
}
