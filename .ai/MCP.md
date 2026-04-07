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

The bearer token is **not** stored in `.mcp.json`. Store it as a secret:

```bash
# Store the token once (saved in Claude Code's local secrets store)
claude secrets set CLICKUP_API_TOKEN pk_your_token_here
```

The `.mcp.json` file references the secret via `${CLICKUP_API_TOKEN}`. Claude Code expands secrets at startup.

If you prefer OAuth instead of a bearer token, remove the `headers` block from `.mcp.json`. Claude Code will prompt for OAuth on first use.

### Cursor setup

Project-level MCP servers for Cursor are configured in `.cursor/mcp.json`. This file is committed.

The bearer token is stored as a Cursor secret:

1. Open Cursor Settings > MCP.
2. Find the `clickup` entry and click the lock icon next to `CLICKUP_API_TOKEN`.
3. Enter your ClickUp personal API token.

Alternatively, set the variable in your shell environment (`export CLICKUP_API_TOKEN=pk_...`) and Cursor will pick it up via `${CLICKUP_API_TOKEN}` in `.cursor/mcp.json`.

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
| `401 Unauthorized` errors | Token is wrong or expired; re-run `claude secrets set CLICKUP_API_TOKEN` |
| OAuth prompt keeps appearing | Switch to bearer token auth (set `CLICKUP_API_TOKEN` and add `headers` block) |
| Cursor shows server as disconnected | Check that `CLICKUP_API_TOKEN` is set in Cursor secrets or shell env |

---

## Other MCP servers in this repo

The `.cursor/mcp.json` and `.mcp.json` files also configure:

| Server | Purpose |
|---|---|
| `github` | Read/write GitHub issues, PRs, and checks via `GITHUB_TOKEN` |
| `filesystem_workspace` | Read/write access to the full repo workspace |
| `filesystem_docs` | Read/write access to `./docs/content` only |
