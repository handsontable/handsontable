# nl-view C — Workers AI worker

Throwaway proof of concept. This worker will not be merged.

`POST /translate` sends the browser's grid schema and prompt to Workers AI (`env.AI`) and returns `{ state, explanation, model, usage }` or `{ not_expressible, reason, model, usage }`. Dollars are computed in the browser from `worker/src/pricing.js`.

`GET /health` needs no token. Every other route except `GET /pricing` and CORS preflight requires the `x-poc-token` header.

## Deploy

From this directory, on a machine that is already logged in to the Cloudflare account `e17e41cc82bda15dfa63960aa172fb87`:

```bash
npm install
npx wrangler kv namespace create poc-nl-view-workersai-kv
```

Replace `REPLACE_ME` in `wrangler.toml` with the `id` that command prints.

```bash
npx wrangler secret put POC_TOKEN
npx wrangler deploy
```

Do not set `LOCAL_AI_STUB` on the deployed worker. That variable exists only for `npm run dev:stub`, which never calls Workers AI and returns 501.

The default demo URL is `https://poc-nl-view-workersai.handsontable-sandbox.workers.dev`.

## Local routing check

`npm run test:local` exercises the handler with an in-process double. It does not call a model. `npm run dev:stub` serves the same routes under Miniflare with `LOCAL_AI_STUB=1` and returns 501 without calling Workers AI.
