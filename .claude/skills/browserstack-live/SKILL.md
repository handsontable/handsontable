---
name: browserstack-live
description: Use when testing a local or public URL on a real device via BrowserStack, opening a live browser session on Android, iOS, or desktop browsers, or when the user mentions BrowserStack, real device testing, mobile testing, cross-browser testing, touch testing, or wants to verify behavior on a specific phone, tablet, or browser version. Also trigger when the user says "test this on Android/iPhone/Safari/Chrome mobile", asks to open a live session, or mentions demo-mobile.html, even if they don't mention BrowserStack by name.
---

# BrowserStack Live Session

Open a live browser session on a real device (phone, tablet, or desktop) using BrowserStack. Because BrowserStack devices cannot reach `localhost`, this skill tunnels the local dev server through Cloudflare to produce a temporary public URL.

```
Local server  -->  Cloudflare tunnel  -->  BrowserStack Live
(any port)        (public trycloudflare.com URL)   (real device)
```

## Step 1 — Prepare something to test

### Option A: Handsontable demo page

If the user wants to test Handsontable behavior (bug fix, feature, plugin, editor, etc.), use the **demo-page** skill to generate `handsontable/dev-generated.html`. That skill builds a two-tab HTML page (Released vs PR Build) with test-specific config and reproduction steps.

After the demo page is generated, serve it:

```bash
python3 -m http.server 8767 --directory handsontable &
```

Verify it works:

```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:8767/dev-generated.html
```

The tunnel URL path will be `/dev-generated.html`.

### Option B: Existing local server

If the user wants to test the docs site, a recipe page, or any other already-running server, just confirm reachability:

```bash
curl -s -o /dev/null -w "%{http_code}" <URL>
```

Common servers in this repo:

| Server | Start command | Default port |
|--------|--------------|-------------|
| Docs (Astro) | `npm run dev --prefix docs` | 4321 |
| Handsontable static files | `python3 -m http.server 8767 --directory handsontable` | 8767 |

For Vite-based dev servers (like Astro docs), tunnel hostnames get blocked by default. If the tunnel URL returns a "Blocked request" error, add this to the Vite config (inside `astro.config.mjs`):

```js
vite: {
  server: {
    allowedHosts: ['.trycloudflare.com'],
  },
}
```

Then restart the dev server. Check whether it is already configured before modifying the file.

### Option C: Public URL

If the user provides a public URL (e.g., a staging deployment), skip straight to Step 2. No tunnel is needed — pass the URL directly to BrowserStack in Step 3.

## Step 2 — Start the Cloudflare tunnel

BrowserStack cannot access `localhost`. A Cloudflare quick tunnel creates an ephemeral public URL that proxies to the local server. No Cloudflare account is needed — the tunnel is ephemeral and disappears when the process exits.

Capture output to a log file (the tunnel URL is printed to stderr):

```bash
npx cloudflared tunnel --url http://localhost:<PORT> > /tmp/cloudflare-tunnel.log 2>&1 &
echo "Tunnel PID: $!"
```

Wait for the tunnel to initialize (~10 seconds), then extract the URL:

```bash
sleep 10
grep -o 'https://[a-z0-9-]*\.trycloudflare\.com' /tmp/cloudflare-tunnel.log | head -1
```

The URL looks like `https://some-random-words.trycloudflare.com`.

### Troubleshooting

- If no URL appears after 10 seconds, wait a few more and re-check: `cat /tmp/cloudflare-tunnel.log`.
- If the tunnel fails to start, check for port conflicts or kill stale tunnel processes.
- The URL changes every time the tunnel restarts.

## Step 3 — Launch the BrowserStack session

Use the `mcp__browserstack__runBrowserLiveSession` MCP tool. The tool returns a clickable BrowserStack dashboard URL — share it with the user.

### Mobile devices

```
mcp__browserstack__runBrowserLiveSession({
  platformType: "mobile",
  desiredURL: "<tunnel-url>/<path>",
  desiredOS: "android",           // or "ios"
  desiredOSVersion: "latest",
  desiredBrowser: "chrome",       // or "safari" for iOS
  desiredDevice: "Samsung Galaxy S25"
})
```

### Desktop browsers

```
mcp__browserstack__runBrowserLiveSession({
  platformType: "desktop",
  desiredURL: "<tunnel-url>/<path>",
  desiredOS: "Windows",           // or "OS X"
  desiredOSVersion: "11",         // or "latest"
  desiredBrowser: "chrome"        // or "firefox", "safari", "edge"
})
```

### Device defaults

If the user does not specify a device, use these defaults:

| User says | Device | OS | Browser |
|-----------|--------|-----|---------|
| "test on Android" | Samsung Galaxy S25 | android latest | chrome |
| "test on iPhone" | iPhone 16 | ios latest | safari |
| "test on iPad" | iPad Air 6th | ios latest | safari |

### All popular presets

| Use case | Device | OS | Browser |
|----------|--------|-----|---------|
| Android flagship | Samsung Galaxy S25 | android latest | chrome |
| Android mid-range | Google Pixel 9 | android latest | chrome |
| iPhone current | iPhone 16 | ios latest | safari |
| iPad | iPad Air 6th | ios latest | safari |

## Step 4 — Cleanup

When the user is done testing, kill the tunnel process:

```bash
kill <tunnel-pid> 2>/dev/null
```

If a local HTTP server was started for this session, kill that too.
