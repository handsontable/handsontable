/**
 * Pins that the repository configures no GitHub MCP server and that Claude Code denies one.
 *
 * The `github` entry used to start `@modelcontextprotocol/server-github` through an unpinned `npx -y`. That
 * package is archived on npm as unmaintained, with no security guarantees. GitHub operations go through the
 * `gh` CLI instead. The deny rule in `.claude/settings.json` also blocks a user-level MCP server named
 * `github`. It matches the server name only, so a server under another name is not covered.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { repoRoot } from '../../.github/scripts/lib/repo-root.mjs';

const ROOT = repoRoot();
const MCP_CONFIGS = ['.mcp.json', '.cursor/mcp.json'];

/**
 * Reads and parses a JSON file relative to the repository root.
 *
 * @param {string} relativePath The path relative to the repository root.
 * @returns {object} The parsed JSON.
 */
function readJson(relativePath) {
  return JSON.parse(readFileSync(path.join(ROOT, relativePath), 'utf8'));
}

for (const configPath of MCP_CONFIGS) {
  test(`${configPath} configures no GitHub MCP server`, () => {
    const servers = readJson(configPath).mcpServers;

    assert.ok(servers && typeof servers === 'object' && Object.keys(servers).length > 0,
      `${configPath} must list its servers under "mcpServers"`);
    assert.ok(!Object.hasOwn(servers, 'github'), `${configPath} must not define a "github" server; use the gh CLI`);

    for (const [name, server] of Object.entries(servers)) {
      const launch = [server.command, ...(server.args ?? []), server.url].filter(Boolean).join(' ');
      const secrets = [...Object.keys(server.env ?? {}), ...Object.values(server.headers ?? {})].join(' ');

      assert.doesNotMatch(launch, /server-github|github-mcp-server|api\.githubcopilot\.com\/mcp/i,
        `${configPath} server "${name}" launches a GitHub MCP server; use the gh CLI`);
      assert.doesNotMatch(secrets, /GITHUB_(PERSONAL_ACCESS_)?TOKEN/i,
        `${configPath} server "${name}" takes a GitHub token; use the gh CLI`);
    }
  });
}

test('.claude/settings.json denies every tool of a "github" MCP server', () => {
  const deny = readJson('.claude/settings.json').permissions?.deny ?? [];

  assert.ok(deny.includes('mcp__github'), '.claude/settings.json permissions.deny must contain "mcp__github"');
});
