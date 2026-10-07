---
name: demo-page
description: Use when creating a demo or test page for manual testing of Handsontable. Trigger when the user asks to create a demo, test page, repro page, reproduction case, manual test, or wants to verify a bug fix or feature visually. Also trigger when the user mentions dev-generated.html, dev-pr.html, dev-latest.html, dev.html, or wants to compare behavior between a released version and a local build. Use this for any PR that needs a manual testing artifact.
---

# Demo Page Generator

Generate two self-contained HTML pages at the package root, next to `handsontable/package.json`:

| File | Loads from | Purpose |
|------|-----------|---------|
| `handsontable/dev-latest.html` | jsDelivr CDN (latest published version) | Current/buggy behavior |
| `handsontable/dev-pr.html` | Local `dist/` (built from the branch) | The fix or new feature |

`/dev*.html` in `handsontable/.gitignore` ignores both. The rule covers the package root only: a copy in a subdirectory such as `test/` or `src/` shows up in `git status`.

Each page links to the other in a nav bar (the current page's link is active and non-clickable). Two files give complete JS/CSS isolation.

## Step 1: Analyze the PR context

Read the source changes (`git log`, `git diff` against the base branch, and the linked GitHub issue's reproduction steps) to determine the bug or feature, the plugins/editors/cell types/settings involved, the interaction that reproduces it (click, double-click, keyboard, scroll, touch), and any needed data shapes (merged cells, nested headers, large datasets).

## Step 2: Build Handsontable

Run the build unconditionally, whether or not `dist/` exists:

```bash
npm run build --prefix handsontable
```

## Step 3: Generate the two files

Both files are throwaway. Wipe them, then write each fresh from the templates:

```bash
rm -f handsontable/dev-pr.html handsontable/dev-latest.html
```

### Template: `handsontable/dev-latest.html` (Released / CDN)

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>[short description] - Released v__RELEASED_VERSION__</title>
  <link rel="stylesheet"
    href="https://cdn.jsdelivr.net/npm/handsontable@__RELEASED_VERSION__/styles/ht-theme-main.min.css">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 16px; background: #f5f5f5; }
    h1 { font-size: 18px; margin-bottom: 12px; }
    nav { display: flex; gap: 8px; margin-bottom: 16px; align-items: center; }
    .nav-label { font-size: 13px; color: #666; margin-right: 4px; }
    .nav-btn {
      padding: 6px 16px; border-radius: 6px; font-size: 14px; text-decoration: none;
      border: 1px solid #ccc;
    }
    .nav-btn.active { background: #fff; font-weight: 600; border-color: #999; color: #111; pointer-events: none; }
    .nav-btn:not(.active) { background: #e9e9e9; color: #333; }
    .nav-btn:not(.active):hover { background: #f0f0f0; }
    .badge { display: inline-block; font-size: 11px; padding: 1px 7px; border-radius: 10px; margin-left: 6px; vertical-align: middle; }
    .badge-cdn { background: #e3f2fd; color: #1565c0; }
    .badge-local { background: #e8f5e9; color: #2e7d32; }
    .info { background: #fff3cd; border: 1px solid #ffc107; border-radius: 6px; padding: 12px 16px; margin-bottom: 16px; font-size: 14px; line-height: 1.5; }
    .info strong { color: #856404; }
  </style>
</head>
<body>
  <h1>[Short description of what is being tested]</h1>

  <nav>
    <span class="nav-label">Version:</span>
    <span class="nav-btn active">Released <span class="badge badge-cdn">v__RELEASED_VERSION__</span></span>
    <a class="nav-btn" href="dev-pr.html">PR Build <span class="badge badge-local">local</span></a>
  </nav>

  <div class="info">
    <strong>How to test:</strong> [Step-by-step reproduction instructions]
  </div>

  <div id="hot-container"></div>

  <script src="https://cdn.jsdelivr.net/npm/handsontable@__RELEASED_VERSION__/dist/handsontable.full.min.js"></script>
  <script>
    // window.hot is exposed for browser console / DevTools debugging
    window.hot = new Handsontable(document.getElementById('hot-container'), {
      // === ADAPT THIS CONFIG TO THE TEST CASE ===
      data: Handsontable.helper.createSpreadsheetData(10, 6),
      colHeaders: true,
      rowHeaders: true,
      width: '100%',
      height: 320,
      themeName: 'ht-theme-main',
      licenseKey: 'non-commercial-and-evaluation',
    });
  </script>
</body>
</html>
```

### Template: `handsontable/dev-pr.html` (PR Build / local)

Same as `dev-latest.html` except:

- `<title>[short description] - PR Build</title>`
- stylesheet: `<link rel="stylesheet" href="styles/ht-theme-main.css">`
- nav: Released is the link, PR Build is the active span:
  ```html
  <a class="nav-btn" href="dev-latest.html">Released <span class="badge badge-cdn">v__RELEASED_VERSION__</span></a>
  <span class="nav-btn active">PR Build <span class="badge badge-local">local</span></span>
  ```
- script: `<script src="dist/handsontable.full.js"></script>`

### Placeholders (replace in both files)

| Placeholder | Value |
|-------------|-------|
| `__RELEASED_VERSION__` | Latest published version from `handsontable/package.json` (e.g. `17.0.1`). If the PR branch bumped it, use the base branch's (`git show origin/develop:handsontable/package.json`). |
| `[Short description...]` | One-line summary, e.g. "Filters dropdown closes on Android touch" |
| `[Step-by-step reproduction...]` | Numbered reviewer steps, e.g. "1. Double-tap cell A1. 2. The editor should open and stay open." |

Keep the `<script>` config identical in both files, so any behavioral difference comes from the code change.

### Adapting the config

- Bug fix: the minimal settings that trigger the bug. `dev-latest.html` shows it broken, `dev-pr.html` fixed.
- Feature: `dev-latest.html` shows the "before" state (feature absent), `dev-pr.html` the new capability.
- Plugin-specific: enable the plugin with settings that exercise the changed paths, e.g. Filters: `dropdownMenu: true, filters: true`, `createSpreadsheetData(20, 6)`, `height: 400`.
- Touch/mobile: `width: '100%'` and touch-specific steps in the instructions.
- Third-party libraries (flatpickr, Pickr, etc.) and extra CSS go in the `<head>` of both files from a CDN, at the same versions:
  ```html
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/flatpickr/dist/flatpickr.min.css">
  <script src="https://cdn.jsdelivr.net/npm/flatpickr"></script>
  ```

## Step 4: Serve and verify

```bash
python3 -m http.server 8767 --directory handsontable &
curl -s -o /dev/null -w "dev-latest: %{http_code}\n" http://localhost:8767/dev-latest.html && \
curl -s -o /dev/null -w "dev-pr:     %{http_code}\n" http://localhost:8767/dev-pr.html
```

Give the user both URLs: `http://localhost:8767/dev-latest.html` (Released, CDN) and `http://localhost:8767/dev-pr.html` (PR Build, local).

## Notes

- If the released version used the pre-v17 CSS system (`dist/handsontable.full.css`), adjust the CDN CSS link in `dev-latest.html`.
- For very old version comparisons, confirm the config's API exists in both versions.
