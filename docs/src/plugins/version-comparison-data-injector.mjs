import { loadVersionHighlights } from './version-highlights-loader.mjs';

const SCRIPT_TAG_PATTERN = /<script type="application\/json" id="version-comparison-data">[\s\S]*?<\/script>/;
const PAGE_PATH_FRAGMENT = '/version-comparison/version-comparison.md';

export function versionComparisonDataInjector() {
  return {
    name: 'version-comparison-data-injector',
    enforce: 'pre',
    transform(code, id) {
      if (!id.endsWith('.md')) return null;
      if (!id.includes(PAGE_PATH_FRAGMENT)) return null;
      if (!SCRIPT_TAG_PATTERN.test(code)) return null;

      const data = loadVersionHighlights();
      const json = JSON.stringify(data).replace(/</g, '\\u003c');
      const replacement = `<script type="application/json" id="version-comparison-data">${json}</script>`;
      return { code: code.replace(SCRIPT_TAG_PATTERN, replacement), map: null };
    },
  };
}
