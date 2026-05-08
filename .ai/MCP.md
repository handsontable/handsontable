# MCP (Model Context Protocol) Setup

This document describes how to configure MCP servers for AI assistants working in this repository.

## ClickUp MCP

ClickUp provides an official MCP server that lets AI assistants (Claude Code, Cursor, etc.) read and update ClickUp tasks directly. This is required for the [ClickUp task integration workflow](../AGENTS.md#clickup-task-integration) described in AGENTS.md.

### Authentication

ClickUp's MCP server supports two authentication methods:

1. **OAuth 2.1 with PKCE** -- Triggered interactively on first use. No configuration needed beyond adding the server URL.
2. **Personal API Token (bearer token)** -- A static token generated in ClickUp settings. Recommended for CI and shared team setups.

To get a personal API token: ClickUp Settings > Apps > API Token > Generate.

### Claude Code setup

Project-level MCP servers are configured in `.mcp.json` at the repo root. This file is committed and shared with the team.

The bearer token is **not** stored in `.mcp.json`. Set it as a shell environment variable before starting Claude Code:

```bash
# Add to your shell profile (~/.zshrc, ~/.bashrc, etc.) so it persists
export CLICKUP_API_TOKEN=pk_your_token_here
```

The `.mcp.json` file references the variable via `${CLICKUP_API_TOKEN}`. Claude Code expands environment variables at startup.

If you prefer OAuth instead of a bearer token, remove the `headers` block from `.mcp.json`. Claude Code will prompt for OAuth on first use.

### Cursor setup

Project-level MCP servers for Cursor are configured in `.cursor/mcp.json`. This file is committed.

ClickUp is configured as an **HTTP** MCP server (`url` + `headers`). Cursor resolves secrets in `headers` using **`${env:VARIABLE_NAME}`** syntax where needed (see [Cursor MCP docs](https://cursor.com/docs/context/mcp) — Config interpolation).

The committed `.cursor/mcp.json` sets **`x-workspace-id`** to the shared team workspace (numeric ID, fixed in the file). You only need a **`CLICKUP_API_TOKEN`** in your environment for the `Authorization` header.

Set it in the environment Cursor inherits (shell profile, or your OS user environment), then restart Cursor:

```bash
export CLICKUP_API_TOKEN=pk_your_token_here
```

### Verifying the setup

In Claude Code, run `/mcp` to list active servers and confirm `clickup` appears with status `connected`.

In Cursor, open the MCP panel (Cursor Settings > MCP) and verify the `clickup` server shows a green connected state.

### Available ClickUp MCP tools

Once connected, the following tools are available to AI assistants:

| Tool | Description |
|---|---|
| `get_task` | Fetch task details by ID (title, description, status, assignees) |
| `update_task` | Update task fields (status, description, custom fields) |
| `create_task` | Create a new task in a list |
| `get_tasks` | List tasks in a space/folder/list |
| `get_space` | Fetch space details |
| `create_comment` | Add a comment to a task |

### Troubleshooting

| Symptom | Fix |
|---|---|
| `clickup` server not listed in `/mcp` | Run `claude mcp list` to check config; verify `.mcp.json` exists at repo root |
| `401 Unauthorized` errors | Token is wrong or expired; update `CLICKUP_API_TOKEN` in your shell profile and restart Claude Code |
| OAuth prompt keeps appearing | Switch to bearer token auth: set `CLICKUP_API_TOKEN` and restore the `headers` block in `.cursor/mcp.json` |
| Cursor shows server as disconnected | Set `CLICKUP_API_TOKEN`; restart Cursor so `${env:CLICKUP_API_TOKEN}` resolves |
| Wrong space or "not found" from ClickUp tools | Token may be for another workspace, or `x-workspace-id` in `.cursor/mcp.json` does not match the workspace you use. Adjust `x-workspace-id` locally if needed (see Cursor setup above) |

---

## code-review-graph MCP

A Tree-sitter knowledge graph over the full codebase (28k+ nodes, 419k+ edges). Used by AI agents for cross-file structural queries -- finding all callers of a function, tracing imports, and getting blast-radius counts without reading individual files. See the `MCP Tools: code-review-graph` section in `AGENTS.md` for when to use it vs. plain grep.

### Prerequisites

- `pipx` (Python equivalent of `npx`). Standard on most Python developer machines. Install:
  - macOS: `brew install pipx && pipx ensurepath`
  - Linux: `python3 -m pip install --user pipx && pipx ensurepath`

No manual `code-review-graph` install is required. The `.mcp.json` configuration invokes it via `pipx run code-review-graph==2.3.2 serve`, which fetches and caches the package on first use (~10s one-time download, instant on subsequent starts).

### Verifying the setup

Run `/mcp` in Claude Code and confirm `code-review-graph` appears with status `connected`. On first session the startup is slower while pipx downloads the package.

### Rebuild after switching branches

The graph is built against a specific git commit. After switching branches, rebuild so tools like `detect_changes` don't report function names from unrelated files:

```bash
pipx run code-review-graph==2.3.2 build
```

The `PostToolUse` hook in `.claude/settings.json` runs `pipx run code-review-graph==2.3.2 update --skip-flows` after each `Edit` or `Write` to keep the graph in sync during a session. The `--skip-flows` flag skips execution-flow re-analysis for speed -- flows are only re-indexed on a full `build`. A rebuild is only needed after `git checkout`, `git pull`, or large merges.

The hooks are guarded with `command -v pipx >/dev/null 2>&1 && ... || true` so machines without `pipx` installed (or air-gapped sessions where PyPI is unreachable) do not error on every session start or file edit.

### Troubleshooting

| Symptom | Fix |
|---|---|
| `code-review-graph` not listed in `/mcp` | Check `pipx --version` is installed; run `pipx run code-review-graph==2.3.2 --version` manually to confirm |
| First session is slow (~10s hang at start) | Expected -- pipx is downloading the package. Subsequent sessions use the cached venv |
| `detect_changes` reports wrong function names | Graph is stale on the wrong branch. Run `pipx run code-review-graph==2.3.2 build` |
| `tests_for` returns 0 for files with known tests | Known limitation -- use grep for `.spec.js` / `.unit.js` files instead |
| `get_architecture_overview` fails with token-limit error | Do not call this tool -- it produces 3.9M characters. Use `list_communities` + `get_community` for specific areas |

### Do not re-run `code-review-graph install`

The `install` subcommand would re-append boilerplate instructions to `CLAUDE.md` / `AGENTS.md` that have been hand-corrected for accuracy, and may overwrite fixes in `.claude/skills/` and `.claude/settings.json`. The MCP server is already configured in `.mcp.json`; nothing else needs to run.

---

## Other MCP servers in this repo

The `.cursor/mcp.json` and `.mcp.json` files also configure:

| Server | Purpose |
|---|---|
| `github` | Read/write GitHub issues, PRs, and checks via `GITHUB_PERSONAL_ACCESS_TOKEN` (the package reads this env var — `GITHUB_TOKEN` is silently ignored) |
| `filesystem_workspace` | Read/write access to the full repo workspace |
| `filesystem_docs` | Read/write access to `./docs/content` only |
| `code-review-graph` | Knowledge graph over the codebase (see above) |

### Cursor secret interpolation

All secrets in `.cursor/mcp.json` must use `${env:VARIABLE_NAME}` syntax — not shell-style `${VARIABLE_NAME}`. This applies to both HTTP server `headers` (e.g., ClickUp's `Authorization` header) and `command`-type server `env` blocks (e.g., the GitHub token). Without the `env:` prefix, Cursor treats the value as a literal string and the secret is never resolved.
