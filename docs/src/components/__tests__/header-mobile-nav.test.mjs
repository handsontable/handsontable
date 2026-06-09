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
const mobileNavLifecycleBlock = headerSource.slice(headerSource.indexOf('// Run after the initial load'));

test('mobile nav initializes from astro:page-load and full page load fallback', () => {
  assert.match(
    mobileNavLifecycleBlock,
    /document\.addEventListener\('astro:page-load', initMobileNav\);/
  );
  assert.match(
    mobileNavLifecycleBlock,
    /document\.addEventListener\('DOMContentLoaded', initMobileNav, \{ once: true \}\);/
  );
  assert.match(mobileNavLifecycleBlock, /initMobileNav\(\);/);
});

test('mobile nav skips duplicate initialization for the same menu button', () => {
  assert.match(
    mobileNavScriptBlock,
    /let initializedMenuButton: HTMLButtonElement \| null = null;/
  );
  assert.match(
    mobileNavScriptBlock,
    /initializedMenuButton === currentMenuButton/
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
