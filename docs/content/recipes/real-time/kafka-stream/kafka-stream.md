---
type: tutorial
title: Stream Kafka topics into the grid
metaTitle: Stream Kafka topics into the grid | Handsontable DataGrid for JavaScript
description: Stream an Apache Kafka topic into Handsontable DataGrid through a Server-Sent Events bridge, apply hundreds of updates a second, and write cell edits back to Kafka.
permalink: /recipes/real-time/kafka-stream
canonicalUrl: /recipes/real-time/kafka-stream
menuTag: new
tags:
  - kafka
  - apache kafka
  - confluent
  - server-sent events
  - streaming
  - real-time
  - setSourceDataAtCell
  - tutorial
  - recipes
searchCategory: Recipes
category: Real-time & Integrations
---

In this tutorial, you will build a live inventory grid fed by [Apache Kafka](https://kafka.apache.org/). A small Node.js bridge reads two Kafka topics and streams them to the browser with Server-Sent Events. Handsontable DataGrid applies hundreds of updates a second without losing the user's sort or filter. When the user edits a cell, the edit goes back to Kafka, so every open grid sees it.

[[toc]]

## Overview

**Difficulty:** Advanced<br>
**Time:** ~40 minutes<br>
**Stack:** Apache Kafka 4.3 (Docker), Node.js 22, `@confluentinc/kafka-javascript` 1.11, Server-Sent Events, Handsontable, Vite

Browsers can't talk to Kafka directly: Kafka uses its own binary protocol over TCP. So the recipe puts a bridge in between. The bridge consumes the topics, keeps the latest record for every key in memory, and sends the browser a snapshot followed by batched changes.

Kafka stays the single source of truth. The grid never saves an edit locally. It sends the edit to the bridge, the bridge writes it to Kafka, and the change reaches every grid, including the one that made it, through the stream.

## What you'll build

- A local Kafka broker in Docker, with two compacted topics.
- A producer that simulates a warehouse system: 500 SKUs across 4 warehouses, 200 stock movements a second, and the occasional new or discontinued SKU.
- A bridge that serves a snapshot and batched changes over Server-Sent Events, and writes grid edits to Kafka.
- A grid that applies each animation frame's changes in one call, highlights the cells that changed, flags low stock, and keeps the user's sort and filter.
- An editable **Reorder point** column whose edits round-trip through Kafka.
- A stream that recovers on its own when the bridge restarts.

## Before you begin

| Requirement | Version |
|---|---|
| Docker | any current version, with Compose |
| Node.js | 22 or later |
| `handsontable` | 18.1 or later |
| `@confluentinc/kafka-javascript` | 1.11.0 |
| Vite | any current version |

This recipe uses Confluent's [`@confluentinc/kafka-javascript`](https://github.com/confluentinc/confluent-kafka-javascript) client, which wraps the `librdkafka` C library. It ships prebuilt binaries for common platforms, and its `KafkaJS` export follows the `kafkajs` API, so code written for `kafkajs` ports with small configuration changes.

Create a folder with two parts: `server/` for Kafka, the producer, and the bridge, and a Vite app for the grid:

```bash
mkdir kafka-inventory && cd kafka-inventory
mkdir server && cd server
npm init -y
npm install --save-exact @confluentinc/kafka-javascript@1.11.0
cd ..
npm create vite@latest client -- --template vanilla-ts
cd client
npm install handsontable
```

## How the pieces fit

```
producer.mjs ──► inventory.stock    (compacted, key = SKU)  ──┐
                                                              ├──► bridge.mjs ──SSE──► grid
grid edit ──POST──► bridge.mjs ──► inventory.settings (compacted, key = SKU) ──┘
```

Two topics, each owned by one writer:

- `inventory.stock` belongs to the warehouse system. Each record is the full stock state of one SKU.
- `inventory.settings` belongs to the grid. Each record holds the reorder point of one SKU.

If both writers sent full records to one compacted topic, the warehouse system's next stock update for a SKU would overwrite the reorder point a user set a moment earlier. Splitting the topics by owner avoids that, and the bridge joins them into one row per SKU.

## Step 1: Start Kafka

Create `docker-compose.yml` in the `server/` folder:

::: example #docker-compose --code-only

@[code yaml](@/content/recipes/real-time/kafka-stream/server/docker-compose.yml)

:::

Start the broker:

```bash
docker compose up -d
```

**What's happening:** the official `apache/kafka` image starts a single-node cluster in KRaft mode, with no ZooKeeper and no configuration. It listens on `localhost:9092`.

## Step 2: Share the client configuration and create the topics

Create `server/kafka.mjs`:

::: example #kafka-mjs --code-only

@[code js](@/content/recipes/real-time/kafka-stream/server/kafka.mjs)

:::

**What's happening:**

- **The `kafkaJS` key selects the KafkaJS-style API.** The Confluent client also accepts `librdkafka` property names (`'bootstrap.servers'`), but this recipe uses the `kafkaJS` block throughout.
- **Both topics are compacted.** With `cleanup.policy=compact`, Kafka keeps at least the latest record for every key and discards older ones in the background. A compacted topic holds the current state of every SKU, so the bridge can rebuild its view by reading the topic from the start.
- **A `null` value is a tombstone.** In a compacted topic, a record with a `null` value deletes its key. The producer uses tombstones to discontinue SKUs.
- **`ensureTopics` is safe to call repeatedly.** It creates only the topics that don't exist yet, so both the producer and the bridge call it on start.

## Step 3: Simulate the warehouse system

Create `server/producer.mjs`:

::: example #producer-mjs --code-only

@[code js](@/content/recipes/real-time/kafka-stream/server/producer.mjs)

:::

**What's happening:** the producer sends a full record for all 500 SKUs, then sends a batch of stock movements every 50 ms. Each record's key is its SKU. Kafka routes records with the same key to the same partition, so the changes to one SKU always arrive in the order they were sent. About one record in a thousand adds a new SKU, and about one in a thousand is a tombstone that removes one. Set the `RATE` environment variable to change the number of records per second.

Run it in its own terminal:

```bash
cd server
node producer.mjs
```

## Step 4: Build the bridge

Create `server/bridge.mjs`:

::: example #bridge-mjs --code-only

@[code js](@/content/recipes/real-time/kafka-stream/server/bridge.mjs)

:::

**What's happening:**

- **The bridge keeps a materialized view.** It consumes both topics into two maps, `stock` and `settings`, and `toRow` joins them into the row the grid shows. A SKU with no settings record gets the default reorder point. Each row also carries `settingsRevision`, the Kafka offset of the SKU's latest settings record.
- **Every connection starts with a snapshot.** `GET /api/stream` first sends every row, then the changes. A browser that reconnects gets a fresh snapshot, so it can't miss an update while it was offline, and the bridge needs no per-client history.
- **Changes go out in batches.** At 200 records a second, sending one event per record wastes bandwidth and work. The bridge collects changed SKUs for 50 ms, keeps only the latest state of each, and sends one `changes` event.
- **A new consumer group per start.** The bridge never commits offsets, so every start reads both topics from the beginning and rebuilds the view. A group name that changes on every start matters for restarts: with a fixed name, Kafka keeps a stopped bridge in the group until its session times out, and the new bridge waits for it. A group that never commits is removed once it is empty. The signal handler at the end leaves the group cleanly on <kbd>Ctrl</kbd>+<kbd>C</kbd>.
- **The heartbeat is a real event.** Every 15 s the bridge sends a `ping` event. A proxy between the bridge and the browser can hold a connection open after the bridge stops, and an SSE comment line is invisible to the browser's `EventSource`. A `ping` event lets the client notice the silence. See [Step 5](#read-the-stream-in-the-browser).
- **Edits go to Kafka, not to the view.** `POST /api/settings/:sku` checks the SKU and the value, writes a record to `inventory.settings`, and returns `202 Accepted` with the record's offset as `revision`. Records with the same key go to the same partition, so for one SKU a higher offset is always a later edit. The bridge's own consumer then reads the record back and streams it to every grid.

Run it in a second terminal:

```bash
cd server
node bridge.mjs
```

## Step 5: Read the stream in the browser

In the Vite app, create `src/stream.ts`:

::: example #stream-ts --code-only

@[code ts](@/content/recipes/real-time/kafka-stream/javascript/stream.ts)

:::

**What's happening:**

- **One grid update per frame.** Each `changes` event goes into a buffer keyed by SKU, so a SKU that changes three times between frames is applied once. `requestAnimationFrame` hands the buffer to the grid right before the browser paints.
- **A hidden tab doesn't fall behind.** Browsers pause `requestAnimationFrame` in background tabs. The buffer keeps at most one record per SKU, so it stays small, and the grid catches up on the first frame after the tab becomes visible.
- **A silent stream is replaced.** `EventSource` reconnects by itself when a connection fails. It can't tell when a connection stays open but stops delivering, which is what happens behind a proxy when the bridge stops. The watchdog closes the stream after 35 s with no event and opens a new one, and the new connection's snapshot resyncs the grid.

## Step 6: Build the grid

Create `src/grid.ts`:

::: example #grid-ts --code-only

@[code ts](@/content/recipes/real-time/kafka-stream/javascript/grid.ts)

:::

**What's happening:**

- **Values go in by physical row.** `setSourceDataAtCell` takes physical row indexes, the positions in the `rows` array, so a sort or filter can't send a value to the wrong SKU. It accepts all the frame's changes as one array and renders once. It doesn't fire `afterChange`, so streamed values never trigger the write-back.
- **New and removed SKUs replace the data.** When the batch adds or removes rows, the grid passes the new array to `updateData`, which keeps the column order, cell state, and sort and filter settings.
- **Sorting and filtering run on structural changes, not on every value.** `ColumnSorting` and `Filters` don't re-run when values change through `setSourceDataAtCell` or `updateData`. That is useful here: at 200 records a second, rows that re-sorted on every value would jump while the user reads them. `reapplyView` re-runs the filter and the sort after rows are added or removed, so new rows land in the right place and hidden rows stay hidden. To re-sort on value changes too, call `reapplyView()` on a timer, for example every few seconds.
- **The highlight comes from cell meta.** The `cells` function receives the physical row and adds the `is-changed` class for 800 ms after a SKU changes, and `is-low` when available stock falls below the reorder point. Because the class comes from cell meta, it survives scrolling and sorting, which a class added directly to a `td` element doesn't.
- **Edits wait for Kafka.** `afterChange` ignores the grid's own changes and sends a user's **Reorder point** edit to the bridge. Until a row with a `settingsRevision` at least as high as the edit's `revision` arrives, `toRow` keeps the edit on screen, in change batches and in the snapshot after a reconnect alike, so a stale record that was already in flight can't briefly overwrite it. The check compares offsets, not values: if another user edits the same SKU before the bridge flushes, the bridge sends only the newer value, and the grid accepts it instead of waiting forever for its own.
- **The latest edit wins.** Each edit gets a generation number. A response for an older edit of the same SKU can't confirm or roll back a newer one that is still in flight. If the latest edit fails, the grid shows the value Kafka last confirmed, using `setSourceDataAtCell`, which doesn't fire `afterChange`, so the revert isn't sent again. The [Notification](@/guides/dialog/notification/notification.md) plugin shows the error.

## Step 7: Run the app

Replace `src/main.ts`:

::: example #main-ts --code-only

@[code ts](@/content/recipes/real-time/kafka-stream/javascript/main.ts)

:::

Add the styles in `src/styles.css`:

::: example #styles-css --code-only

@[code css](@/content/recipes/real-time/kafka-stream/javascript/styles.css)

:::

Replace `index.html`:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Live inventory from Kafka</title>
  </head>
  <body>
    <main>
      <h1>Live inventory from Kafka</h1>
      <p class="toolbar">
        <span id="status" class="badge">Connecting…</span>
        <span>Records/s <strong id="rate">0</strong></span>
        <span>SKUs <strong id="rows">0</strong></span>
      </p>
      <div id="grid"></div>
    </main>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
```

Create `vite.config.ts`, so the dev server forwards `/api` to the bridge and the page and the stream share one origin:

```ts
import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    proxy: { '/api': 'http://localhost:3001' },
  },
});
```

Start the app in a third terminal:

```bash
cd client
npm run dev
```

Open the URL Vite prints. The grid fills from the snapshot, cells flash as stock moves, and the toolbar shows about 200 records a second. Sort by **Available** and filter **Warehouse** to one location: values keep updating in place, and new SKUs appear in sorted position. Edit a **Reorder point**, then reload the page or open it in a second window: the value came back from Kafka.

## How it works -- complete flow

1. The producer writes a stock record for a SKU to `inventory.stock`, keyed by the SKU.
2. The bridge's consumer reads it, updates the `stock` map, and marks the SKU as changed.
3. Within 50 ms, the bridge sends a `changes` event with the joined row of every changed SKU to every connected browser.
4. The browser adds the rows to its buffer. On the next animation frame, the grid writes the changed values with one `setSourceDataAtCell` call, or replaces the data with `updateData` when SKUs were added or removed.
5. The user edits a **Reorder point**. `afterChange` sends `POST /api/settings/:sku`, and the bridge writes a record to `inventory.settings`.
6. The bridge's consumer reads that record, and the change reaches every grid, including the one that made the edit, through steps 3 and 4.

## Production considerations

- **Authenticate both endpoints.** The stream and the edit endpoint are open in this recipe. Put them behind the same authentication as the rest of your app, and check that the user may edit the SKU before writing to Kafka.
- **Connect to a managed cluster.** To use a hosted cluster such as Confluent Cloud, set `KAFKA_BROKERS` to its bootstrap servers and add its SSL and SASL settings to the client configuration in `kafka.mjs`. See the client's [configuration reference](https://github.com/confluentinc/confluent-kafka-javascript).
- **Size the view.** Each bridge holds every row in memory and sends all of them in each snapshot. That suits thousands or tens of thousands of keys. For millions of rows, keep the data in a database and use the [`dataProvider` plugin](@/guides/getting-started/server-side-data/server-side-data.md), with Kafka only pushing change notifications.
- **Run more than one bridge.** Every bridge builds the full view on its own, so you can run several behind a load balancer. A client that reconnects to a different bridge gets that bridge's snapshot.
- **Wait for the replay after a restart.** A bridge accepts connections while it is still replaying the topics. A browser that connects in that window gets a partial snapshot, and the rest of the rows arrive as changes within a second or two. To serve only complete snapshots, compare the consumer's position with the topics' end offsets before you start the HTTP server.

## What you learned

- Why a browser needs a bridge to read Kafka, and why Server-Sent Events suit a one-way stream.
- How compacted topics keyed by ID hold current state, and how tombstones delete keys.
- Why each writer should own its own topic when several systems update the same records.
- How to apply a high-rate stream to Handsontable: one `setSourceDataAtCell` call per frame, by physical row, and `updateData` for structural changes.
- Why sorting and filtering don't re-run on streamed values, and how to re-apply them when rows are added or removed.
- How to detect a stream that a proxy keeps open after the server stops.

## Next steps

- [Real-time updates via WebSocket](@/recipes/real-time/websocket-updates/websocket-updates.md) -- the same update technique with a simulated feed and no server.
- [Saving data](@/guides/getting-started/saving-data/saving-data.md) -- the hooks and sources behind the write-back.
- [Server-side data](@/guides/getting-started/server-side-data/server-side-data.md) -- page through datasets that don't fit in memory.
- [Kafka log compaction](https://kafka.apache.org/documentation/#compaction) -- how Kafka keeps the latest record per key.
- [Confluent's JavaScript client](https://github.com/confluentinc/confluent-kafka-javascript) -- the client's API, configuration, and migration guide from `kafkajs`.
