# Version Comparison Dashboard — design spec

**Date:** 2026-05-15
**Status:** Approved (pending implementation)
**Scope:** docs site (`docs/` package)

## 1. Goal

Add a new page under the "Upgrade and migration" tab that lets a user pick two Handsontable versions (`From` and `To`) and see what changed between them — with the most impactful changes highlighted per release. The page replaces the need to read multiple changelog pages back-to-back when planning an upgrade.

## 2. User outcome

- A reader on v13 considering v17 lands on one page and sees, in order, the breaking changes, deprecations, new APIs, and other notable changes for every minor release between v13 and v17.
- Each release shows a small set of "featured" changes with full context (code diff, why it matters, link to the migration guide section). The remaining changes are listed compactly.
- The reader can filter the list by category (Breaking / Deprecated / New / Fixed) and share a deep link with `From`, `To`, and category preselected.

## 3. Non-goals

- No per-client presets (the "Quick load client" panel from the inspiration mockup is out of scope — this is public docs, not a multi-tenant tool).
- No "Features in use" checkbox filter. Cut from MVP. Can be revisited once auto-extracted entries gain reliable `featureGroup` tags.
- No edits to existing changelog or migration-guide pages.
- No data fetched at runtime. All data is bundled at build time.

## 4. Page location and navigation

| Field | Value |
|---|---|
| Page path | `docs/content/guides/upgrade-and-migration/version-comparison/version-comparison.md` |
| URL | `/version-comparison` |
| Sidebar | First item in `upgradeAndMigrationItems` in `docs/content/guides/sidebar.js` (above the `changelogItems` spread) |
| Diátaxis type | `reference` |

Frontmatter follows the project's docs schema (see `docs/CLAUDE.md` §2.6). Title: "Version comparison".

## 5. Data architecture

Two layers merged at build time.

### 5.1 Layer A — auto-extracted from existing changelogs

A build-time parser reads the eleven existing changelog markdown files in `docs/content/guides/upgrade-and-migration/changelog-*/changelog-*.md` (v7 through v17) and emits a flat list of change entries.

**Parser location:** `docs/src/plugins/changelog-parser.mjs`

**Parsing rules:**

- `## X.Y.Z` heading → version
- "Released on <date>" line below it → ISO date
- `#### Added | Changed | Deprecated | Removed | Fixed` → category
- `**Breaking change**:` prefix inside a bullet → `breaking: true`
- `[#NNNN](.../pull/NNNN)` → `prNumber: NNNN`
- Framework prefix in bullets (e.g., "React:", "Angular:") → `framework`
- Bullets without `**Breaking change**` and without framework prefix are tagged `framework: 'core'`

**Output entry shape:**

```typescript
type AutoEntry = {
  version: string;          // "17.0.0"
  releaseDate: string;       // ISO "2026-03-09"
  category: 'added' | 'changed' | 'deprecated' | 'removed' | 'fixed';
  breaking: boolean;
  title: string;             // bullet text minus the PR link
  prNumber: number | null;
  framework: 'core' | 'react' | 'angular' | 'vue';
};
```

**Patch handling:** the parser keeps all entries (patches included), but the loader filters them out when building the version path (see §5.3). Patch-level fixes can be promoted into the manual highlights layer if they warrant attention.

### 5.2 Layer B — manual highlights

Per-release JSON files at `docs/content/data/version-highlights/<X.Y>.json`. Optional — releases without a file fall back to auto-extracted data only.

**Schema (validated by JSON Schema at build time):**

```json
{
  "version": "17.0",
  "highlighted": [
    {
      "prNumber": 11950,
      "tagline": "New Theme API",
      "whyItMatters": "Replaces the legacy stylesheet. Required upgrade if you import handsontable.full.min.css.",
      "codeBefore": "import 'handsontable/dist/handsontable.full.min.css';",
      "codeAfter": "import { classicTheme } from 'handsontable/themes';\nnew Handsontable(el, { theme: classicTheme });",
      "migrationAnchor": "/migration-from-16.2-to-17.0#1-remove-legacy-styles"
    }
  ]
}
```

**Field rules:**

- `prNumber` must match an existing auto-extracted entry for the corresponding minor release (the patch level is not part of the match — a highlight for `17.0.json` matches a PR introduced in any `17.0.x`).
- `tagline` is the short human title shown in the featured card; it replaces the auto-extracted bullet text.
- `whyItMatters`: 1–3 sentences. Plain text. Required.
- `codeBefore` / `codeAfter`: optional. If present, both must be present. Rendered as a diff block.
- `migrationAnchor`: optional. Must be a path beginning with `/migration-from-`.
- Maximum 5 highlighted entries per release file (enforced by validator).

### 5.3 Loader

`docs/src/plugins/version-highlights-loader.mjs`:

1. Calls the parser once per build, caches result.
2. Reads all `content/data/version-highlights/*.json` via `import.meta.glob`.
3. Validates highlight files against the JSON schema; build fails on any violation.
4. Validates that every `prNumber` in highlights exists in auto-extracted data; build fails otherwise.
5. Merges: an auto entry whose `prNumber` matches a highlight gets `highlighted: true` plus the highlight fields.
6. Returns `{ releases: ReleaseSummary[], entries: MergedEntry[] }` where `releases` lists all `X.Y.0` versions sorted descending (used for the From/To dropdowns and breadcrumb path).

`ReleaseSummary` shape:

```typescript
type ReleaseSummary = {
  version: string;         // "17.0"
  releaseDate: string;     // ISO
  major: number;
  minor: number;
  isCurrent: boolean;      // matches handsontable package version at build time
};
```

Patches are excluded from `releases` (path nodes show only `X.Y.0`). Patch-level entries remain in `entries` for completeness and can still be promoted via highlights.

## 6. UI components

One React component, hydrated into the markdown page. Pattern follows `docs/src/components/DocsAssistant/` (existing precedent in this project).

**Files:**

- `docs/src/components/VersionComparison/VersionComparison.tsx`
- `docs/src/components/VersionComparison/VersionComparison.css`
- `docs/src/components/VersionComparison/types.ts`
- Sub-components inline in the same file unless they exceed ~80 lines: `VersionSelector`, `VersionBreadcrumb`, `StatCards`, `FilterTabs`, `FeaturedEntry`, `CompactEntry`, `ReleaseGroup`.

### 6.1 Layout (top to bottom)

1. **From / To selector** — two native `<select>` elements bound to the releases list. Defaults: `From` = current minus 2 majors (or oldest if fewer), `To` = current.
2. **Version breadcrumb path** — list of all `X.Y.0` releases between `From` and `To` inclusive. If the list has more than 8 nodes, collapses the middle to `…` and shows only the four edges. Each node is a button that sets `To`.
3. **Stat cards** (four): Breaking / Deprecated / New / Fixed. Each card shows the count of entries in the `From..To` window that match the same rules as the filter tab of the same name (see §6.2). Clicking a card sets the corresponding filter tab.
4. **Filter tabs**: All / Breaking / Deprecated / New / Fixed. Single-select.
5. **Release list** — groups by release, newest first. Within a group:
   - All `highlighted: true` entries rendered as `FeaturedEntry` cards at the top: tagline, category pill, version pill, `whyItMatters` text, optional code diff (`<pre>` with before/after), link to migration guide if `migrationAnchor` is set.
   - Remaining entries rendered as `CompactEntry` rows: title, category pill, PR link. Initially collapsed when a release has more than 10 compact entries; "Show all N changes" expands it.

### 6.2 State

All state local to the component:

```typescript
type State = {
  from: string;           // "13.0"
  to: string;             // "17.0"
  category: 'all' | 'breaking' | 'deprecated' | 'new' | 'fixed';
  expandedReleases: Set<string>;
};
```

Category mapping (filter → parsed categories):

| Filter | Matches |
|---|---|
| `breaking` | `breaking === true` (regardless of category) |
| `deprecated` | `category === 'deprecated'` |
| `new` | `category === 'added'` and `breaking === false` |
| `fixed` | `category === 'fixed'` |
| `all` | everything |

### 6.3 URL synchronization

On state change, the component updates `window.location` via `history.replaceState` with query params: `from`, `to`, `category`. On mount, the component reads those params (with validation against the releases list) and seeds initial state. Missing or invalid params fall back to defaults.

### 6.4 Embedding in the markdown page

The page is a normal `.md` file with frontmatter (`type: reference`) and a short intro paragraph. The component is mounted into a placeholder `<div id="version-comparison-root"></div>` via an inline `<script>` import — same hydration pattern used by `DocsAssistantWidget`.

## 7. Styling

CSS lives in `docs/src/components/VersionComparison/VersionComparison.css`. Uses Starlight CSS variables and the project's `--ht-*` tokens from `docs/src/styles/`. Visual conventions:

- Category pill colors: breaking = red, deprecated = amber, new = green, fixed = neutral, changed = blue.
- Featured entry: left border in category color, 4px wide, lifted background.
- Compact entry: single line, 32px tall, subtle hover state.
- Responsive: at <768px viewport the breadcrumb scrolls horizontally; stat cards stack to 2×2.

## 8. Build-time validation (CI)

New step in the docs CI workflow runs `node docs/scripts/validate-version-highlights.mjs`:

- Lints every `content/data/version-highlights/*.json` against the JSON schema.
- Asserts every `prNumber` in highlights exists in the auto-extracted parser output.
- Asserts no highlight file has more than 5 entries.
- Asserts every highlight file's `version` matches its filename.

Build fails on any violation.

## 9. Initial data coverage

- All eleven auto-extracted changelogs are loaded as soon as the parser ships.
- Manual highlights at launch: v17.0, v16.2, v16.0, v15.0, v14.0 (the four most-recent migration paths). Up to five highlights each, curated by hand. Older majors render with auto data only; highlights may be added in follow-up PRs.

## 10. Test plan

- **Unit (Jest, `docs/src/plugins/__tests__/`)**:
  - Parser correctly extracts version, date, category, breaking flag, PR number, framework prefix for each of the eleven changelog files.
  - Highlight validator rejects: missing `whyItMatters`, partial code pair (`codeBefore` without `codeAfter`), unknown `prNumber`, more than 5 entries, mismatched `version`.
  - Loader merges auto + highlights correctly; orphan PR numbers cause a thrown error.
  - `ReleaseSummary` excludes patch versions.
- **E2E (Playwright, existing docs setup)**:
  - Page renders with default From/To.
  - Changing the dropdown updates the entry list count.
  - Clicking a category tab filters entries.
  - Clicking a breadcrumb node moves `To`.
  - Deep link `/version-comparison?from=14.0&to=17.0&category=breaking` restores state on load.
  - Featured entry shows code diff and migration link when present.

## 11. Implementation milestones

1. Parser + unit tests (parses all eleven changelogs).
2. Highlight JSON schema + validator script + CI hook.
3. Loader (merge + patch filter) + unit tests.
4. Seed five `<X.Y>.json` files (v14.0, v15.0, v16.0, v16.2, v17.0).
5. Component skeleton: selectors + entry list (no filters yet, no breadcrumb).
6. Stat cards + filter tabs.
7. Breadcrumb path with collapse-when-long.
8. URL sync (query params).
9. Markdown page + sidebar entry.
10. Styling pass.
11. E2E tests.

## 12. Risks and decisions

| Risk | Mitigation |
|---|---|
| Parser brittleness if changelog format drifts | Strict parser with unit tests over real fixtures; CI fails on changelog edits that break parsing. |
| Highlight maintenance burden at release time | Validator + max-5 rule keeps the surface tiny; release checklist in `pr-creation` skill gets a new bullet. |
| Long path lists for cross-major upgrades (e.g., v7 → v17) | Collapse-when-long breadcrumb keeps UI usable. |
| Bundle size from eleven changelog markdown files | Parser runs at build time; only the structured output ships to the client. |
| Diátaxis classification | Settled on `reference` — the page is a structured lookup tool, not a narrative explanation. |
