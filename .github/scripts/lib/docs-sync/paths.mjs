/**
 * Content-path rules for the docs sync.
 *
 * "Content" is what a documentation reader sees: the Markdown pages, their
 * embedded example sources, and the images guides reference as `/img/...`.
 * Everything else under `docs/` is the site's build tooling and stays out of the
 * sync on purpose: a content change may depend on a tooling change shipped in
 * the same pull request, so a commit is either all content or not synced.
 */

export const CONTENT_PREFIXES = ['docs/content/', 'docs/public/img/'];

// Order matters: an AGENTS.md inside handsontable/ is agent guidance, not shipped
// source, so the agent-docs test runs before the source test.
const AGENT_DOCS = /^(\.claude|\.ai|\.cursor)\/|(^|\/)(AGENTS|CLAUDE)\.md$/;
const SOURCE = /^(handsontable|wrappers|tests|visual-tests|performance-tests|examples)\/|^\.changelogs\/|^CHANGELOG\.md$/;
const TOOLING = /^(docs|\.github|scripts|bin)\/|^(package\.json|pnpm-lock\.yaml|pnpm-workspace\.yaml|\.eslintrc\.js|\.nvmrc|hot\.config\.js|browser-targets\.js)$/;

/**
 * Whether a repository-relative path is documentation content.
 *
 * @param {string} file Repository-relative path.
 * @returns {boolean}
 */
export function isContentPath(file) {
  return CONTENT_PREFIXES.some((prefix) => file.startsWith(prefix));
}

/**
 * Classify what a commit touches besides content.
 *
 * @param {string[]} files Repository-relative paths changed by the commit.
 * @returns {{ contentOnly: boolean, categories: string[], nonContent: string[] }}
 */
export function categorize(files) {
  const nonContent = files.filter((file) => !isContentPath(file));
  const categories = new Set();

  for (const file of nonContent) {
    if (AGENT_DOCS.test(file)) {
      categories.add('agent docs');
    } else if (SOURCE.test(file)) {
      categories.add('source');
    } else if (TOOLING.test(file)) {
      categories.add('tooling');
    } else {
      categories.add('other');
    }
  }

  return {
    contentOnly: nonContent.length === 0,
    categories: [...categories].sort(),
    nonContent,
  };
}
