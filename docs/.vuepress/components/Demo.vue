<template>
  <div class="example-container" style="height: 450px"></div>
</template>

<script>
/**
 * Given a base URL, transform a URL in a DOM node's attribute from a relative to an absolute value.
 *
 * @param {Node} sourceNode The DOM node from which to get the attribute value.
 * @param {Node} targetNode The DOM node to which set the attribute value.
 * @param {string} attrName The name of the attribute that contains a URL to be transformed.
 * @param {string} baseUrl The base URL that will be the basis of the relative to absolute transformation.
 */
function convertRelativeToAbsoluteAttributeUrl(sourceNode, targetNode, attrName, baseUrl) {
  const relUrl = sourceNode.getAttribute(attrName);
  const absUrl = new URL(relUrl, baseUrl);

  targetNode.setAttribute(attrName, absUrl);
}

export default {
  name: 'Demo',
  props: {
    fullVersionNumber: {
      required: true,
    },
    framework: {
      required: true, // expected values: js, react
    },
  },
  mounted() {
    const hostname = 'examples.handsontable.com';
    const url = `https://${hostname}/examples/${this.fullVersionNumber}/docs/${this.framework}/demo/index.html`;

    fetch(url)
      .then((response) => {
        return response.text();
      })
      .then((html) => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');

        const headNodes = Array.from(doc.head.childNodes).filter((node) => {
          if (node.nodeName === 'LINK' && node.rel === 'stylesheet') {
            convertRelativeToAbsoluteAttributeUrl(node, node, 'href', url);

            return true;
          }

          return false;
        });

        const bodyNodes = Array.from(doc.body.childNodes).map((node) => {
          if (node.nodeName === 'SCRIPT') {
            // scripts need to be cloned, otherwise Chrome refuses to run them
            const newNode = document.createElement('script');

            if (node.hasAttribute('src')) {
              convertRelativeToAbsoluteAttributeUrl(node, newNode, 'src', url);
            }
            newNode.innerText = node.innerText;

            return newNode;
          }

          return node;
        });

        this.$el.append(...headNodes, ...bodyNodes);
      })
      .catch((err) => {
        // eslint-disable-next-line no-console
        console.warn('Fetching the example failed.', err);
      });
  },
};
</script>
