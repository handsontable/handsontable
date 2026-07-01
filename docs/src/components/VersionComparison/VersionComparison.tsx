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

// Breaking highlights are also surfaced on the New tab for now, so a major
// release's headline features (often breaking, e.g. a TypeScript migration or a
// new layout system) stay visible on the default landing view. Set this to false
// to revert to showing breaking highlights only on the Breaking and All tabs.
const SHOW_BREAKING_HIGHLIGHTS_ON_NEW = true;

// Whether a highlighted entry renders as a featured card under the active filter.
// A highlight always shows on All and on the tab matching its own category
// (a deprecated highlight on Deprecated, a breaking one on Breaking, and so on),
// so it never leaks onto an unrelated tab. The one exception is the revertable
// rule above that also promotes breaking highlights onto New.
function isFeatured(entry: VersionEntry, filter: FilterKind): boolean {
  if (!entry.highlighted) return false;
  if (filter === 'all') return true;
  if (matchesFilter(entry, filter)) return true;
  return SHOW_BREAKING_HIGHLIGHTS_ON_NEW && filter === 'new' && entry.breaking;
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

function ReleaseGroup({ version, entries, filter }: { version: string; entries: VersionEntry[]; filter: FilterKind }) {
  const [expanded, setExpanded] = useState(false);
  const featured = entries.filter((e) => isFeatured(e, filter));
  const compact = entries.filter((e) => !isFeatured(e, filter));
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

  // A release's featured highlights are drawn from its in-range entries
  // independent of the category filter (see isFeatured), so they must be kept in
  // the visible set even when they don't match the active filter. Otherwise a
  // breaking headline feature would never appear on the default New tab.
  const visible = useMemo(
    () => filtered.filter((e) => isFeatured(e, filter) || matchesFilter(e, filter)),
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
      {groups.map((g) => <ReleaseGroup key={g.version} version={g.version} entries={g.entries} filter={filter} />)}
      <TocPortal groups={groups} />
    </div>
  );
}

function useActiveVersion(versions: string[]): string | null {
  const [active, setActive] = useState<string | null>(versions[0] ?? null);
  useEffect(() => {
    if (versions.length === 0) return;
    let raf: number | null = null;
    // After a hash-link click, hold the clicked section active until the user
    // scrolls away from its landing position. This prevents the focus-line
    // rule (below) from picking a different section when the clicked one is
    // shorter than half the viewport (e.g. patch releases like 16.1.1).
    let hashAnchorY: number | null = null;
    let hashOverride: string | null = null;

    const resolveHash = (): string | null => {
      const m = window.location.hash.match(/^#vc-v(\d+\.\d+\.\d+)$/);
      if (!m) return null;
      return versions.includes(m[1]) ? m[1] : null;
    };

    const compute = () => {
      raf = null;

      // (1) Hash override — active until the user scrolls more than a small
      // distance from the post-click landing point.
      if (hashOverride !== null && hashAnchorY !== null) {
        if (Math.abs(window.scrollY - hashAnchorY) < 24) {
          setActive(hashOverride);
          return;
        }
        hashOverride = null;
        hashAnchorY = null;
      }

      // (2) Page-top sentinel: while the first section's heading is still
      // in view from above (rect.top >= 0), the user hasn't entered later
      // sections yet. This handles the common case of landing at the top of
      // the page when the first section is shorter than half the viewport
      // (e.g. a patch release), where the focus-line rule below would
      // otherwise pick the next, taller section.
      const firstEl = document.getElementById(`vc-v${versions[0]}`);
      if (firstEl && firstEl.getBoundingClientRect().top >= 0) {
        setActive(versions[0]);
        return;
      }

      // (3) Steady-state rule: pick the section spanning the mid-viewport
      // focus line. Symmetric in both scroll directions, switches at the
      // equal-area point where the next section starts dominating. Threshold-
      // based rules (which the previous algorithm used) have an asymmetric
      // early-switch where one direction lags the visual transition by one
      // section. Starlight's built-in TOC scroll-spy has the same quirk; it
      // is imperceptible on paragraph-sized sections but very visible on the
      // multi-hundred-pixel release groups on this page.
      const focusLine = window.innerHeight / 2;
      let containedBy: string | null = null;
      let lastPassed: string | null = null;
      for (const v of versions) {
        const el = document.getElementById(`vc-v${v}`);
        if (!el) continue;
        const rect = el.getBoundingClientRect();
        if (rect.top <= focusLine && rect.bottom > focusLine) {
          containedBy = v;
          break;
        }
        if (rect.bottom <= focusLine) {
          lastPassed = v;
        }
      }
      setActive(containedBy ?? lastPassed ?? versions[0] ?? null);
    };

    const onScroll = () => {
      if (raf !== null) return;
      raf = requestAnimationFrame(compute);
    };

    const onHashChange = () => {
      const v = resolveHash();
      if (!v) return;
      hashOverride = v;
      setActive(v);
      // The browser's auto-scroll for the hash may still be settling, so
      // capture the landing scrollY shortly after the event fires.
      setTimeout(() => {
        hashAnchorY = window.scrollY;
      }, 150);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('hashchange', onHashChange);

    // Initial run handles two cases: loaded with a hash (set override via the
    // same path as a click) and loaded without one (use focus-line).
    const initialHash = resolveHash();
    if (initialHash) {
      hashOverride = initialHash;
      setActive(initialHash);
      setTimeout(() => { hashAnchorY = window.scrollY; }, 150);
    } else {
      compute();
    }

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('hashchange', onHashChange);
      if (raf !== null) cancelAnimationFrame(raf);
    };
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
