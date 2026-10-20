# nl-view B: tools

Throwaway proof of concept. This branch will never be merged.

Type a request. A tool-calling loop reads columns and real cell values, builds a pending view, checks it with `validateViewState`, and applies it once with `setViewState({ atomic: true, undo: 'record' })`. One undo reverts one prompt.

The model is `gpt-5.6-luna` through the sandbox proxy. The page reads the proxy token from the URL hash `#t=<token>` (stored in `localStorage` as `nl-view-token`, then removed from the hash) and never from the repo. Smoke reads `NL_VIEW_TOKEN`.

`gpt-5.6-luna` can return `reasoning_items` with `encrypted_content` on tool turns. The client passes those fields back on the next assistant message. It strips them only if the proxy answers HTTP 400 and the body mentions reasoning, then retries once.

## Run

```bash
npm --prefix handsontable run build:umd.min
node poc/nl-view/tools/build.mjs
# serve poc/nl-view/tools/dist
```

`?dataset=orders` or `?dataset=tickets`. `?variant=fast` is B2: the column schema, current view, and today are in the system prompt, `get_columns` is not offered, and a turn that only mutates counts as finish. The default (no `variant`) keeps the original loop. Eval entry is the same either way: `window.nlView.loadData(name, rows)`, `reset()`, `translate(prompt, { today })`.

```bash
NL_VIEW_TOKEN=... NODE_PATH=tests/node_modules node poc/nl-view/tools/smoke.mjs
```
