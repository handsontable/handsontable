/**
 * The module provides functionality to announce custom messages to assistive technologies.
 */
let announcerElement: HTMLElement | null = null;
let politeAnnouncerElement: HTMLElement | null = null;
const installedPortals: HTMLElement[] = [];

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
 * Installs the a11y announcer elements (an assertive and a polite live region) into the provided root
 * portal element. Only one pair is created, so it is reused across multiple Handsontable instances.
 * Both regions exist before anything is announced through them, because some screen readers ignore
 * the first update of a live region that was added to the page a moment earlier.
 *
 * @param {HTMLElement} rootPortalElement The root element where the announcer will be installed.
 */
export function install(rootPortalElement: HTMLElement) {
  const document = rootPortalElement.ownerDocument;

  if (!announcerElement) {
    announcerElement = createLiveRegion(document, 'assertive');
    politeAnnouncerElement = createLiveRegion(document, 'polite');
    rootPortalElement.append(announcerElement, politeAnnouncerElement);
  }

  installedPortals.push(rootPortalElement);
}

/**
 * Uninstalls the a11y announcer elements once the last instance that installed them is gone.
 *
 * The regions live in the portal of the instance that installed them first, and that portal is
 * removed when its instance is destroyed. When other instances remain, the regions move to the
 * portal of one of them, so an announcement made later still reaches the document.
 *
 * @param {HTMLElement} [rootPortalElement] The root portal element of the instance being destroyed.
 * Without it, the most recent installation is released. A portal that never installed the
 * announcer - a grid destroyed before its initialization reached `install()` - releases nothing.
 */
export function uninstall(rootPortalElement?: HTMLElement) {
  if (installedPortals.length === 0) {
    return;
  }

  const index = rootPortalElement ? installedPortals.lastIndexOf(rootPortalElement) : installedPortals.length - 1;

  if (index === -1) {
    return;
  }

  installedPortals.splice(index, 1);

  if (installedPortals.length === 0) {
    announcerElement!.remove();
    announcerElement = null;
    politeAnnouncerElement!.remove();
    politeAnnouncerElement = null;

    return;
  }

  const currentPortal = announcerElement!.parentElement;

  if (!currentPortal || !installedPortals.includes(currentPortal)) {
    installedPortals[0].append(announcerElement!, politeAnnouncerElement!);
  }
}

/**
 * Announces a message to assistive technologies by updating the content of the a11y announcer element.
 *
 * @param {string} message The message to announce.
 * @param {AnnouncementPoliteness} [politeness='assertive'] `polite` waits for the screen reader to
 * finish what it is reading, which suits a confirmation of an action the user just took.
 */
export function announce(message: string, politeness: AnnouncementPoliteness = 'assertive') {
  const liveRegion = politeness === 'polite' ? politeAnnouncerElement : announcerElement;

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
