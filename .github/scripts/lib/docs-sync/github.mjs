/**
 * The `gh` calls the docs sync makes, behind one injectable runner.
 *
 * `gh` rather than raw `fetch` against the REST API: it already handles
 * authentication from `GH_TOKEN`, pagination, and the pull request subcommands,
 * and it is present on every GitHub-hosted runner and on developer machines that
 * run the dry-run locally.
 */
import { execFileSync } from 'node:child_process';

const LABEL_COLOR = '0E8A16';
const LABEL_DESCRIPTION = 'Managed by the docs sync workflow';

/**
 * Run `gh` and return its stdout.
 *
 * @param {string[]} args
 * @returns {string}
 */
function defaultRun(args) {
  return execFileSync('gh', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
}

/**
 * Build the adapter for one repository.
 *
 * @param {object} options
 * @param {string} options.repo `owner/name`.
 * @param {(args: string[]) => string} [options.run]
 * @returns {object}
 */
export function createGitHub({ repo, run = defaultRun }) {
  return {
    /**
     * @param {number} number
     * @returns {{ number: number, title: string, body: string, labels: string[], author: string }}
     */
    getPullRequest(number) {
      const pr = JSON.parse(run(['api', `repos/${repo}/pulls/${number}`]));

      return {
        number: pr.number,
        title: pr.title ?? '',
        body: pr.body ?? '',
        labels: (pr.labels ?? []).map((label) => label.name),
        author: pr.user?.login ?? '',
      };
    },

    /**
     * @param {string} head
     * @param {string} base
     * @returns {{ number: number, url: string }|null}
     */
    findOpenPr(head, base) {
      const list = JSON.parse(run(['pr', 'list', '--repo', repo, '--state', 'open', '--head', head, '--base', base, '--json', 'number,url']));

      return list[0] ?? null;
    },

    /**
     * @param {string} label
     * @returns {Array<{ number: number, baseRefName: string, headRefName: string, url: string }>}
     */
    listOpenPrsWithLabel(label) {
      return JSON.parse(run(['pr', 'list', '--repo', repo, '--state', 'open', '--label', label, '--json', 'number,baseRefName,headRefName,url']));
    },

    /**
     * @param {string[]} names
     */
    ensureLabels(names) {
      let existingLabels;

      try {
        existingLabels = JSON.parse(run(['label', 'list', '--repo', repo, '--json', 'name', '--limit', '100']));
      } catch {
        // An empty or unparseable response is treated as "nothing known", the
        // same way `extractState` treats a bad state block: it falls back to
        // creating every label rather than throwing, never a fatal error.
        existingLabels = [];
      }

      const existing = new Set(existingLabels.map((label) => label.name));

      for (const name of names) {
        if (!existing.has(name)) {
          run(['label', 'create', name, '--repo', repo, '--color', LABEL_COLOR, '--description', LABEL_DESCRIPTION]);
        }
      }
    },

    /**
     * @param {{ head: string, base: string, title: string, body: string, labels: string[], reviewers: string[] }} input
     * @returns {string} The pull request URL.
     */
    createPr({ head, base, title, body, labels, reviewers }) {
      const args = ['pr', 'create', '--repo', repo, '--head', head, '--base', base, '--title', title, '--body', body];

      for (const label of labels) {
        args.push('--label', label);
      }
      if (reviewers.length > 0) {
        args.push('--reviewer', reviewers.join(','));
      }

      return run(args);
    },

    /**
     * @param {number} number
     * @param {{ title: string, body: string }} fields
     */
    updatePr(number, { title, body }) {
      run(['pr', 'edit', String(number), '--repo', repo, '--title', title, '--body', body]);
    },

    /**
     * @param {number} number
     * @param {string} comment
     */
    closePr(number, comment) {
      run(['pr', 'close', String(number), '--repo', repo, '--comment', comment]);
    },

    /**
     * Post or replace the one comment that starts with `marker`.
     *
     * @param {number} number
     * @param {string} marker An HTML comment that identifies the sticky comment.
     * @param {string} body
     */
    upsertComment(number, marker, body) {
      // `--slurp` wraps all paginated pages into one outer array, so we flatten it to get a single list.
      const comments = JSON.parse(run(['api', `repos/${repo}/issues/${number}/comments`, '--paginate', '--slurp'])).flat();
      const existing = comments.find((comment) => (comment.body ?? '').startsWith(marker));
      const text = `${marker}\n${body}`;

      if (existing) {
        run(['api', '--method', 'PATCH', `repos/${repo}/issues/comments/${existing.id}`, '-f', `body=${text}`]);
      } else {
        run(['api', '--method', 'POST', `repos/${repo}/issues/${number}/comments`, '-f', `body=${text}`]);
      }
    },
  };
}
