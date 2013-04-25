## Learn the tech
### Why Pointer Events?

Mouse events and Touch events are fundamentally different beasts in browsers
today, and that makes it hard to write cross-platform apps.

For example, a simple finger paint app needs plenty of work to behave correctly
with mouse and touch:

Current platforms that implement touch events also provide mouse events for
backward compatibility; however, only a subset of mouse events are fired and the
semantics are changed.

- Mouse events are only fired after the touch sequence ends.
- Mouse events are not fired on elements without a click event handler. One must
  be attached by default, or directly on the element with “onclick”.
- Click events are not fired if the content of the page changes in a mousemove
  or mouseover event.
- Click events are fired 300ms after the touch sequence ends.
- More information: [Apple Developer Documentation](http://developer.apple.com/library/safari/#documentation/appleapplications/reference/safariwebcontent/HandlingEvents/HandlingEvents.html).

Additionally, Touch events are sent only to the element that received the
touchstart. This is fundamentally different than mouse events, which fire on the
element that is under the mouse. To make them behave similarly, touch events
need to be retargeted with `document.elementFromPoint`.

These incompatibilities lead to applications having to listen to 2 sets of events, mouse on
desktop and touch for mobile.

**This forked interaction experience is cumbersome and hard to maintain.**

Instead, there should exist a set of events that are normalized such that they
behave exactly the same, no matter the source: touch, mouse, stylus, skull
implant, etc. To do this right, this normalized event system needs to be
available for all the web platform to use.

*Thus, PointerEvents!*

### Basic Usage

By default, no PointerEvents are sent from an element. This maximizes possibility that a browser can deliver smooth scrolling and jank-free gestures. If you want to receive events, you must set the `touch-action` property of that element.

1. Set up some elements to create events with the `touch-action` attribute
  - `<div id="not-a-scroller" touch-action="none"></div>`
      - Generates events all the time, will not scroll
  - `<div id="horizontal-scroller" touch-action="pan-x">`
      - Generates events in the y axis, scrolls in the x axis
  - `<div id="vertical-scroller" touch-action="pan-y">`
      - Generates events in the x axis, scrolls in the y axis
  - `<div id="all-axis-scroller" touch-action="pan-x pan-y">`
      - Generates events only when tapping, scrolls otherwise
      - Can also have the value `pan-y pan-x` or `scroll`

1. Listen for the desired events
  - `pointermove`: a pointer moves, similar to touchmove or mousemove.
  - `pointerdown`: a pointer is activated, or a device button held.
  - `pointerup`: a pointer is deactivated, or a device button released.
  - `pointerover`: a pointer crosses into an element.
  - `pointerout`: a pointer leaves an element.
  - `pointercancel`: a pointer will no longer generate events.

1. As elements come and go, or have their `touch-action` attribute changed, they will send the proper set of PointerEvents.

## Polyfill Details
### Getting Started

1. Place the loader script in the document head
  - `<script src="PointerEvents/src/pointerevents.js"></script>`
1. Set up your event listeners
1. You're Done!

### Where can I use PointerEvents?

PointerEvents should work on all "Evergreen" (self-updating) browsers.

It has been tested on Chrome, Safari, Firefox, Opera, and IE 10.

## Polyfill Limitations
### touch-action

According to the spec, the
[touch-action](https://dvcs.w3.org/hg/pointerevents/raw-file/tip/pointerEvents.html#the-touch-action-css-property)
css property determines if an element will receive PointerEvents.
Specifically, only elements with the styling that have the `touch-action` value
of `none` will receive events.

Due to the difficult nature of polyfilling new CSS properties, this library will
use a touch-action *attribute* instead. In addition, run time changes involving
the `touch-action` attribute will be monitored for maximum flexibility.

### Browser Compatibility
#### Full Support
Chrome 18+, Safari 6+, IE 10, Firefox 14+
#### Partial Support
Opera 12+, does not support changes to `touch-action` attribute, nor added or removed elements
