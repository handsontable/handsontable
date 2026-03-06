# Netlify Edge Functions for Documentation Redirects

This directory contains Netlify Edge Functions that handle URL rewriting and redirects for the Handsontable documentation site. These functions ensure that users are directed to the correct framework-specific documentation based on their preferences and handle legacy URL patterns.

## `_redirects` file 

Redirects [declared](https://docs.netlify.com/manage/routing/redirects/overview/#syntax-for-the-_redirects-file) in [`_redirects`](../../_redirects) have priority before [edge functions](https://docs.netlify.com/build/edge-functions/overview/). 

## Cookie Detection 

When a user selects a framework, it is saved in the `docs_fw` cookie. The framework preference is determined using [cookieHelper.mts](../cookieHelper.mts):

```js
const getFrameworkFromCookie = (cookieValue: string) => {
  if (cookieValue === 'react') {
    return 'react-data-grid';
  }
  if (cookieValue === 'angular') {
    return 'angular-data-grid';
  }
  return 'javascript-data-grid';
};
```

## Edge Functions Overview

### 1. `redirect_docs_data_grid_page.mts`

**Purpose:** Handles specific redirects for framework-specific URLs with hardcoded path corrections.

**Path Pattern:** `/docs/(javascript|angular|react)-data-grid/(row-sorting|column-sorting|release-notes){/}?`

**Functionality:**
- Redirects specific page names to their corrected versions
- Works with framework-specific URLs (e.g., `javascript-data-grid`, `react-data-grid`, `angular-data-grid`)

**Examples:**
- `/docs/javascript-data-grid/row-sorting/` → `/docs/javascript-data-grid/rows-sorting/`
- `/docs/react-data-grid/column-sorting/` → `/docs/react-data-grid/rows-sorting/`
- `/docs/angular-data-grid/release-notes/` → `/docs/angular-data-grid/changelog/`

### 2. `redirect_cookie_docs_html.mts`

**Purpose:** Redirects legacy HTML URLs to framework-specific documentation pages.

**Path Pattern:** `/docs/(${Object.keys(redirectsMap).join('|')}).html`

**Functionality:**
- Handles URLs ending with `.html` extension
- Uses comprehensive redirect mapping for tutorials, demos, and API documentation
- Overrides framework selection for React wrapper pages
- Redirects to framework-specific paths based on user's cookie preference

**Examples:**
- `/docs/tutorial-compatibility.html` → `/docs/javascript-data-grid/supported-browsers`
- `/docs/frameworks-wrapper-for-react-installation.html` → `/docs/react-data-grid/installation`
- `/docs/demo-moving.html` → `/docs/angular-data-grid/column-moving`

### 3. `redirect_cookie_docs_pages.mts`

**Purpose:** Handles flat redirects for framework-specific pages using dynamically generated redirect mappings.

**Path Pattern:** `/docs/(${Object.keys(redirectsMap).join('|')}){/}?`

**Functionality:**
- Combines hardcoded redirects with dynamically generated ones from `redirects.mts`
- `redirects.mts` is generated from `sitemap.xml` to include all available documentation paths
- Redirects to framework-specific paths based on user's cookie preference
- Handles both legacy page names and current page structures

**Examples:**
- `/docs/api/auto-row-size` → `/docs/javascript-data-grid/api/auto-row-size`
- `/docs/row-sorting` → `/docs/react-data-grid/rows-sorting`
- `/docs/tutorial-quick-start` → `/docs/angular-data-grid/installation`

### 4. `redirect_cookie_docs.mts`

**Purpose:** Redirects the main documentation root to a framework-specific landing page.

**Path Pattern:** `/docs{/}?`

**Functionality:**
- Simple redirect from `/docs/` to `/docs/{framework}/`
- Uses the user's framework preference from the cookie
- Ensures users land on their preferred framework's documentation

**Examples:**
- `/docs/` → `/docs/javascript-data-grid/`
- `/docs` → `/docs/react-data-grid/`

### 5. `redirect_cookie_docs_x_x_html.mts`

**Purpose:** Handles versioned HTML URLs with framework-specific redirects.

**Path Pattern:** `/docs/(\\d+).(\\d+)/(${Object.keys(redirectsMap).join('|')}).html`

**Functionality:**
- Processes versioned URLs (e.g., `/docs/9.0/`, `/docs/12.1/`)
- Uses different redirect mappings for versions 12+ vs older versions
- Overrides framework selection for React wrapper pages
- Handles version-specific URL structures

**Examples:**
- `/docs/9.0/frameworks-wrapper-for-react-installation.html` → `/docs/9.0/react-data-grid/installation`
- `/docs/12.1/demo-moving.html` → `/docs/12.1/javascript-data-grid/column-moving`
- `/docs/13.0/tutorial-compatibility.html` → `/docs/13.0/react-data-grid/supported-browsers`

### 6. `rewrite_redirect_cookie_docs_x_x.mts`

**Purpose:** Handles versioned documentation URLs with conditional rewriting vs redirecting behavior.

**Path Pattern:** `/docs/(\\d+).(\\d+){/}?`

**Functionality:**
- **Rewrite behavior** (reverse proxy): For versions < 12.1, serves content directly without redirect
- **Redirect behavior**: For versions ≥ 12.1, redirects to framework-specific URLs
- Framework-aware redirects only apply to versions 12.1+ and 13+
- Older versions are served as-is without framework-specific routing

**Examples:**
- `/docs/9.0` → **Rewrite** (serves content directly)
- `/docs/12.0` → **Rewrite** (serves content directly)  
- `/docs/12.1` → **Redirect** to `/docs/12.1/react-data-grid/`
- `/docs/13.0` → **Redirect** to `/docs/13.0/javascript-data-grid/`

## Framework Override Rules

Certain URL patterns override the user's cookie preference:

- **React wrapper pages**: URLs starting with `frameworks-wrapper-for-react` always redirect to `react-data-grid`
- **Vue/Angular wrapper pages**: URLs starting with `frameworks-wrapper-for-vue` or `frameworks-wrapper-for-angular` redirect to `javascript-data-grid`

## Version-Specific Behavior

- **Versions < 12.1**: Content is served directly (rewrite behavior)
- **Versions 12.1+**: Framework-specific redirects are applied
- **Versions 13+**: Full framework-aware routing is enabled

This system ensures backward compatibility while providing modern framework-specific documentation routing for newer versions.	