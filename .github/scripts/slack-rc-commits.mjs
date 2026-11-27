import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const MAX_SECTION_TEXT = 3000;

/**
 * Escapes the three characters Slack mrkdwn reserves for links and mentions.
 *
 * @param {string} text Plain text.
 * @returns {string}
 */
export function escapeMrkdwn(text) {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/**
 * Builds the "Commits since" section text of the RC Slack message. Slack rejects a section
 * text over 3000 characters, so the list stops at the last commit that fits and ends with
 * a count of the rest and a link to the compare view.
 *
 * @param {object} options The section input.
 * @param {string} options.prevTag The previous RC tag.
 * @param {Array<{sha: string, subject: string}>|null} options.commits The commits, newest
 * first, or `null` when the previous tag does not exist.
 * @param {string} options.repoUrl The repository URL.
 * @param {string} options.compareUrl The compare view from `prevTag` to the released commit.
 * @returns {string}
 */
export function buildCommitsSection({ prevTag, commits, repoUrl, compareUrl }) {
  const heading = `*Commits since \`${prevTag}\`*\n`;

  if (!commits || commits.length === 0) {
    return `${heading}No commits found since \`${prevTag}\`.`;
  }

  const lines = commits.map(({ sha, subject }) => `• <${repoUrl}/commit/${sha}|${escapeMrkdwn(subject)}>`);
  const more = count => `\n…and ${count} more: <${compareUrl}|see all changes>`;
  let shown = lines.length;
  let text = heading + lines.join('\n');

  while (text.length > MAX_SECTION_TEXT && shown > 0) {
    shown -= 1;
    text = heading + lines.slice(0, shown).join('\n') + more(lines.length - shown);
  }

  return text;
}

/**
 * Lists the commits of the release branch between two refs, newest first. `--first-parent`
 * keeps a merge of another branch (for example master) as one line, instead of listing every
 * commit that merge brings in.
 *
 * @param {string} from The older ref.
 * @param {string} to The newer ref.
 * @returns {Array<{sha: string, subject: string}>}
 */
export function listCommits(from, to) {
  const output = execFileSync('git', ['log', `${from}..${to}`, '--first-parent', '--pretty=format:%H %s'], {
    encoding: 'utf8',
  });

  return output.split('\n').filter(Boolean).map((line) => {
    const space = line.indexOf(' ');

    return { sha: line.slice(0, space), subject: line.slice(space + 1) };
  });
}

/**
 * Tells whether a ref exists in the local repository.
 *
 * @param {string} ref The ref to check.
 * @returns {boolean}
 */
function refExists(ref) {
  try {
    execFileSync('git', ['rev-parse', '--verify', '--quiet', `${ref}^{commit}`], { stdio: 'ignore' });

    return true;
  } catch {
    return false;
  }
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isMain) {
  const [prevTag, head, repoUrl] = process.argv.slice(2);

  if (!prevTag || !head || !repoUrl) {
    process.stderr.write('Usage: node slack-rc-commits.mjs <prev-tag> <head-ref> <repo-url>\n');
    process.exitCode = 1;
  } else {
    const headSha = execFileSync('git', ['rev-parse', head], { encoding: 'utf8' }).trim();

    process.stdout.write(buildCommitsSection({
      prevTag,
      commits: refExists(prevTag) ? listCommits(prevTag, headSha) : null,
      repoUrl,
      compareUrl: `${repoUrl}/compare/${prevTag}...${headSha}`,
    }));
  }
}
