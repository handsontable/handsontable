/**
 * The module provides functionality to announce custom messages to assistive technologies.
 */
let announcerElement: HTMLElement | null = null;
let politeAnnouncerElement: HTMLElement | null = null;
let installCounter = 0;

/**
 * How urgently an announcement interrupts the screen reader. `assertive` interrupts the current
 * speech, `polite` waits for the screen reader to finish.
 */
export type AnnouncementPoliteness = 'assertive' | 'polite';

/**
 * Creates a visually hidden live region.
 *
 * @param {Document} document The document to create the element in.
 * @param {AnnouncementPoliteness} politeness The value of the `aria-live` attribute.
 * @returns {HTMLElement}
 */
function createLiveRegion(document: Document, politeness: AnnouncementPoliteness): HTMLElement {
  const element = document.createElement('div');

  element.setAttribute('role', 'status');
  element.setAttribute('aria-live', politeness);
  element.setAttribute('aria-atomic', 'true');

  const style = element.style;

  style.position = 'absolute';
  style.width = '1px';
  style.height = '1px';
  style.margin = '-1px';
  style.overflow = 'hidden';
  style.clipPath = 'rect(0 0 0 0)';
  style.whiteSpace = 'nowrap';

  return element;
}

/**
 * Installs the a11y announcer element into the provided root portal element. For each new Handsontable
 * instance only one announcer element is created, so it can be reused across multiple instances.
 *
 * @param {HTMLElement} rootPortalElement The root element where the announcer will be installed.
 */
export function install(rootPortalElement: HTMLElement) {
  const document = rootPortalElement.ownerDocument;

  if (!announcerElement) {
    announcerElement = createLiveRegion(document, 'assertive');
    rootPortalElement.appendChild(announcerElement);
  }

  installCounter += 1;
}

/**
 * Uninstalls the a11y announcer elements (the assertive one, and the polite one when it was created)
 * once the last instance that installed them is gone.
 */
export function uninstall() {
  if (installCounter === 0) {
    return;
  }

  if (installCounter === 1) {
    announcerElement!.remove();
    announcerElement = null;
    politeAnnouncerElement?.remove();
    politeAnnouncerElement = null;
  }

  installCounter -= 1;
}

/**
 * Returns the live region for the given politeness. The polite region is created on its first use,
 * next to the assertive one, so a page that never announces politely carries a single element.
 *
 * @param {AnnouncementPoliteness} politeness The politeness of the announcement.
 * @returns {HTMLElement|null}
 */
function getLiveRegion(politeness: AnnouncementPoliteness): HTMLElement | null {
  if (!announcerElement || politeness === 'assertive') {
    return announcerElement;
  }

  if (!politeAnnouncerElement) {
    politeAnnouncerElement = createLiveRegion(announcerElement.ownerDocument, 'polite');
    announcerElement.after(politeAnnouncerElement);
  }

  return politeAnnouncerElement;
}

/**
 * Announces a message to assistive technologies by updating the content of the a11y announcer element.
 *
 * @param {string} message The message to announce.
 * @param {AnnouncementPoliteness} [politeness='assertive'] `polite` waits for the screen reader to
 * finish what it is reading, which suits a confirmation of an action the user just took.
 */
export function announce(message: string, politeness: AnnouncementPoliteness = 'assertive') {
  const liveRegion = getLiveRegion(politeness);

  if (!liveRegion) {
    return;
  }

  // The value needs to be cleared first to ensure that screen readers announce the new message.
  liveRegion.textContent = '';

  setTimeout(() => {
    if (liveRegion === announcerElement || liveRegion === politeAnnouncerElement) {
      liveRegion.textContent = message;
    }
  }, 100);
}
