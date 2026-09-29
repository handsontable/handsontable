// Advisory breaking-change check (DEV-3030). Flags a diff that removes or
// renames a public name, or changes a `metaSchema` option default, and can post
// one PR comment. Never blocks: exits 0 whatever it finds.
//
// Usage:
//   node .github/scripts/breaking-check.mjs                       # HEAD vs merge-base with origin/develop
//   node .github/scripts/breaking-check.mjs --base <ref> --head <ref> [--no-merge-base]
//   node .github/scripts/breaking-check.mjs --commit <sha>        # one commit
//   node .github/scripts/breaking-check.mjs --merge-parent        # CI: HEAD^1..HEAD on a merge commit
// Output:  --json | --render | --out <file> | --from-json <file>
// Options: --no-jev (code-only), --comment <pr-number> (post, edit, or leave alone),
//          --cwd <dir> (the git checkout to read; default: this repository)
// Env:     LITELLM_BASE_URL, LITELLM_API_KEY (Jev), GITHUB_REPOSITORY and GH_TOKEN (--comment)

import { execFileSync } from 'node:child_process';
import { appendFile, readFile, writeFile } from 'node:fs/promises';
import { MARKER, renderCleared, renderComment, shouldComment } from './lib/breaking-check/comment.mjs';
import { parseCli, resolveRange, summarize } from './lib/breaking-check/cli.mjs';
import { splitDiffByFile } from './lib/breaking-check/chunk.mjs';
import { detect } from './lib/breaking-check/detect.mjs';
import { createJevClient } from './lib/breaking-check/jev.mjs';
import { createGitHub } from './lib/docs-sync/github.mjs';
import { repoRoot } from './lib/repo-root.mjs';

const BOT_LOGIN = 'github-actions[bot]';

const options = parseCli(process.argv.slice(2));
const git = (args) => execFileSync('git', args, {
  cwd: options.cwd ?? repoRoot(),
  encoding: 'utf8',
  maxBuffer: 1 << 30,
  stdio: ['ignore', 'pipe', 'pipe'],
});

let result;

if (options.fromJson) {
  result = JSON.parse(await readFile(options.fromJson, 'utf8'));
} else {
  const { diffArgs, ref, warning } = resolveRange(options, git);

  if (warning) {
    console.warn(`::warning::${warning}`);
  }

  const allFiles = diffArgs ? splitDiffByFile(git(diffArgs)) : [];
  const { LITELLM_BASE_URL: baseUrl, LITELLM_API_KEY: apiKey } = process.env;
  const jevClient = !options.noJev && baseUrl && apiKey ? createJevClient({ baseUrl, apiKey }) : null;

  result = await detect({ allFiles, git, ref, jevClient });
}

if (options.out) {
  await writeFile(options.out, `${JSON.stringify(result, null, 2)}\n`);
}

if (options.json) {
  console.log(JSON.stringify(result, null, 2));
} else if (options.render) {
  console.log(shouldComment(result)
    ? `${MARKER}\n${renderComment(result)}`
    : `No comment would be posted (flagged: ${result.flagged}, changelog entry marked breaking: ${result.declared.breakingEntry}).`);
} else {
  console.log(summarize(result));
}

if (process.env.GITHUB_STEP_SUMMARY && !options.fromJson) {
  await appendFile(process.env.GITHUB_STEP_SUMMARY, `### Breaking-change check (advisory)\n\n\`\`\`\n${summarize(result)}\n\`\`\`\n`);
}

if (options.comment !== undefined) {
  const gh = createGitHub({ repo: process.env.GITHUB_REPOSITORY });
  // Only the Actions bot's own comment is ours to edit: anyone can paste the marker into a comment.
  const own = { author: BOT_LOGIN };

  if (shouldComment(result)) {
    gh.upsertComment(options.comment, MARKER, renderComment(result), own);
    console.log(`Posted or updated the advisory comment on #${options.comment}.`);
  } else if (gh.editComment(options.comment, MARKER, renderCleared(result), own)) {
    console.log(`Marked the advisory comment on #${options.comment} as cleared.`);
  }
}
