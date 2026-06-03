import './VersionComparison.css';
import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
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
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('click', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('click', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const selected = releases.find((r) => r.version === value);
  const triggerLabel = selected
    ? `${selected.version}${selected.isCurrent ? ' (current)' : ''}`
    : value;

  return (
    <div className="vc-selector" ref={wrapperRef}>
      <span className="vc-selector-label">{label}</span>
      <button
        type="button"
        className="vc-selector-trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="vc-selector-value">{triggerLabel}</span>
        <svg className="vc-selector-chevron" aria-hidden="true" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 9l6 6l6 -6" />
        </svg>
      </button>
      {open && (
        <ul className="vc-selector-menu" role="listbox" aria-label={label}>
          {releases.map((r) => {
            const tooNew = disableNewerThan ? compareVersions(r.version, disableNewerThan) > 0 : false;
            const tooOld = disableOlderThan ? compareVersions(r.version, disableOlderThan) < 0 : false;
            const disabled = tooNew || tooOld;
            const isSelected = r.version === value;
            return (
              <li role="none" key={r.version}>
                <button
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  aria-disabled={disabled}
                  disabled={disabled}
                  className={`vc-selector-item ${isSelected ? 'is-selected' : ''}`}
                  onClick={() => {
                    if (disabled) return;
                    onChange(r.version);
                    setOpen(false);
                  }}
                >
                  {r.version}{r.isCurrent ? ' (current)' : ''}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
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
  new: 'New',
  fixed: 'Fixed',
  deprecated: 'Deprecated',
  breaking: 'Breaking',
  all: 'All',
};

function matchesFilter(entry: VersionEntry, filter: FilterKind): boolean {
  switch (filter) {
    case 'all': return true;
    case 'breaking': return entry.breaking;
    case 'deprecated': return entry.category === 'deprecated' && !entry.breaking;
    case 'new': return entry.category === 'added' && !entry.breaking;
    case 'fixed': return entry.category === 'fixed' && !entry.breaking;
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

const CATEGORY_LABELS: Record<ChangeCategory, string> = {
  added: 'New',
  changed: 'Changed',
  deprecated: 'Deprecated',
  removed: 'Removed',
  fixed: 'Fixed',
};

function pillLabel(category: ChangeCategory, breaking: boolean) {
  if (breaking) return 'Breaking';
  return CATEGORY_LABELS[category];
}

function prHref(prNumber: number | null, prKind: 'issues' | 'pull' | null) {
  // Roughly 55% of changelog bullets cite `/issues/...` rather than `/pull/...`,
  // so the link must honor whichever URL kind the parser captured. Building
  // `/pull/` unconditionally sends issue references to the wrong destination
  // (often a 404 or an unrelated PR).
  if (prNumber === null || prKind === null) return null;
  return `https://github.com/handsontable/handsontable/${prKind}/${prNumber}`;
}

function FeaturedEntry({ entry }: { entry: VersionEntry }) {
  const href = prHref(entry.prNumber, entry.prKind);
  const content = (
    <>
      <header className="vc-featured-card-header">
        <span className={pillClass(entry.category, entry.breaking)}>{pillLabel(entry.category, entry.breaking)}</span>
        {entry.prNumber !== null && (
          <span className="vc-featured-card-pr">#{entry.prNumber}</span>
        )}
      </header>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        disallowedElements={['a']}
        unwrapDisallowed
        components={{ p: ({ children }) => <p className="vc-featured-card-title">{children}</p> }}
      >
        {entry.tagline ?? entry.title}
      </ReactMarkdown>
      {entry.whyItMatters && (
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          disallowedElements={['a']}
          unwrapDisallowed
          components={{ p: ({ children }) => <p className="vc-featured-card-why">{children}</p> }}
        >
          {entry.whyItMatters}
        </ReactMarkdown>
      )}
    </>
  );
  if (href === null) {
    return <article className="vc-featured-card">{content}</article>;
  }
  return (
    <a className="vc-featured-card" href={href} target="_blank" rel="noreferrer">
      {content}
    </a>
  );
}

function CompactEntry({ entry }: { entry: VersionEntry }) {
  const href = prHref(entry.prNumber, entry.prKind);
  const content = (
    <>
      <span className={pillClass(entry.category, entry.breaking)}>{pillLabel(entry.category, entry.breaking)}</span>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        disallowedElements={['a']}
        unwrapDisallowed
        components={{ p: ({ children }) => <span className="vc-entry-title">{children}</span> }}
      >
        {entry.title}
      </ReactMarkdown>
      {entry.prNumber !== null && <span className="vc-entry-pr">#{entry.prNumber}</span>}
    </>
  );
  return (
    <li className="vc-entry">
      {href === null ? (
        <span className="vc-entry-compact">{content}</span>
      ) : (
        <a className="vc-entry-compact" href={href} target="_blank" rel="noreferrer">{content}</a>
      )}
    </li>
  );
}

const COMPACT_THRESHOLD = 5;

function ReleaseGroup({ version, entries, showFeatured }: { version: string; entries: VersionEntry[]; showFeatured: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const featured = showFeatured ? entries.filter((e) => e.highlighted) : [];
  const compact = showFeatured ? entries.filter((e) => !e.highlighted) : entries;
  const isCollapsible = compact.length > COMPACT_THRESHOLD;
  const shown = !isCollapsible || expanded
    ? compact
    : compact.slice(0, COMPACT_THRESHOLD);

  return (
    <section className="vc-release-group" id={`vc-v${version}`}>
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
      {isCollapsible && (
        <button type="button" className="vc-show-all" onClick={() => setExpanded((v) => !v)}>
          {expanded ? 'Show fewer changes' : `Show all ${compact.length} changes`}
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
  useEffect(() => {
    document.body.classList.add('vc-page');
    return () => document.body.classList.remove('vc-page');
  }, []);

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
      {groups.map((g) => <ReleaseGroup key={g.version} version={g.version} entries={g.entries} showFeatured={filter !== 'breaking'} />)}
      <TocPortal groups={groups} />
    </div>
  );
}

function useActiveVersion(versions: string[]): string | null {
  const [active, setActive] = useState<string | null>(versions[0] ?? null);
  useEffect(() => {
    if (versions.length === 0) return;
    // Scroll-spy: on each intersection event, walk all observed sections and
    // pick the one whose heading is the most recently passed. A section is
    // "passed" when its `top` is at or above the page's `scroll-padding-top`
    // line — i.e. the line that hash-link navigation aligns each heading to.
    // Reading scroll-padding-top from the scrolling element lets the
    // threshold match the actual layout (Starlight uses 124px on this page)
    // instead of a magic number, and avoids two bugs:
    //
    // - Too-tight threshold (like a hard-coded 80) excludes freshly-clicked
    //   headings, leaving only the section above qualifying → marker shows
    //   the previous version (off-by-one above).
    // - Too-loose threshold (like `top < window.innerHeight * 0.5`) lets
    //   short sections below the current one qualify, and "largest top wins"
    //   would pick a section the user hasn't reached yet → marker shows the
    //   next version (off-by-one below).
    //
    // Among qualifying (passed) sections, picking the largest top yields the
    // most recently passed heading — the one the reader is currently on.
    // The observer only triggers the recompute — it does not influence which
    // version wins.
    const observer = new IntersectionObserver(
      () => {
        const scrollEl = document.scrollingElement || document.documentElement;
        const padTop = parseFloat(getComputedStyle(scrollEl).scrollPaddingTop);
        const threshold = Number.isFinite(padTop) ? padTop : 0;
        let best: string | null = versions[0] ?? null;
        let bestTop = -Infinity;
        for (const v of versions) {
          const el = document.getElementById(`vc-v${v}`);
          if (!el) continue;
          const rect = el.getBoundingClientRect();
          if (rect.top <= threshold && rect.top > bestTop) {
            bestTop = rect.top;
            best = v;
          }
        }
        if (best) setActive(best);
      },
      { rootMargin: '-80px 0px -50% 0px', threshold: [0, 0.1, 0.5, 1] },
    );
    for (const v of versions) {
      const el = document.getElementById(`vc-v${v}`);
      if (el) {
        el.dataset.vcVersion = v;
        observer.observe(el);
      }
    }
    return () => observer.disconnect();
  }, [versions.join('|')]);
  return active;
}

function TocPortal({ groups }: { groups: { version: string; entries: VersionEntry[] }[] }) {
  const [target, setTarget] = useState<Element | null>(null);
  const versions = useMemo(() => groups.map((g) => g.version), [groups]);
  const active = useActiveVersion(versions);
  useEffect(() => {
    setTarget(document.getElementById('vc-toc-portal-target'));
  }, []);
  if (!target || groups.length === 0) return null;
  return createPortal(
    <nav className="vc-toc" aria-label="Versions in range">
      <h3 className="vc-toc-heading">Versions</h3>
      <ul className="vc-toc-list">
        {groups.map((g) => (
          <li key={g.version}>
            <a
              href={`#vc-v${g.version}`}
              aria-current={active === g.version ? 'true' : undefined}
              className={active === g.version ? 'is-active' : undefined}
            >
              {g.version}
            </a>
          </li>
        ))}
      </ul>
    </nav>,
    target,
  );
}
