/**
 * Classification inputs and outputs for the docs sync.
 *
 * The model answers one question per candidate: does this content change apply
 * to the released version? Everything here is pure so the prompt assembly and
 * the response parsing are unit-tested; the network call lives in `llm.mjs`.
 */
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { compareMinor, parseVersion } from './target.mjs';

export const DECISIONS = ['include', 'exclude', 'unsure'];

const PROMPT_PATH = path.join(path.dirname(fileURLToPath(import.meta.url)), 'prompt.md');
const CHANGELOG_SECTION = /^## \[(\d+\.\d+\.\d+)\]/m;

/**
 * Read the system prompt from disk.
 *
 * @returns {Promise<string>}
 */
export async function loadPrompt() {
  return readFile(PROMPT_PATH, 'utf8');
}

/**
 * A short, stable identifier for a prompt text. Part of every cache key, so a
 * prompt edit invalidates cached decisions.
 *
 * @param {string} text The prompt.
 * @returns {string} Twelve hex characters.
 */
export function promptHash(text) {
  return createHash('sha256').update(text).digest('hex').slice(0, 12);
}

/**
 * The cache key under which a decision is stored.
 *
 * @param {string} sha Candidate commit sha.
 * @param {string} hash From `promptHash`.
 * @returns {string}
 */
export function cacheKey(sha, hash) {
  return `${sha}:${hash}`;
}

/**
 * What is new on `develop` and absent from the target: every pending changelog
 * entry, plus every released `CHANGELOG.md` section above the target version.
 *
 * @param {object} input
 * @param {object[]} input.pendingEntries Parsed `.changelogs/*.json` files from `develop`.
 * @param {string} input.changelogMarkdown `CHANGELOG.md` from `develop`.
 * @param {{ major: number, minor: number }} input.released The target's version.
 * @returns {string} Markdown for the prompt.
 */
export function collectUnreleased({ pendingEntries, changelogMarkdown, released }) {
  const lines = pendingEntries.map((entry) => `- [${entry.type}] ${entry.title} (#${entry.issueOrPR})`);
  const sections = changelogMarkdown.split(/^(?=## \[)/m);

  for (const section of sections) {
    const match = CHANGELOG_SECTION.exec(section);

    if (match && compareMinor(parseVersion(match[1]), released) > 0) {
      lines.push(section.trim());
    }
  }

  return lines.length > 0 ? lines.join('\n') : 'Nothing is pending: develop and the target document the same feature set.';
}

/**
 * Escape untrusted text before it enters the model's user turn, inside one
 * of the named spans `prompt.md` tells the model to treat as data, not
 * instructions. Escaping `<` keeps a literal closing tag (e.g.
 * `</pull-request-body>`) from prematurely ending its own span -- the same
 * single-character-escape reasoning `pr-body.mjs`'s `plain()` uses for the
 * HTML case.
 *
 * @param {string} text
 * @returns {string}
 */
function escapeUntrusted(text) {
  return text.replaceAll('<', '&lt;');
}

/**
 * Cut a string and say how much was cut.
 *
 * @param {string} text
 * @param {number} max
 * @returns {string}
 */
function truncate(text, max) {
  if (text.length <= max) {
    return text;
  }

  return `${text.slice(0, max)}\n[truncated: ${text.length - max} more characters]`;
}

/**
 * The user turn: one candidate, fully described.
 *
 * @param {object} input
 * @param {{ number: number, title: string, body: string }} input.pr
 * @param {string[]} input.files
 * @param {string} input.diff Unified diff of the content files.
 * @param {string} input.releasedVersion e.g. `18.1.0`.
 * @param {string} input.target e.g. `prod-docs/18.1`.
 * @param {string} input.unreleased From `collectUnreleased`.
 * @param {{ maxBody?: number, maxDiff?: number }} [limits]
 * @returns {string}
 */
export function buildUserMessage(input, { maxBody = 4096, maxDiff = 61440 } = {}) {
  const { pr, files, diff, releasedVersion, target, unreleased } = input;

  return [
    '# Target',
    `Branch: ${target}`,
    `Released version: ${releasedVersion}`,
    '',
    '# Pull request',
    `#${pr.number}`,
    '<pull-request-title>',
    escapeUntrusted(pr.title),
    '</pull-request-title>',
    '',
    '<pull-request-body>',
    truncate(escapeUntrusted(pr.body ?? ''), maxBody),
    '</pull-request-body>',
    '',
    '# Changed files',
    '<changed-files>',
    ...files.map((file) => `- ${escapeUntrusted(file)}`),
    '</changed-files>',
    '',
    '# New on develop and absent from the target',
    '<unreleased>',
    escapeUntrusted(unreleased),
    '</unreleased>',
    '',
    '# Diff',
    '```diff',
    truncate(diff, maxDiff),
    '```',
  ].join('\n');
}

/**
 * Parse the model's answer. Anything that is not a well-formed decision is
 * `unsure`, never a guess in either direction.
 *
 * @param {string} text Raw model output.
 * @returns {{ decision: string, reason: string }}
 */
export function parseDecision(text) {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');

  if (start === -1 || end === -1 || end < start) {
    return { decision: 'unsure', reason: `Unparseable model response: ${text.slice(0, 120)}` };
  }

  try {
    const parsed = JSON.parse(text.slice(start, end + 1));

    if (DECISIONS.includes(parsed.decision) && typeof parsed.reason === 'string' && parsed.reason.length > 0) {
      return { decision: parsed.decision, reason: parsed.reason };
    }

    return { decision: 'unsure', reason: `Model response lacked a valid decision or reason: ${text.slice(0, 120)}` };
  } catch (error) {
    return { decision: 'unsure', reason: `Model response was not JSON (${error.message}): ${text.slice(0, 120)}` };
  }
}
