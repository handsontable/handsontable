/**
 * Chrome Performance trace → summary (same model as uploading JSON in DevTools).
 *
 * References (devtools-frontend):
 * - panels/timeline/TimelineUIUtils.ts — statsForTimeRange, buildRangeStatsCacheIfNeeded
 * - panels/timeline/utils/EntryStyles.ts — event name → category (System = "other")
 * - models/trace/helpers/Trace.ts — forEachEvent (skip async + flow phases)
 * - models/trace/extras/MainThreadActivity.ts — calculateWindow (auto range)
 *
 * Usage:
 *   node trace-parser.mjs <trace.json> [--debug] [--full]
 *   node trace-parser.mjs <a.json> <b.json> ...   # average across iterations
 *
 * DOM / heap extrema come from UpdateCounters (disabled-by-default-devtools.timeline),
 * same source as DevTools Memory timeline — scoped to CrRendererMain.
 *
 * Rounded milliseconds may differ by ~1–2 ms from the on-screen DevTools summary
 * because category times are accumulated on a floating-point timeline; totals match
 * the auto-selected range (see MainThreadActivity.calculateWindow).
 */

import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

// Exact eventStylesMap from EntryStyles.ts (Trace.Types.Events.Name enum → string values)
// Only includes VISIBLE events (hidden=false). Maps event name → category.
// Categories: 'loading', 'scripting', 'rendering', 'painting', 'experience', 'messaging',
//             'other' (shown as System), 'idle', 'gpu', 'async'
const EVENT_STYLES = {
  // other (System)
  RunTask: 'other',
  Program: 'other',
  'CpuProfiler::StartProfiling': 'other',
  'v8.parseOnBackground': 'other',
  'V8.FinalizeDeserialization': 'other',

  // scripting
  ProfileCall: 'scripting',
  JSSample: 'scripting',
  EventDispatch: 'scripting',
  TimerInstall: 'scripting',
  TimerRemove: 'scripting',
  TimerFire: 'scripting',
  XHRReadyStateChange: 'scripting',
  XHRLoad: 'scripting',
  'v8.compile': 'scripting',
  'v8.produceCache': 'scripting',
  'V8.CompileCode': 'scripting',
  'V8.OptimizeCode': 'scripting',
  EvaluateScript: 'scripting',
  'V8.CompileModule': 'scripting',
  'v8.produceModuleCache': 'scripting',
  'v8.evaluateModule': 'scripting',
  'v8.parseOnBackgroundParsing': 'scripting',
  'v8.deserializeOnBackground': 'scripting',
  'v8.wasm.streamFromResponseCallback': 'scripting',
  'v8.wasm.compiledModule': 'scripting',
  'v8.wasm.cachedModule': 'scripting',
  'v8.wasm.moduleCacheHit': 'scripting',
  'v8.wasm.moduleCacheInvalid': 'scripting',
  TimeStamp: 'scripting',
  ConsoleTime: 'scripting',
  UserTiming: 'scripting',
  RunMicrotasks: 'scripting',
  FunctionCall: 'scripting',
  GCEvent: 'scripting',
  MajorGC: 'scripting',
  MinorGC: 'scripting',
  'CppGC.IncrementalSweep': 'scripting',
  RequestAnimationFrame: 'scripting',
  CancelAnimationFrame: 'scripting',
  FireAnimationFrame: 'scripting',
  RequestIdleCallback: 'scripting',
  CancelIdleCallback: 'scripting',
  FireIdleCallback: 'scripting',
  WebSocketCreate: 'scripting',
  WebSocketSendHandshakeRequest: 'scripting',
  WebSocketReceiveHandshakeResponse: 'scripting',
  WebSocketDestroy: 'scripting',
  WebSocketSend: 'scripting',
  WebSocketReceive: 'scripting',
  EmbedderCallback: 'scripting',
  'BlinkGC.AtomicPhase': 'scripting',
  DoEncrypt: 'scripting',
  DoEncryptReply: 'scripting',
  DoDecrypt: 'scripting',
  DoDecryptReply: 'scripting',
  DoDigest: 'scripting',
  DoDigestReply: 'scripting',
  DoSign: 'scripting',
  DoSignReply: 'scripting',
  DoVerify: 'scripting',
  DoVerifyReply: 'scripting',
  SchedulePostTaskCallback: 'scripting',
  RunPostTaskCallback: 'scripting',
  AbortPostTaskCallback: 'scripting',
  'V8Console::runTask': 'scripting',

  // rendering
  Animation: 'rendering',
  HitTest: 'rendering',
  ScheduleStyleRecalculation: 'rendering',
  UpdateLayoutTree: 'rendering',
  Layerize: 'rendering',
  Layout: 'rendering',
  UpdateLayerTree: 'rendering',
  PrePaint: 'rendering',
  ScrollLayer: 'rendering',
  ComputeIntersections: 'rendering',

  // painting
  PaintSetup: 'painting',
  Paint: 'painting',
  PaintImage: 'painting',
  RasterTask: 'painting',
  Commit: 'painting',
  CompositeLayers: 'painting',
  'Decode Image': 'painting',

  // loading
  ParseHTML: 'loading',
  ParseAuthorStyleSheet: 'loading',
  ResourceWillSendRequest: 'loading',
  ResourceSendRequest: 'loading',
  ResourceReceiveResponse: 'loading',
  ResourceFinish: 'loading',
  ResourceReceivedData: 'loading',

  // experience
  SyntheticLayoutShift: 'experience',
  SyntheticLayoutShiftCluster: 'experience',
  EventTiming: 'experience',

  // messaging
  HandlePostMessage: 'messaging',
  SchedulePostMessage: 'messaging',

  // gpu
  GPUTask: 'gpu',

  // async
  AsyncTask: 'async',

  // idle
  'v8.parseOnBackgroundWaiting': 'idle',
};

function getEventCategory(event) {
  return EVENT_STYLES[event.name] || null; // null = not visible / not in map
}

function isVisibleEvent(event) {
  return getEventCategory(event) !== null;
}

// eventTimingsMilliSeconds: convert microsecond timestamps to milliseconds
function eventTimingsMilliSeconds(event) {
  return {
    startTime: event.ts / 1000,
    endTime: (event.ts + (event.dur || 0)) / 1000,
    duration: (event.dur || 0) / 1000,
  };
}

/** Trace.Types.Events.isPhaseAsync — nestable + legacy async */
function isPhaseAsync(ph) {
  return ph === 'b' || ph === 'n' || ph === 'e' || ph === 'S' || ph === 'T' || ph === 'F' || ph === 'p';
}

/** Trace.Types.Events.isFlowPhase */
function isFlowPhase(ph) {
  return ph === 's' || ph === 't' || ph === 'f';
}

// forEachEvent from Trace.ts - stack-based traversal of sorted events
function forEachEvent(events, config) {
  const sortedEvents = [...events].sort((a, b) => {
    const aStart = eventTimingsMilliSeconds(a).startTime;
    const bStart = eventTimingsMilliSeconds(b).startTime;

    if (aStart !== bStart) {
      return aStart - bStart;
    }
    // Same start: longer events first (parents before children)
    const aDur = eventTimingsMilliSeconds(a).duration;
    const bDur = eventTimingsMilliSeconds(b).duration;

    return bDur - aDur;
  });

  const globalStartTime = config.startTime ?? 0;
  const globalEndTime = config.endTime || Infinity;
  const stack = [];

  for (let i = 0; i < sortedEvents.length; i++) {
    const currentEvent = sortedEvents[i];
    const currentStart = eventTimingsMilliSeconds(currentEvent).startTime;
    const currentEnd = eventTimingsMilliSeconds(currentEvent).endTime;
    const currentDuration = currentEnd - currentStart;

    if (isPhaseAsync(currentEvent.ph) || isFlowPhase(currentEvent.ph)) {
      continue;
    }

    if (currentEnd < globalStartTime) {
      continue;
    }
    if (currentStart > globalEndTime) {
      break;
    }

    // Pop events that ended before current starts
    let lastEventOnStack = stack[stack.length - 1];

    while (lastEventOnStack) {
      const lastEnd = eventTimingsMilliSeconds(lastEventOnStack).endTime;

      if (lastEnd <= currentStart) {
        stack.pop();
        config.onEndEvent(lastEventOnStack);
        lastEventOnStack = stack[stack.length - 1];
      } else {
        break;
      }
    }

    if (config.eventFilter && !config.eventFilter(currentEvent)) {
      continue;
    }

    if (currentDuration > 0) {
      config.onStartEvent(currentEvent);
      stack.push(currentEvent);
    }
  }

  while (stack.length) {
    const last = stack.pop();

    if (last) {
      config.onEndEvent(last);
    }
  }
}

// buildRangeStatsCacheIfNeeded from TimelineUIUtils.ts
// Uses ABSOLUTE millisecond timestamps (no normalization)
const categoryBreakdownCacheSymbol = Symbol('categoryBreakdownCache');

function buildRangeStatsCacheIfNeeded(events) {
  if (events[categoryBreakdownCacheSymbol]) {
    return;
  }

  const sortedEvents = [...events].sort((a, b) => {
    const aTimings = eventTimingsMilliSeconds(a);
    const bTimings = eventTimingsMilliSeconds(b);

    if (aTimings.startTime !== bTimings.startTime) {
      return aTimings.startTime - bTimings.startTime;
    }

    return (bTimings.duration || 0) - (aTimings.duration || 0);
  });

  if (sortedEvents.length === 0) {
    return;
  }

  const aggregatedStats = {};
  const categoryStack = [];
  let lastTime = 0;

  function updateCategory(category, time) {
    if (!aggregatedStats[category]) {
      aggregatedStats[category] = { time: [], value: [] };
    }
    const statsArrays = aggregatedStats[category];

    if (statsArrays.time.length && statsArrays.time[statsArrays.time.length - 1] === time) {
      return;
    }
    if (lastTime > time) {
      return;
    }
    const lastValue = statsArrays.value.length > 0 ? statsArrays.value[statsArrays.value.length - 1] : 0;

    // Match TimelineUIUtils: always append (including zero-length steps at categoryChange)
    statsArrays.value.push(lastValue + time - lastTime);
    statsArrays.time.push(time);
  }

  function categoryChange(from, to, time) {
    if (from) {
      updateCategory(from, time);
    }
    lastTime = time;

    if (to) {
      updateCategory(to, time);
    }
  }

  function onStartEvent(e) {
    const startTime = eventTimingsMilliSeconds(e).startTime;
    const category = getEventCategory(e);
    const parentCategory = categoryStack.length ? categoryStack[categoryStack.length - 1] : null;

    if (category !== parentCategory) {
      categoryChange(parentCategory || null, category, startTime);
    }
    categoryStack.push(category);
  }

  function onEndEvent(e) {
    const endTime = eventTimingsMilliSeconds(e).endTime;
    const category = categoryStack.pop();
    const parentCategory = categoryStack.length ? categoryStack[categoryStack.length - 1] : null;

    if (category !== parentCategory) {
      categoryChange(category, parentCategory, endTime || 0);
    }
  }

  forEachEvent(sortedEvents, { onStartEvent, onEndEvent });

  events[categoryBreakdownCacheSymbol] = aggregatedStats;
}

function upperBound(array, value, comparator) {
  let low = 0;
  let high = array.length;

  while (low < high) {
    const mid = Math.floor((low + high) / 2);

    if (comparator(array[mid], value) <= 0) {
      low = mid + 1;
    } else {
      high = mid;
    }
  }

  return low;
}

function statsForTimeRange(events, startTime, endTime) {
  if (!events.length) {
    return { idle: endTime - startTime };
  }

  buildRangeStatsCacheIfNeeded(events);

  function aggregatedStatsAtTime(time) {
    const stats = {};
    const cache = events[categoryBreakdownCacheSymbol];

    if (!cache) {
      return stats;
    }
    for (const category of Object.keys(cache)) {
      const categoryCache = cache[category];
      const index = upperBound(categoryCache.time, time, (a, b) => a - b);
      let value;

      if (index === 0) {
        value = 0;
      } else if (index === categoryCache.time.length) {
        value = categoryCache.value[categoryCache.value.length - 1];
      } else {
        const t0 = categoryCache.time[index - 1];
        const t1 = categoryCache.time[index];
        const v0 = categoryCache.value[index - 1];
        const v1 = categoryCache.value[index];

        value = v0 + (v1 - v0) * (time - t0) / (t1 - t0);
      }
      stats[category] = value;
    }

    return stats;
  }

  function subtractStats(a, b) {
    const result = { ...a };

    for (const key of Object.keys(b)) {
      result[key] = (result[key] || 0) - b[key];
    }

    return result;
  }

  const aggregatedStats = subtractStats(aggregatedStatsAtTime(endTime), aggregatedStatsAtTime(startTime));
  const aggregatedTotal = Object.values(aggregatedStats).reduce((a, b) => a + b, 0);

  aggregatedStats.idle = Math.max(0, endTime - startTime - aggregatedTotal);

  return aggregatedStats;
}

// Find ALL CrRendererMain threads, return the one with the most events
function findMainRendererThread(events) {
  const threadNames = new Map();

  for (const event of events) {
    if (event.name === 'thread_name' && event.ph === 'M' && event.args && event.args.name) {
      const key = `${event.pid}-${event.tid}`;

      threadNames.set(key, event.args.name);
    }
  }

  const rendererThreads = [];

  for (const [key, name] of threadNames.entries()) {
    if (name === 'CrRendererMain') {
      const [pid, tid] = key.split('-').map(Number);

      rendererThreads.push({ pid, tid });
    }
  }

  if (rendererThreads.length === 0) {
    return null;
  }
  if (rendererThreads.length === 1) {
    return rendererThreads[0];
  }

  // Multiple renderer threads: pick the one with the most complete events
  let best = null;
  let bestCount = 0;

  for (const thread of rendererThreads) {
    const count = events.filter(e =>
      e.ph === 'X' && e.pid === thread.pid && e.tid === thread.tid
    ).length;

    if (count > bestCount) {
      bestCount = count;
      best = thread;
    }
  }

  return best;
}

// Compute trace bounds matching DevTools MetaHandler logic:
// - min = TracingStartedInBrowser.ts (if present), else min of all event timestamps
// - max = max of (event.ts + event.dur) across all events
function computeTraceBounds(events) {
  let minTs = Infinity;
  let maxTs = -Infinity;
  let tracingStartedTs = -1;

  for (const event of events) {
    if (event.ts !== undefined) {
      minTs = Math.min(minTs, event.ts);
      const eventEnd = event.ts + (event.dur || 0);

      maxTs = Math.max(maxTs, eventEnd);
    }
    if ((event.name === 'TracingStartedInBrowser' || event.name === 'TracingStartedInPage') && event.ph === 'I') {
      if (tracingStartedTs < 0 || event.ts < tracingStartedTs) {
        tracingStartedTs = event.ts;
      }
    }
  }

  // DevTools prefers TracingStartedInBrowser as the trace start
  if (tracingStartedTs >= 0) {
    minTs = tracingStartedTs;
  }

  return {
    minUs: minTs,
    maxUs: maxTs,
    minMs: minTs / 1000,
    maxMs: maxTs / 1000,
  };
}

// calculateWindow from devtools-frontend/front_end/models/trace/extras/MainThreadActivity.ts
// Finds the "interesting" region of the trace by detecting low utilization at edges
// Uses ALL main thread entries (not just visible) - matches DevTools behavior
function calculateWindow(traceBoundsUs, allMainThreadEntries) {
  if (!allMainThreadEntries.length) {
    return traceBoundsUs;
  }

  // Sort entries (already sorted, but ensure)
  const entries = [...allMainThreadEntries].sort((a, b) => a.ts - b.ts);

  function findLowUtilizationRegion(startIndex, stopIndex) {
    const threshold = 0.1;
    let cutIndex = startIndex;
    const e0 = entries[cutIndex];
    let cutTime = (e0.ts * 2 + (e0.dur || 0)) / 2;
    let usedTime = 0;
    const step = Math.sign(stopIndex - startIndex);

    for (let i = startIndex; i !== stopIndex; i += step) {
      const task = entries[i];
      const taskMid = (task.ts * 2 + (task.dur || 0)) / 2;
      const interval = Math.abs(cutTime - taskMid);

      if (usedTime < threshold * interval) {
        cutIndex = i;
        cutTime = taskMid;
        usedTime = 0;
      }
      usedTime += (task.dur || 0);
    }

    return cutIndex;
  }

  const rightIndex = findLowUtilizationRegion(entries.length - 1, 0);
  const leftIndex = findLowUtilizationRegion(0, rightIndex);

  let leftTime = entries[leftIndex].ts;
  let rightTime = entries[rightIndex].ts + (entries[rightIndex].dur || 0);
  const zoomedInSpan = rightTime - leftTime;

  // If the zoomed area is less than 10% of total, show the whole trace
  if (zoomedInSpan < traceBoundsUs.range * 0.1) {
    return traceBoundsUs;
  }

  // Add 5% breathing space on each side, clamped to trace bounds
  leftTime = Math.max(leftTime - 0.05 * zoomedInSpan, traceBoundsUs.min);
  rightTime = Math.min(rightTime + 0.05 * zoomedInSpan, traceBoundsUs.max);

  return {
    min: leftTime,
    max: rightTime,
    range: rightTime - leftTime,
  };
}

// Synthesize ProfileCall scripting contribution from CPU profile data.
// Finds non-idle CPU samples that fall within RunTask intervals but OUTSIDE
// any visible scripting events. These samples would be synthesized as ProfileCall
// events by DevTools SamplesIntegrator and contribute scripting time.
function computeProfileCallScripting(events, mainPid, mainTid, windowMinUs, windowMaxUs) {
  // Find Profile event (gives start time for CPU profiling)
  const profileEvent = events.find(e => e.name === 'Profile' && e.pid === mainPid);

  if (!profileEvent || !profileEvent.args?.data?.startTime) {
    return 0;
  }

  const cpuStartTime = profileEvent.args.data.startTime; // μs absolute

  // Merge all ProfileChunk events into a single timeline
  const chunks = events
    .filter(e => e.name === 'ProfileChunk' && e.pid === mainPid)
    .sort((a, b) => a.ts - b.ts);

  if (chunks.length === 0) {
    return 0;
  }

  const allSamples = [];
  const allDeltas = [];
  const allNodes = new Map();

  for (const chunk of chunks) {
    const d = chunk.args?.data;

    if (!d) {
      continue;
    }
    if (d.cpuProfile?.samples) {
      allSamples.push(...d.cpuProfile.samples);
    }
    if (d.timeDeltas) {
      allDeltas.push(...d.timeDeltas);
    }
    if (d.cpuProfile?.nodes) {
      for (const n of d.cpuProfile.nodes) {
        allNodes.set(n.id, n);
      }
    }
  }

  if (allSamples.length === 0) {
    return 0;
  }

  // Compute absolute timestamps for each sample
  let t = cpuStartTime;
  const timestamps = allDeltas.map((d) => {
    t += d;

    return t;
  });

  // Idle function names (ProfileCall events for these are filtered out)
  const IDLE_NAMES = new Set(['(idle)', '(program)', '(root)', '']);

  // Helper: merge overlapping intervals for correct binary search
  function mergeIntervals(intervals) {
    if (!intervals.length) {
      return [];
    }
    intervals.sort((a, b) => a[0] - b[0]);
    const merged = [intervals[0].slice()];

    for (let i = 1; i < intervals.length; i++) {
      const last = merged[merged.length - 1];

      if (intervals[i][0] <= last[1]) {
        last[1] = Math.max(last[1], intervals[i][1]);
      } else {
        merged.push(intervals[i].slice());
      }
    }

    return merged;
  }

  function inMerged(ts, merged) {
    let lo = 0; let
      hi = merged.length - 1;

    while (lo <= hi) {
      const mid = Math.floor((lo + hi) / 2);

      if (merged[mid][1] <= ts) {
        lo = mid + 1;
      } else if (merged[mid][0] > ts) {
        hi = mid - 1;
      } else {
        return true;
      }
    }

    return false;
  }

  const mainEvents = events.filter(e =>
    e.pid === mainPid && e.tid === mainTid && e.ph === 'X' && e.dur > 0
  ).sort((a, b) => a.ts - b.ts);

  // Visible scripting events (these already account for scripting time)
  const scriptingEvents = mainEvents.filter((e) => {
    const cat = EVENT_STYLES[e.name];

    return cat === 'scripting' && e.name !== 'ProfileCall';
  });
  const mergedScripting = mergeIntervals(scriptingEvents.map(e => [e.ts, e.ts + e.dur]));

  // RunTask events (with original start/end for capping)
  const runTaskEvents = mainEvents.filter(e => e.name === 'RunTask');
  const mergedRunTasks = mergeIntervals(runTaskEvents.map(e => [e.ts, e.ts + e.dur]));

  // All non-RunTask events sorted by ts (for finding next event start within RunTask)
  // In SamplesIntegrator, any trace event start terminates fakeJSInvocation
  const nonRunTaskEventStarts = mainEvents
    .filter(e => e.name !== 'RunTask')
    .map(e => e.ts)
    .sort((a, b) => a - b);

  // Find the next event start after ts within the same RunTask
  function nextEventStartInRunTask(ts, runTaskEnd) {
    // Binary search for first event start > ts
    let lo = 0; let
      hi = nonRunTaskEventStarts.length;

    while (lo < hi) {
      const mid = Math.floor((lo + hi) / 2);

      if (nonRunTaskEventStarts[mid] <= ts) {
        lo = mid + 1;
      } else {
        hi = mid;
      }
    }
    // lo is the index of the first event start > ts
    if (lo < nonRunTaskEventStarts.length && nonRunTaskEventStarts[lo] < runTaskEnd) {
      return nonRunTaskEventStarts[lo];
    }

    return runTaskEnd;
  }

  // Find RunTask end for a given timestamp
  function getRunTaskEnd(ts) {
    for (const rt of runTaskEvents) {
      if (ts >= rt.ts && ts < rt.ts + rt.dur) {
        return rt.ts + rt.dur;
      }
    }

    return ts; // shouldn't happen
  }

  // Sum up scripting time from non-idle samples in RunTask gaps
  let profileCallScriptingUs = 0;

  for (let i = 0; i < allSamples.length; i++) {
    const ts = timestamps[i];
    // For the last sample there is no next sample, so use Infinity as cap —
    // the ProfileCall's duration will be bounded by nextEventStart / windowMaxUs.
    const nextTs = i < allSamples.length - 1 ? timestamps[i + 1] : Infinity;

    // Only consider samples within the display window
    if (ts < windowMinUs || ts >= windowMaxUs) {
      continue;
    }

    // Check if non-idle
    const nodeId = allSamples[i];
    const node = allNodes.get(nodeId);
    const fname = node?.callFrame?.functionName ?? '';

    if (IDLE_NAMES.has(fname)) {
      continue;
    }

    // Must be within a RunTask
    if (!inMerged(ts, mergedRunTasks)) {
      continue;
    }

    // Must NOT be within an existing visible scripting event
    if (inMerged(ts, mergedScripting)) {
      continue;
    }

    // Cap duration at: next trace event start in RunTask, RunTask end, next sample, window end
    const runTaskEnd = getRunTaskEnd(ts);
    const nextEventStart = nextEventStartInRunTask(ts, runTaskEnd);
    const cappedEnd = Math.min(nextTs, nextEventStart, windowMaxUs);

    // This sample contributes scripting time (fakeJSInvocation ProfileCall)
    if (cappedEnd > ts) {
      profileCallScriptingUs += cappedEnd - ts;
    }
  }

  return profileCallScriptingUs / 1000; // convert to ms
}

function formatHeapMinBytesLabel(bytes) {
  return `${Math.round(bytes / 1000)} kB`;
}

function formatHeapMaxBytesLabel(bytes) {
  if (bytes >= 1_000_000) {
    return `${(bytes / 1_000_000).toFixed(1)} MB`;
  }

  return `${Math.round(bytes / 1000)} kB`;
}

/**
 * Min/max from UpdateCounters instant events (args.data: jsHeapSizeUsed, documents, nodes, jsEventListeners).
 * Matches DevTools decimal labels: kB = bytes/1000, MB = bytes/1e6.
 */
export function computeUpdateCountersRanges(events, mainThread) {
  const list = events.filter(
    e =>
      e.name === 'UpdateCounters' &&
      e.ph === 'I' &&
      e.args?.data &&
      (!mainThread || (e.pid === mainThread.pid && e.tid === mainThread.tid)),
  );

  if (list.length === 0) {
    return null;
  }

  let jsHeapMin = Infinity;
  let jsHeapMax = -Infinity;
  let documentsMin = Infinity;
  let documentsMax = -Infinity;
  let nodesMin = Infinity;
  let nodesMax = -Infinity;
  let listenersMin = Infinity;
  let listenersMax = -Infinity;

  for (const e of list) {
    const d = e.args.data;

    if (typeof d.jsHeapSizeUsed === 'number') {
      jsHeapMin = Math.min(jsHeapMin, d.jsHeapSizeUsed);
      jsHeapMax = Math.max(jsHeapMax, d.jsHeapSizeUsed);
    }
    if (typeof d.documents === 'number') {
      documentsMin = Math.min(documentsMin, d.documents);
      documentsMax = Math.max(documentsMax, d.documents);
    }
    if (typeof d.nodes === 'number') {
      nodesMin = Math.min(nodesMin, d.nodes);
      nodesMax = Math.max(nodesMax, d.nodes);
    }
    if (typeof d.jsEventListeners === 'number') {
      listenersMin = Math.min(listenersMin, d.jsEventListeners);
      listenersMax = Math.max(listenersMax, d.jsEventListeners);
    }
  }

  if (!Number.isFinite(jsHeapMin)) {
    return null;
  }

  return {
    sampleCount: list.length,
    jsHeapMinBytes: jsHeapMin,
    jsHeapMaxBytes: jsHeapMax,
    jsHeapMinLabel: formatHeapMinBytesLabel(jsHeapMin),
    jsHeapMaxLabel: formatHeapMaxBytesLabel(jsHeapMax),
    documentsMin: Number.isFinite(documentsMin) ? documentsMin : null,
    documentsMax: Number.isFinite(documentsMax) ? documentsMax : null,
    nodesMin: Number.isFinite(nodesMin) ? nodesMin : null,
    nodesMax: Number.isFinite(nodesMax) ? nodesMax : null,
    listenersMin: Number.isFinite(listenersMin) ? listenersMin : null,
    listenersMax: Number.isFinite(listenersMax) ? listenersMax : null,
  };
}

export function parseTrace(traceJson) {
  const events = traceJson.traceEvents || [];

  // Find main renderer thread
  const mainThread = findMainRendererThread(events);

  if (!mainThread) {
    throw new Error('Could not find main renderer thread (CrRendererMain)');
  }

  // Compute trace bounds (DevTools MetaHandler logic)
  const traceBounds = computeTraceBounds(events);
  const traceBoundsUs = {
    min: traceBounds.minUs,
    max: traceBounds.maxUs,
    range: traceBounds.maxUs - traceBounds.minUs,
  };

  // Get ALL main thread events (ph=X with positive duration) for window calculation
  // This matches DevTools's topMostMainThreadAppender.getEntries() behavior
  const allMainThreadEntries = events.filter(e =>
    e.ph === 'X' && e.dur > 0 &&
    e.pid === mainThread.pid &&
    e.tid === mainThread.tid
  );

  // Calculate the auto-zoomed window using DevTools's MainThreadActivity.calculateWindow
  const windowUs = calculateWindow(traceBoundsUs, allMainThreadEntries);
  const windowMinMs = windowUs.min / 1000;
  const windowMaxMs = windowUs.max / 1000;
  const windowRangeMs = windowUs.range / 1000;

  // Filter to VISIBLE events only for stats computation
  const mainThreadEvents = events.filter(e =>
    e.ph === 'X' &&
    e.dur && e.dur > 0 &&
    e.pid === mainThread.pid &&
    e.tid === mainThread.tid &&
    isVisibleEvent(e)
  );

  if (mainThreadEvents.length === 0) {
    throw new Error('No visible events found for main thread');
  }

  // Calculate stats using DevTools algorithm with absolute ms timestamps
  const stats = statsForTimeRange(mainThreadEvents, windowMinMs, windowMaxMs);

  // Add ProfileCall scripting contribution from CPU profile synthesis
  // (SamplesIntegrator synthesizes ProfileCall events for non-idle CPU samples
  // that fall in gaps within RunTask intervals not covered by visible scripting events)
  const profileCallMs = computeProfileCallScripting(
    events, mainThread.pid, mainThread.tid,
    windowUs.min, windowUs.max
  );

  if (profileCallMs > 0) {
    stats.scripting = (stats.scripting || 0) + profileCallMs;
    stats.other = Math.max(0, (stats.other || 0) - profileCallMs);
    // Adjust idle (total non-idle increased by profileCallMs - profileCallMs = 0 change)
    // Actually no change needed since we moved time from other→scripting, both non-idle
  }

  const updateCounters = computeUpdateCountersRanges(events, mainThread);

  return {
    rangeStart: 0,
    rangeEnd: Math.round(windowRangeMs),
    categories: stats,
    total: Math.round(windowRangeMs),
    updateCounters,
    _debug: {
      mainThread,
      visibleEventCount: mainThreadEvents.length,
      allMainThreadEntries: allMainThreadEntries.length,
      traceStartMs: traceBounds.minMs,
      traceEndMs: traceBounds.maxMs,
      windowMinMs,
      windowMaxMs,
      windowRangeMs,
      profileCallMs,
      updateCountersSampleCount: updateCounters?.sampleCount ?? 0,
    }
  };
}

function mean(nums) {
  if (nums.length === 0) {
    return NaN;
  }

  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

/**
 * Aggregate multiple `parseTrace()` results (same test, different iterations).
 * Uses arithmetic mean for timeline categories, total range, and UpdateCounters
 * (mean of per-run min heap, mean of per-run max heap, etc.).
 */
export function averageParsedTraces(parsedResults) {
  if (!parsedResults?.length) {
    throw new Error('averageParsedTraces: need at least one parsed result');
  }
  const n = parsedResults.length;

  const catKeys = new Set();

  for (const r of parsedResults) {
    if (r.categories) {
      for (const k of Object.keys(r.categories)) {
        catKeys.add(k);
      }
    }
  }
  const categories = {};

  for (const k of catKeys) {
    const vals = parsedResults.map(r => r.categories?.[k]).filter(v => typeof v === 'number');

    categories[k] = mean(vals);
  }

  const rangeEnd = mean(parsedResults.map(r => r.rangeEnd));
  const total = mean(parsedResults.map(r => (r.total != null ? r.total : r.rangeEnd)));

  let updateCounters = null;
  const withUc = parsedResults.filter(r => r.updateCounters);

  if (withUc.length > 0) {
    const uc = withUc.map(r => r.updateCounters);
    const num = (fn) => {
      const vals = uc.map(fn).filter(v => typeof v === 'number' && !Number.isNaN(v));

      return vals.length ? mean(vals) : null;
    };
    const rnd = x => (x != null && Number.isFinite(x) ? Math.round(x) : null);
    const jsHeapMinBytes = num(u => u.jsHeapMinBytes);
    const jsHeapMaxBytes = num(u => u.jsHeapMaxBytes);

    updateCounters = {
      sampleCount: rnd(num(u => u.sampleCount)) ?? 0,
      jsHeapMinBytes,
      jsHeapMaxBytes,
      jsHeapMinLabel: formatHeapMinBytesLabel(jsHeapMinBytes),
      jsHeapMaxLabel: formatHeapMaxBytesLabel(jsHeapMaxBytes),
      documentsMin: rnd(num(u => u.documentsMin)),
      documentsMax: rnd(num(u => u.documentsMax)),
      nodesMin: rnd(num(u => u.nodesMin)),
      nodesMax: rnd(num(u => u.nodesMax)),
      listenersMin: rnd(num(u => u.listenersMin)),
      listenersMax: rnd(num(u => u.listenersMax)),
    };
  }

  return {
    rangeStart: 0,
    rangeEnd: Math.round(rangeEnd),
    total: Math.round(total),
    categories,
    updateCounters,
    runs: n,
    _debug: {
      averagedRuns: n,
    },
  };
}

/**
 * Read each path as JSON, run `parseTrace`, then `averageParsedTraces`.
 */
export function averageTraceFiles(filePaths) {
  const parsed = filePaths.map((fp) => {
    const text = fs.readFileSync(fp, 'utf8');

    return parseTrace(JSON.parse(text));
  });
  const agg = averageParsedTraces(parsed);

  return {
    ...agg,
    _debug: {
      ...agg._debug,
      files: filePaths,
    },
  };
}

export function formatOutput(stats, options = {}) {
  const { rangeStart, rangeEnd, categories, updateCounters, runs } = stats;
  const { full = false } = options;

  const round = v => Math.round(v || 0);

  if (runs != null) {
    console.log(`Average across ${runs} trace file(s)`);
    console.log('');
  }

  console.log(`Range: ${rangeStart} ms – ${rangeEnd} ms`);
  console.log('');
  console.log(`System      ${round(categories.other)} ms`);
  console.log(`Scripting   ${round(categories.scripting)} ms`);
  console.log(`Rendering   ${round(categories.rendering)} ms`);
  console.log(`Loading     ${round(categories.loading)} ms`);
  console.log(`Painting    ${round(categories.painting)} ms`);
  console.log(`Experience  ${round(categories.experience)} ms`);

  if (full || round(categories.messaging)) {
    console.log(`Messaging   ${round(categories.messaging)} ms`);
  }
  if (full || round(categories.gpu)) {
    console.log(`GPU         ${round(categories.gpu)} ms`);
  }
  if (full || round(categories.async)) {
    console.log(`Async       ${round(categories.async)} ms`);
  }
  console.log(`Idle        ${round(categories.idle)} ms`);
  console.log('');
  console.log(`Total       ${rangeEnd} ms`);

  if (updateCounters) {
    const u = updateCounters;

    console.log('');
    console.log(
      runs != null ? 'UpdateCounters (main frame, averaged)' : 'UpdateCounters (main frame)',
    );
    const cell = v => (v == null ? '—' : String(v));

    console.log(`Min JS heap     ${u.jsHeapMinLabel}`);
    console.log(`Max JS heap     ${u.jsHeapMaxLabel}`);
    console.log(`Min Documents   ${cell(u.documentsMin)}`);
    console.log(`Max Documents   ${cell(u.documentsMax)}`);
    console.log(`Min Nodes       ${cell(u.nodesMin)}`);
    console.log(`Max Nodes       ${cell(u.nodesMax)}`);
    console.log(`Min Listeners   ${cell(u.listenersMin)}`);
    console.log(`Max Listeners   ${cell(u.listenersMax)}`);
  }
}

const isMain =
  process.argv[1] &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;

if (isMain) {
  const args = process.argv.slice(2).filter(a => a !== '--debug' && a !== '--full');
  const paths = args.length > 0 ? args : ['./trace.json'];

  const stats =
    paths.length > 1 ? averageTraceFiles(paths) : parseTrace(JSON.parse(fs.readFileSync(paths[0], 'utf8')));

  if (process.argv.includes('--debug')) {
    console.log('Debug:', JSON.stringify(stats._debug, null, 2));
    console.log('');
  }

  formatOutput(stats, { full: process.argv.includes('--full') });
}
