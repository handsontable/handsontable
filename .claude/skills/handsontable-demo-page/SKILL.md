---
name: demo-page
description: Use when creating a demo or test page for manual testing of Handsontable. Trigger when the user asks to create a demo, test page, repro page, reproduction case, manual test, or wants to verify a bug fix or feature visually. Also trigger when the user mentions dev-generated.html, dev.html, or wants to compare behavior between a released version and a local build. Use this for any PR that needs a manual testing artifact.
---

# Demo Page Generator

Generate a self-contained HTML demo page at `handsontable/dev-generated.html` for manual testing. This file is gitignored (`dev*.html` pattern), so it never pollutes the repo.

The demo has two tabs so a reviewer can instantly compare behavior:

| Tab | Loads from | Purpose |
|-----|-----------|---------|
| **Released** | jsDelivr CDN (latest published version) | Shows the current/buggy behavior |
| **PR Build** | Local `dist/` (built from the branch) | Shows the fix or new feature |

This side-by-side comparison makes PR review faster — the reviewer sees the bug on the Released tab and verifies the fix on the PR Build tab without switching branches.

## Step 1 — Analyze the PR context

Before generating the demo, understand what needs testing. Read the relevant source changes to determine:

- What bug is being fixed, or what feature is being added?
- Which plugins, editors, cell types, or settings are involved?
- What user interaction reproduces the issue (click, double-click, keyboard, scroll, touch)?
- Are there specific data shapes needed (merged cells, nested headers, large datasets)?

Use `git log` and `git diff` against the base branch to understand the changes. If there's a linked GitHub issue, read it for reproduction steps.

## Step 2 — Build Handsontable

The PR Build tab loads from `dist/`, so it must be up to date:

```bash
ls handsontable/dist/handsontable.full.min.js 2>/dev/null || echo "NEEDS BUILD"
```

If missing or stale, build:

```bash
npm run build --prefix handsontable
```

## Step 3 — Generate the demo page

Write `handsontable/dev-generated.html` using the template structure below. Adapt the Handsontable configuration in each tab to target the specific bug or feature being tested.

### Template structure

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Manual Test — [short description]</title>

  <!-- Released version (CDN) -->
  <link id="css-released" rel="stylesheet"
    href="https://cdn.jsdelivr.net/npm/handsontable@__RELEASED_VERSION__/styles/ht-theme-main.min.css">

  <!-- PR Build version (local) -->
  <link id="css-pr" rel="stylesheet" href="styles/ht-theme-main.css" disabled>

  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 16px; background: #f5f5f5; }
    h1 { font-size: 18px; margin-bottom: 4px; }

    .tabs { display: flex; gap: 0; margin-bottom: 16px; margin-top: 12px; }
    .tab-btn {
      padding: 8px 20px; border: 1px solid #ccc; background: #e9e9e9;
      cursor: pointer; font-size: 14px; transition: background 0.15s;
    }
    .tab-btn:first-child { border-radius: 6px 0 0 6px; }
    .tab-btn:last-child { border-radius: 0 6px 6px 0; }
    .tab-btn.active { background: #fff; font-weight: 600; border-bottom-color: #fff; }
    .tab-btn:not(.active):hover { background: #f0f0f0; }

    .tab-panel { display: none; }
    .tab-panel.active { display: block; }

    .info { background: #fff3cd; border: 1px solid #ffc107; border-radius: 6px; padding: 12px 16px; margin-bottom: 16px; font-size: 14px; line-height: 1.5; }
    .info strong { color: #856404; }

    .version-badge {
      display: inline-block; font-size: 12px; padding: 2px 8px;
      border-radius: 10px; margin-left: 8px; vertical-align: middle;
    }
    .version-badge.cdn { background: #e3f2fd; color: #1565c0; }
    .version-badge.local { background: #e8f5e9; color: #2e7d32; }
  </style>
</head>
<body>

  <h1>
    [Short description of what is being tested]
  </h1>

  <div class="tabs">
    <button class="tab-btn active" data-tab="released">
      Released <span class="version-badge cdn">v__RELEASED_VERSION__</span>
    </button>
    <button class="tab-btn" data-tab="pr">
      PR Build <span class="version-badge local">local</span>
    </button>
  </div>

  <div class="info">
    <strong>How to test:</strong> [Step-by-step reproduction instructions]
  </div>

  <div id="panel-released" class="tab-panel active">
    <div id="hot-released"></div>
  </div>

  <div id="panel-pr" class="tab-panel">
    <div id="hot-pr"></div>
  </div>

  <!-- Released version JS (CDN) -->
  <script id="js-released"
    src="https://cdn.jsdelivr.net/npm/handsontable@__RELEASED_VERSION__/dist/handsontable.full.min.js"></script>

  <!-- Save CDN Handsontable reference before local build overwrites it -->
  <script>
    window.HandsontableReleased = window.Handsontable;
  </script>

  <!-- PR Build JS (local) -->
  <script id="js-pr" src="dist/handsontable.full.js"></script>
  <script>
    window.HandsontablePR = window.Handsontable;
  </script>

  <script>
    // ── Tab switching ─────────────────────────────────
    const tabs = document.querySelectorAll('.tab-btn');
    const panels = { released: document.getElementById('panel-released'), pr: document.getElementById('panel-pr') };
    const cssReleased = document.getElementById('css-released');
    const cssPR = document.getElementById('css-pr');
    let hotInstances = {};

    function switchTab(name) {
      tabs.forEach(b => b.classList.toggle('active', b.dataset.tab === name));
      Object.entries(panels).forEach(([k, p]) => p.classList.toggle('active', k === name));

      // Swap stylesheets
      cssReleased.disabled = (name !== 'released');
      cssPR.disabled = (name !== 'pr');

      // Lazy-init the grid on first visit
      if (!hotInstances[name]) {
        hotInstances[name] = createInstance(name);
      } else {
        hotInstances[name].render();
      }
    }

    tabs.forEach(btn => btn.addEventListener('click', () => switchTab(btn.dataset.tab)));

    // ── Grid configuration ────────────────────────────
    // Adapt this function to the specific bug/feature being tested.
    function createInstance(which) {
      const Ht = which === 'released' ? HandsontableReleased : HandsontablePR;
      const container = which === 'released'
        ? document.getElementById('hot-released')
        : document.getElementById('hot-pr');

      return new Ht(container, {
        // === ADAPT THIS CONFIG TO THE TEST CASE ===
        data: Ht.helper.createSpreadsheetData(10, 6),
        colHeaders: true,
        rowHeaders: true,
        width: '100%',
        height: 320,
        themeName: 'ht-theme-main',
        licenseKey: 'non-commercial-and-evaluation',
      });
    }

    // Init the first tab
    hotInstances['released'] = createInstance('released');
  </script>
</body>
</html>
```

### Filling in the template

Replace these placeholders:

| Placeholder | Value |
|-------------|-------|
| `__RELEASED_VERSION__` | The latest published version from `handsontable/package.json` (e.g., `17.0.1`). If the PR branch itself bumped the version, use the version from the base branch (`git show origin/develop:handsontable/package.json`). |
| `[Short description...]` | A one-line summary, e.g., "Filters dropdown closes on Android touch" |
| `[Step-by-step reproduction...]` | Numbered steps the reviewer should follow, e.g., "1. Double-tap cell A1. 2. The editor should open and stay open." |

### Adapting the config

The `createInstance()` function is where all the test-specific logic goes. Tailor it based on what the PR changes:

**Bug fix PRs** — Configure the grid to reproduce the bug. The Released tab should exhibit the broken behavior; the PR Build tab should show it fixed. Include the minimal settings needed to trigger the issue.

**Feature PRs** — Configure the grid to showcase the new feature. The Released tab shows the "before" state (feature absent); the PR Build tab demonstrates the new capability.

**Plugin-specific** — Enable the relevant plugin with settings that exercise the changed code paths. Example for Filters:

```js
return new Ht(container, {
  data: Ht.helper.createSpreadsheetData(20, 6),
  colHeaders: true,
  rowHeaders: true,
  dropdownMenu: true,
  filters: true,
  width: '100%',
  height: 400,
  themeName: 'ht-theme-main',
  licenseKey: 'non-commercial-and-evaluation',
});
```

**Touch/mobile testing** — Add the viewport meta tag (already in template) and keep the grid width responsive (`width: '100%'`). Mention touch-specific steps in the instructions.

**Third-party integrations** — If the demo needs external libraries (flatpickr, Pickr, etc.), load them from CDN in both tabs. Keep versions consistent between tabs.

### Additional CSS and external libraries

If the test needs extra CSS or third-party libraries, add them to the `<head>`:

```html
<!-- Example: flatpickr for date editor testing -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/flatpickr/dist/flatpickr.min.css">
<script src="https://cdn.jsdelivr.net/npm/flatpickr"></script>
```

Load third-party libraries once (before both Handsontable scripts) so both tabs share them.

## Step 4 — Serve and verify

Start a local server from the `handsontable/` directory:

```bash
python3 -m http.server 8767 --directory handsontable &
```

Verify both tabs work:

```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:8767/dev-generated.html
```

The page is at: `http://localhost:8767/dev-generated.html`

Tell the user the URL so they can open it in a browser and test.

## Important notes

- The file is gitignored — it will not appear in `git status` or get committed.
- Each tab has its own Handsontable instance. The CDN version is saved to `window.HandsontableReleased` before the local build script overwrites `window.Handsontable`.
- Stylesheet switching uses the `disabled` attribute on `<link>` elements so only one theme is active at a time.
- If the released version used the old CSS system (pre-v17, `dist/handsontable.full.css`), adjust the CDN CSS link accordingly.
- For very old version comparisons, check that the API used in `createInstance()` exists in both versions.
