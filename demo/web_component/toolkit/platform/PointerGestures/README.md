# Pointer Gestures
> Rich gestures that work on both desktop and mobile

PointerGestures uses PointerEvents to make useful gestures for application
development.

## Events

Included events are:
- `tap` - a pointer moves down and up quickly, preventable with
  `<pointerevent>.preventTap`
- `hold` - a pointer is held down
- `holdpulse` - fires on an interval while the pointer is held down
- `release` - a held pointer is released
- `flick` - a primary pointer moved quickly across the screen, and was released
- `trackstart` - a primary pointer has started moving away from it's inital
  start point
- `track` - a primary pointer continues to move, targets the element that
  received `trackstart`
- `trackend` - a primary pointer has been released, targets the element that
  received `trackstart`

## Installation

1. Check out the submodule for PointerEvents, and PointerEvents' necessary
submodules. (`git submodule update --init --recursive`).

2. Include PointerGestures/src/pointergestures in your page.

3. PointerGestures will automatically include PointerEvents.

4. Set the `touch-action` of a few elements and see the events fire!
