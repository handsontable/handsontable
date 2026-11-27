import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import { PACKAGE_ROOT } from '../src/manifest.mjs';
import { skipWithoutFile } from './helpers/guide-source.mjs';

const PAGE = join(PACKAGE_ROOT, '..', 'docs', 'content', 'guides', 'upgrade-and-migration', 'migration-codemod',
  'migration-codemod.md');
const NOTICE = /::: warning\n[^\n]*is not on npm yet[^\n]*\n:::/;
const INSTALL_COMMAND = /pnpm dlx "github:handsontable\/handsontable#<branch>&path:\/codemod"/;
// The README leaves the branch to the reader. The page names one, `develop`, so a reader has nothing to fill in.
const PAGE_COMMAND = /pnpm dlx "github:handsontable\/handsontable#(?:develop|<branch>)&path:\/codemod"/;

/**
 * What the guide page owes a package that is not published: while `private` is `true`, a warning that says so and
 * names the command that works from the repository, above the first section. Once `private` is gone, no such warning.
 *
 * @param {{private?: boolean}} manifest The package manifest.
 * @param {string} page The Markdown text of the guide page.
 * @returns {string[]} The problems, none when the page and the package agree.
 */
export function guardProblems(manifest, page) {
  const problems = [];
  const notice = NOTICE.exec(page);

  if (manifest.private === true) {
    if (!notice) {
      problems.push('the package is private, so the page needs the "not on npm yet" warning');
    } else {
      const firstSection = page.indexOf('\n## ');

      if (firstSection !== -1 && notice.index > firstSection) {
        problems.push('the warning stands below the first section, not at the top');
      }

      if (!PAGE_COMMAND.test(notice[0])) {
        problems.push('the warning does not give the command that works from the repository');
      }
    }
  } else if (/not on npm yet/.test(page)) {
    problems.push('the package is not private, so the page must not say it is not on npm yet');
  }

  return problems;
}

describe('the guide page of a package that is not published', () => {
  it('says so while the package is private, and stops saying so when it is not', async(context) => {
    if (skipWithoutFile(context, PAGE, 'the guide page')) {
      return;
    }

    const manifest = JSON.parse(await readFile(join(PACKAGE_ROOT, 'package.json'), 'utf8'));

    assert.deepEqual(guardProblems(manifest, await readFile(PAGE, 'utf8')), []);
  });

  it('uses the command the README gives for running the codemod from the repository', async(context) => {
    if (skipWithoutFile(context, PAGE, 'the guide page')) {
      return;
    }

    const readme = await readFile(join(PACKAGE_ROOT, 'README.md'), 'utf8');

    assert.match(readme, INSTALL_COMMAND);
  });

  it('names the branch to install from and says that only pnpm can, so the reader fills in nothing', async(context) => {
    if (skipWithoutFile(context, PAGE, 'the guide page')) {
      return;
    }

    const notice = NOTICE.exec(await readFile(PAGE, 'utf8'))?.[0] ?? '';

    assert.doesNotMatch(notice, /<branch>/, 'the warning leaves the branch to the reader');
    assert.match(notice, /#develop&path:\/codemod/);
    assert.match(notice, /npm cannot install the package from the repository/);
    assert.match(notice, /`pnpm dlx` is the only way until the package is published/);
  });

  const noticeText = '::: warning\nThe package is not on npm yet. '
    + 'Run `pnpm dlx "github:handsontable/handsontable#<branch>&path:/codemod"`.\n:::\n';
  const withNotice = `---\ntitle: T\n---\n\n${noticeText}\nIntro.\n\n## Section\n`;
  const without = '---\ntitle: T\n---\n\nIntro.\n\n## Section\n';

  it('accepts a private package with the warning and a published one without it', () => {
    assert.deepEqual(guardProblems({ private: true }, withNotice), []);
    assert.deepEqual(guardProblems({}, without), []);
    assert.deepEqual(guardProblems({ private: false }, without), []);
  });

  it('fails a private package whose page has no warning', () => {
    assert.match(guardProblems({ private: true }, without)[0], /needs the "not on npm yet" warning/);
  });

  it('fails a published package whose page still carries the warning', () => {
    assert.match(guardProblems({}, withNotice)[0], /must not say it is not on npm yet/);
  });

  it('accepts the warning on a page that has no level-2 heading, and still wants it above any heading', () => {
    const flat = `---\ntitle: T\n---\n\n${noticeText}\nIntro.\n\n### Detail\n`;
    const flatBelow = `---\ntitle: T\n---\n\nIntro.\n\n${noticeText}`;

    assert.deepEqual(guardProblems({ private: true }, flat), []);
    assert.deepEqual(guardProblems({ private: true }, flatBelow), [], 'with no section, nothing stands below one');
  });

  it('fails a warning that stands below the first section, or that gives no command', () => {
    const below = `---\ntitle: T\n---\n\nIntro.\n\n## Section\n\n${noticeText}`;
    const noCommand = '---\ntitle: T\n---\n\n::: warning\nThe package is not on npm yet.\n:::\n\n## Section\n';

    assert.match(guardProblems({ private: true }, below)[0], /below the first section/);
    assert.match(guardProblems({ private: true }, noCommand)[0], /does not give the command/);
  });
});
