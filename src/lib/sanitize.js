const DANGEROUS_TAGS = new Set(['script', 'iframe', 'object', 'embed', 'link', 'style', 'meta', 'base']);

const EVENT_PATTERN = /^on/i;

export function sanitizeHtml(html) {
  if (!html) return '';
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const walk = (node) => {
    let i = node.children.length;
    while (i--) {
      const el = node.children[i];
      if (DANGEROUS_TAGS.has(el.tagName.toLowerCase())) {
        el.remove();
        continue;
      }
      for (const attr of [...el.attributes]) {
        if (EVENT_PATTERN.test(attr.name)) {
          el.removeAttribute(attr.name);
        } else if (attr.value.toLowerCase().startsWith('javascript:')) {
          el.removeAttribute(attr.name);
        }
      }
      walk(el);
    }
  };
  walk(doc.body);
  return doc.body.innerHTML;
}
