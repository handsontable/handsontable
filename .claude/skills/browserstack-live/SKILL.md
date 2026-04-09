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

## Step 1 — Confirm the local server is running

Check that the URL the user wants to test is reachable locally:

```bash
curl -s -o /dev/null -w "%{http_code}" <URL>
```

If the server is not running, help the user start it. Common patterns in this repo:

| Server | Start command | Default port |
|--------|--------------|-------------|
| Docs (Astro) | `npm run dev --prefix docs` | 4321 |
| Handsontable static files | `python3 -m http.server 8767` from `handsontable/` | 8767 |

### Handsontable build check

When testing local Handsontable builds (e.g., `demo-mobile.html?version=fix`), the built assets must exist:

```bash
ls handsontable/dist/handsontable.full.js
```

If missing, build first: `npm run build --prefix handsontable`.

### Astro dev servers

Vite-based dev servers block requests from unknown hostnames by default. If the tunnel URL returns a "Blocked request" error, add this to the Vite config (inside `astro.config.mjs`):

```js
vite: {
  server: {
    allowedHosts: true,
  },
}
```

Then restart the dev server. Check whether it is already configured before modifying the file.

## Step 2 — Start the Cloudflare tunnel

BrowserStack cannot access `localhost`. A Cloudflare quick tunnel creates an ephemeral public URL that proxies to the local server.

Capture output to a log file — the tunnel URL is printed to stderr:

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
- No Cloudflare account is needed. The tunnel is ephemeral and disappears when the process exits.
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

## Known Android touch behavior

Android fires synthetic `mousedown`, `mouseup`, and `click` events after every `touchend`. These arrive asynchronously (~0–300 ms later) at the same coordinates as the touch. This matters when testing editors or popups that open on double-tap — the synthetic events can:

1. **Trigger outside-click handlers** that close the editor immediately after it opens.
2. **Click buttons or links** that rendered at the touch position when the editor appeared.

If you observe popups or editors opening and instantly closing on Android, this is the likely cause. The fix is a timing guard: ignore events that fire within 300 ms of the editor opening.
