import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  OUTPUT_STEP_BOUNDARY,
  PHRASE_SEPARATOR,
  READ_LAST_PHRASE,
  STEP_BOUNDARY,
  isStepBoundary,
  stripStepBoundary,
  voiceOverAppleScript,
} from '../screenreader-voiceover.mjs';
import { normalizeAnnouncement } from '../screenreader-transcript.mjs';

// tests/AGENTS.md ("Screen readers: the NVDA and VoiceOver lanes"): VoiceOver keeps its last phrase, so
// the reader speaks a step boundary before every step and removes it from what the capture read. A
// boundary that stays in a transcript reads as speech VoiceOver never made about the grid, and a
// boundary that also removes a real phrase hides speech it did make; both would be false evidence.

test('the step boundary is two plain words, and the scripts speak and read it inside VoiceOver', () => {
  assert.equal(STEP_BOUNDARY, 'Step boundary');
  assert.equal(PHRASE_SEPARATOR, '. ', 'the separator Guidepup joins the phrases of one VoiceOver capture with');
  assert.equal(OUTPUT_STEP_BOUNDARY, 'output "Step boundary"');
  assert.equal(READ_LAST_PHRASE, 'with transaction\nreturn content of last phrase\nend transaction');
  assert.equal(voiceOverAppleScript(OUTPUT_STEP_BOUNDARY), 'tell application "VoiceOver"\noutput "Step boundary"\nend tell');
});

test('isStepBoundary reads the boundary back whatever its case, whitespace or closing full stop', () => {
  ['Step boundary', 'step boundary', '  Step boundary  ', 'Step boundary.', 'STEP BOUNDARY'].forEach((phrase) => {
    assert.equal(isStepBoundary(phrase), true, JSON.stringify(phrase));
  });
  ['', 'missing value', 'Step', 'boundary', 'Step boundary reached', 'Alice, Name, row 2', undefined, null].forEach((phrase) => {
    assert.equal(isStepBoundary(phrase), false, JSON.stringify(phrase));
  });
});

test('stripStepBoundary turns a capture of the boundary alone into silence', () => {
  assert.equal(stripStepBoundary('Step boundary'), '');
  assert.equal(stripStepBoundary('Step boundary. Step boundary'), '');
  assert.equal(stripStepBoundary(''), '');
  assert.equal(stripStepBoundary(undefined), '');
});

test('stripStepBoundary keeps every phrase the step spoke, in order, wherever the boundary sat', () => {
  assert.equal(stripStepBoundary('Step boundary. Alice, Name, row 2 of 6'), 'Alice, Name, row 2 of 6');
  assert.equal(stripStepBoundary('Alice, Name. Step boundary'), 'Alice, Name');
  assert.equal(stripStepBoundary('Insert row above, menu item. Step boundary. menu'), 'Insert row above, menu item. menu');
  assert.equal(stripStepBoundary('Alice, Name, row 2 of 6'), 'Alice, Name, row 2 of 6', 'a capture without the boundary is unchanged');
});

test('stripStepBoundary removes the boundary only as a whole phrase', () => {
  assert.equal(stripStepBoundary('Step boundary reached. Alice'), 'Step boundary reached. Alice');
  assert.equal(stripStepBoundary('The step boundary. Alice'), 'The step boundary. Alice');
  assert.equal(stripStepBoundary('34. Step boundary. 5'), '34. 5', 'a phrase split at a full stop is joined back as it was');
});

test('a stripped capture normalizes like a capture that never had the boundary', () => {
  assert.equal(normalizeAnnouncement(stripStepBoundary('Step boundary. Alice, Name, row 2 of 6, column 2 of 4')),
    normalizeAnnouncement('Alice, Name, row 2 of 6, column 2 of 4'));
  assert.equal(normalizeAnnouncement('Step boundary').includes('step boundary'), true,
    'the normalizer does not drop the boundary on its own: the reader must strip it before the transcript');
});
