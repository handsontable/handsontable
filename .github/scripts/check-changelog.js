/* eslint-disable no-console, no-restricted-globals */

// Path-aware changelog gate. A PR must add a `.changelogs/*.json` entry when
// it changes shippable source (handsontable/src/** or wrappers/**, tests and
// markdown excluded); docs-, test-, and CI/tooling-only PRs pass
// automatically. `[skip changelog]` in the PR description — outside HTML
// comments — overrides the requirement on a source change; the override is
// logged with the source files it waves through. The decision logic lives in
// lib/changelog-gate.mjs (pure, unit-tested); this wrapper only talks to the
// GitHub API.

const core = require('@actions/core');
const github = require('@actions/github');

const token = process.env.TOKEN;

const { owner, repo } = github.context.repo;
const octokit = github.getOctokit(token);

const run = async() => {
  // The extension is mandatory here: ESM resolution (dynamic import from CJS)
  // does not add `.mjs` the way require() adds `.js`.
  // eslint-disable-next-line import/extensions
  const { evaluateChangelogGate, SKIP_MARKER } = await import('./lib/changelog-gate.mjs');
  const pr = github.context.payload.pull_request;

  if (pr === undefined) {
    return core.setFailed(
      'This script can only run within GitHub Action `pull_request` events.'
    );
  }

  // @actions/github@6 uses octokit.rest.* while older versions exposed octokit.pulls.*.
  const getPull = octokit.rest?.pulls?.get ?? octokit.pulls?.get;
  const listPullFiles = octokit.rest?.pulls?.listFiles ?? octokit.pulls?.listFiles;

  if (!getPull || !listPullFiles) {
    return core.setFailed('Could not resolve Octokit pull request API methods.');
  }

  // Read the LIVE PR body over the API rather than trusting
  // `github.context.payload.pull_request.body`, which is frozen at the event
  // that triggered the run and stays stale across "Re-run failed jobs". Reading
  // it live lets an author add the skip marker to the description and re-run
  // this job to clear the check — no empty commit, and no `edited` trigger
  // re-running the whole pipeline. Falls back to the payload body if the fetch
  // is unavailable.
  let body = pr.body || '';

  try {
    const { data: livePr } = await getPull({ owner, repo, pull_number: pr.number });

    body = livePr.body || '';
  } catch (error) {
    console.log(`Could not fetch the live PR body, falling back to the event payload: ${error.message}`);
  }

  // https://octokit.github.io/rest.js/v18#pagination
  const files = await octokit.paginate(listPullFiles, {
    owner,
    repo,
    pull_number: pr.number
  });

  const { reason, sourceFiles } = evaluateChangelogGate({ body, files });

  switch (reason) {
    case 'entry-added':
      console.log('Found new changelog(s), success!');
      break;
    case 'no-source-change':
      console.log(
        'No shippable source change (handsontable/src/** or wrappers/**) — a changelog entry is not required.'
      );
      break;
    case 'skipped-explicitly':
      console.log(
        `The PR description opts out via \`${SKIP_MARKER}\`. Source files waved through without a changelog entry:`
      );
      sourceFiles.forEach(file => console.log(`  - ${file}`));
      break;
    default:
      console.log('Shippable source changed in this PR:');
      sourceFiles.forEach(file => console.log(`  - ${file}`));
      core.setFailed(
        // eslint-disable-next-line max-len
        `This PR changes shippable source but adds no changelog entry. Create one with \`npm run changelog entry\` (see .changelogs/README.md), or — when a source change genuinely warrants no entry — write \`${SKIP_MARKER}\` in the PR description (outside HTML comments) and re-run this check.`
      );
  }
};

run();
