/**
 * The module provides functionality to announce custom messages to assistive technologies.
 */
let announcerElement = null;
let installCounter = 0;

/**
 * Installs the a11y announcer element into the provided root portal element. For each new Handsontable
 * instance only one announcer element is created, so it can be reused across multiple instances.
 *
 * @param {HTMLElement} rootPortalElement The root element where the announcer will be installed.
 */
export function install(rootPortalElement) {
  const document = rootPortalElement.ownerDocument;

  if (!announcerElement) {
    announcerElement = document.createElement('div');
    announcerElement.setAttribute('role', 'status');
    announcerElement.setAttribute('aria-live', 'assertive');
    announcerElement.setAttribute('aria-atomic', 'true');

    const style = announcerElement.style;

    style.position = 'absolute';
    style.width = '1px';
    style.height = '1px';
    style.margin = '-1px';
    style.overflow = 'hidden';
    style.clipPath = 'rect(0 0 0 0)';
    style.whiteSpace = 'nowrap';

    rootPortalElement.appendChild(announcerElement);
  }

  installCounter += 1;
}

/**
 * Uninstalls the a11y announcer element if it was installed.
 */
export function uninstall() {
  if (installCounter === 0) {
    return;
  }

  if (installCounter === 1) {
    announcerElement.remove();
    announcerElement = null;
  }

  installCounter -= 1;
}

/**
 * Announces a message to assistive technologies by updating the content of the a11y announcer element.
 *
 * @param {string} message The message to announce.
 */
export function announce(message) {
  if (!announcerElement) {
    return;
  }

  // The value needs to be cleared first to ensure that screen readers announce the new message.
  announcerElement.textContent = '';

  setTimeout(() => {
    if (announcerElement) {
      announcerElement.textContent = message;
    }
  }, 100);
}
