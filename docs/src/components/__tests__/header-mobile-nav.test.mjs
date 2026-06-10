import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const headerPath = fileURLToPath(new URL('../Header.astro', import.meta.url));
const headerSource = readFileSync(headerPath, 'utf8');
const mobileNavScriptBlock = headerSource.slice(
  headerSource.indexOf('let cleanupPrevious: (() => void) | null = null;'),
  headerSource.indexOf('</script>', headerSource.indexOf('let cleanupPrevious: (() => void) | null = null;'))
);
const mobileNavLifecycleBlock = headerSource.slice(headerSource.indexOf('// Use astro:page-load'));

test('mobile nav initializes only via astro:page-load, with no separate direct call', () => {
  assert.match(
    mobileNavLifecycleBlock,
    /document\.addEventListener\('astro:page-load', initMobileNav\);/
  );
  // No separate DOMContentLoaded fallback or direct initMobileNav() call — astro:page-load
  // fires on the initial load too, so a separate bootstrap path is not needed.
  assert.doesNotMatch(
    mobileNavLifecycleBlock,
    /document\.addEventListener\('DOMContentLoaded'/
  );
  assert.doesNotMatch(
    mobileNavLifecycleBlock,
    /^\s*initMobileNav\(\);/m,
    'initMobileNav() must not be called directly (only via the astro:page-load listener)'
  );
});

test('mobile nav does not use an initializedMenuButton guard that prevents re-init on navigation', () => {
  assert.doesNotMatch(
    mobileNavScriptBlock,
    /initializedMenuButton === currentMenuButton/,
    'The initializedMenuButton guard must not exist — it prevents re-init when the header is persisted across navigations'
  );
});

test('mobile nav click listeners are cleaned up between page transitions', () => {
  assert.match(
    mobileNavScriptBlock,
    /menuBtn\.addEventListener\('click',[\s\S]*?\}, \{ signal \}\);/
  );
  assert.match(
    mobileNavScriptBlock,
    /sidebarToggle\?\.addEventListener\('click',[\s\S]*?\}, \{ signal \}\);/
  );
  assert.match(
    mobileNavScriptBlock,
    /tocToggle\?\.addEventListener\('click',[\s\S]*?\}, \{ signal \}\);/
  );
  assert.match(
    mobileNavScriptBlock,
    /tocPanel\?\.addEventListener\('click',[\s\S]*?\}, \{ signal \}\);/
  );
});
