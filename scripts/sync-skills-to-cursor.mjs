// Syncs .claude/skills/ SKILL.md files to .cursor/rules/ .mdc files.
//
// Reads each SKILL.md, extracts YAML frontmatter (name, description),
// infers Cursor glob patterns from the skill name, and writes a .mdc file.
//
// Usage: node scripts/sync-skills-to-cursor.mjs [--dry-run]

import { readdir, readFile, writeFile, mkdir } from 'node:fs/promises';
import { join, resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');
const SKILLS_DIR = join(ROOT, '.claude', 'skills');
const CURSOR_RULES_DIR = join(ROOT, '.cursor', 'rules');

// Map skill name prefixes to Cursor glob patterns.
// Skills not listed here get alwaysApply: false with no globs (manual activation).
const GLOB_MAP = {
  'handsontable-plugin-dev': ['handsontable/src/plugins/**'],
  'handsontable-editor-dev': ['handsontable/src/editors/**'],
  'handsontable-renderer-dev': ['handsontable/src/renderers/**'],
  'handsontable-validator-dev': ['handsontable/src/validators/**'],
  'handsontable-celltype-dev': ['handsontable/src/cellTypes/**'],
  'handsontable-unit-testing': ['handsontable/src/**/*.unit.js', 'handsontable/test/unit/**'],
  'handsontable-e2e-testing': ['handsontable/src/**/*.spec.js', 'handsontable/test/e2e/**'],
  'walkontable-dev': ['handsontable/src/3rdparty/walkontable/**'],
  'walkontable-testing': ['handsontable/src/3rdparty/walkontable/test/**'],
  'visual-testing': ['visual-tests/**'],
  'react-wrapper-dev': ['wrappers/react-wrapper/**'],
  'vue-wrapper-dev': ['wrappers/vue3/**'],
  'angular-wrapper-dev': ['wrappers/angular-wrapper/**'],
  'writing-docs-pages': ['docs/content/**/*.md'],
  'creating-docs-examples': ['docs/content/**/javascript/**', 'docs/content/**/react/**', 'docs/content/**/angular/**'],
  'creating-visual-test-examples': ['examples/**'],
  'coordinate-systems': ['handsontable/src/translations/**', 'handsontable/src/plugins/**'],
  'i18n-translations': ['handsontable/src/i18n/**'],
  'handsontable-css-dev': ['handsontable/src/styles/**', 'handsontable/src/themes/**'],
  linting: ['handsontable/.eslintrc.js', 'handsontable/.config/plugin/eslint/**', '.eslintrc.js'],
  refactoring: null, // no globs -- too broad
  'pr-creation': null,
  'changelog-creation': ['.changelogs/**'],
  'code-quality-review': null, // review skills: no globs, loaded via BUGBOT.md
  'architecture-review': null,
  'performance-a11y-review': null,
  'node-scripts-dev': ['scripts/**/*.mjs', 'wrappers/*/scripts/**/*.mjs', 'handsontable/scripts/**/*.mjs'],
};

/**
 * Parses YAML frontmatter from a SKILL.md file.
 *
 * @param {string} content The raw file content.
 * @returns {object} Parsed name, description, and body.
 */
function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/);

  if (!match) {
    return { name: '', description: '', body: content };
  }

  const yaml = match[1];
  const body = content.slice(match[0].length).trim();

  const name = yaml.match(/^name:\s*(.+)$/m)?.[1]?.trim() || '';
  const description = yaml.match(/^description:\s*(.+)$/m)?.[1]?.trim() || '';

  return { name, description, body };
}

/**
 * Builds a Cursor .mdc rule file from skill metadata.
 *
 * @param {string} name The skill name.
 * @param {string} description The skill description.
 * @param {string[]|null} globs Glob patterns for file matching.
 * @param {string} body The skill body content.
 * @returns {string} The .mdc file content.
 */
function buildMdc(name, description, globs, body) {
  const lines = ['---'];

  lines.push(`description: ${description}`);

  if (globs && globs.length > 0) {
    lines.push(`globs: ${globs.join(', ')}`);
  }

  lines.push('alwaysApply: false');
  lines.push('---');
  lines.push('');
  lines.push(`# ${name}`);
  lines.push('');
  lines.push(`> Auto-generated from \`.claude/skills/${name}/SKILL.md\`. Do not edit manually.`);
  lines.push('> Run `node scripts/sync-skills-to-cursor.mjs` to regenerate.');
  lines.push('');
  lines.push(body);

  return lines.join('\n');
}

/**
 * Main entry point. Reads skills and generates Cursor rule files.
 */
async function main() {
  const dryRun = process.argv.includes('--dry-run');

  await mkdir(CURSOR_RULES_DIR, { recursive: true });

  // Preserve manually-created cursor rules
  const MANUAL_RULES = new Set(['npm-scripts-usage.mdc', 'writing.mdc']);

  const skillDirs = await readdir(SKILLS_DIR, { withFileTypes: true });
  const generated = [];
  const skipped = [];

  for (const entry of skillDirs) {
    if (!entry.isDirectory()) {
      continue;
    }

    const skillName = entry.name;
    const skillPath = join(SKILLS_DIR, skillName, 'SKILL.md');

    let content;

    try {
      content = await readFile(skillPath, 'utf-8');
    } catch {
      skipped.push(`${skillName}: no SKILL.md found`);
      continue;
    }

    const { name, description, body } = parseFrontmatter(content);

    if (!name) {
      skipped.push(`${skillName}: no name in frontmatter`);
      continue;
    }

    const globs = GLOB_MAP[name] !== undefined ? GLOB_MAP[name] : null;
    const mdcContent = buildMdc(name, description, globs, body);
    const mdcFilename = `${name}.mdc`;

    if (MANUAL_RULES.has(mdcFilename)) {
      skipped.push(`${skillName}: conflicts with manual rule ${mdcFilename}`);
      continue;
    }

    const outPath = join(CURSOR_RULES_DIR, mdcFilename);

    if (dryRun) {
      console.log(`[dry-run] Would write: .cursor/rules/${mdcFilename} (${mdcContent.length} bytes)`);
    } else {
      await writeFile(outPath, mdcContent, 'utf-8');
    }
    generated.push(mdcFilename);
  }

  console.log(`\nGenerated: ${generated.length} rules`);

  if (generated.length > 0) {
    console.log(generated.map(f => `  .cursor/rules/${f}`).join('\n'));
  }

  if (skipped.length > 0) {
    console.log(`\nSkipped: ${skipped.length}`);
    console.log(skipped.map(s => `  ${s}`).join('\n'));
  }

  if (!dryRun) {
    console.log('\nDone. Cursor rules are in sync with Claude skills.');
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
