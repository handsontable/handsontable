---
name: browserstack-live
description: Use when testing a local or public URL on a real device via BrowserStack, opening a live browser session on Android, iOS, or desktop browsers, or when the user mentions BrowserStack, real device testing, mobile testing, cross-browser testing, touch testing, or wants to verify behavior on a specific phone, tablet, or browser version. Also trigger when the user says "test this on Android/iPhone/Safari/Chrome mobile", asks to open a live session, or mentions demo-mobile.html, even if they don't mention BrowserStack by name.
---

# BrowserStack Live Session

BrowserStack devices cannot reach `localhost`, so tunnel the local dev server through Cloudflare to a temporary public URL: local server -> Cloudflare tunnel (`trycloudflare.com`) -> BrowserStack Live.

## Step 1: Prepare something to test

### Option A: Handsontable demo page

Use the `handsontable-demo-page` skill to generate `handsontable/dev-pr.html` (local build) and `handsontable/dev-latest.html` (released version from the CDN); each links to the other. Serve and verify:

```bash
python3 -m http.server 8767 --directory handsontable &
curl -s -o /dev/null -w "dev-pr: %{http_code}\n" http://localhost:8767/dev-pr.html && \
curl -s -o /dev/null -w "dev-latest: %{http_code}\n" http://localhost:8767/dev-latest.html
```

The tunnel path is `/dev-pr.html`; its nav bar switches to `/dev-latest.html`.

### Option B: Existing local server

Confirm reachability: `curl -s -o /dev/null -w "%{http_code}" <URL>`

| Server | Start command | Default port |
|--------|--------------|-------------|
| Docs (Astro) | `npm run dev --prefix docs` | 4321 |
| Handsontable static files | `python3 -m http.server 8767 --directory handsontable` | 8767 |

If a Vite-based server (Astro docs) returns "Blocked request" on the tunnel URL, check whether `astro.config.mjs` already has this, add it if missing, and restart:

```js
vite: {
  server: {
    allowedHosts: ['.trycloudflare.com'],
  },
}
```

### Option C: Public URL

Skip to Step 3 and pass the URL directly.

## Step 2: Start the Cloudflare tunnel

The tunnel needs no Cloudflare account. The URL is printed to stderr, so capture it:

```bash
npx cloudflared tunnel --url http://localhost:<PORT> > /tmp/cloudflare-tunnel.log 2>&1 &
echo "Tunnel PID: $!"
sleep 10
grep -o 'https://[a-z0-9-]*\.trycloudflare\.com' /tmp/cloudflare-tunnel.log | head -1
```

If no URL appears, wait and re-check `cat /tmp/cloudflare-tunnel.log`; on failure check port conflicts and kill stale tunnel processes. The URL changes on every restart.

## Step 3: Launch the BrowserStack session

Call `mcp__browserstack__runBrowserLiveSession` and share the dashboard URL it returns.

Mobile:

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

Desktop:

```
mcp__browserstack__runBrowserLiveSession({
  platformType: "desktop",
  desiredURL: "<tunnel-url>/<path>",
  desiredOS: "Windows",           // or "OS X"
  desiredOSVersion: "11",         // or "latest"
  desiredBrowser: "chrome"        // or "firefox", "safari", "edge"
})
```

Defaults when the user names no device:

| User says | Device | OS | Browser |
|-----------|--------|-----|---------|
| "test on Android" | Samsung Galaxy S25 | android latest | chrome |
| "Android mid-range" | Google Pixel 9 | android latest | chrome |
| "test on iPhone" | iPhone 16 | ios latest | safari |
| "test on iPad" | iPad Air 6th | ios latest | safari |

## Step 4: Cleanup

When testing ends, `kill <tunnel-pid> 2>/dev/null` and stop any local HTTP server started for the session.
