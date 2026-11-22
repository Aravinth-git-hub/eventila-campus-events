// Validation and sanitization helpers for Eventila

export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const PHONE_REGEX = /^[+]?[\d\s()-]{7,20}$/;

export function isValidEmail(email: string): boolean {
  return EMAIL_REGEX.test(email.trim());
}

export function isValidPhone(phone: string): boolean {
  return PHONE_REGEX.test(phone.trim());
}

export interface PasswordValidationResult {
  valid: boolean;
  message: string | null;
}

export function validatePasswordStrength(password: string): PasswordValidationResult {
  if (!password || password.length < 8) {
    return { valid: false, message: 'Password must be at least 8 characters long.' };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: 'Password must include at least one uppercase letter.' };
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, message: 'Password must include at least one lowercase letter.' };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, message: 'Password must include at least one number.' };
  }
  if (!/[^A-Za-z0-9]/.test(password)) {
    return { valid: false, message: 'Password must include at least one special character.' };
  }
  return { valid: true, message: null };
}

/**
 * Sanitizes event HTML descriptions using a strict tag/attribute allowlist
 * to prevent script injection while preserving safe formatting.
 */
const ALLOWED_TAGS = new Set([
  'p', 'br', 'strong', 'b', 'em', 'i', 'u', 'ul', 'ol', 'li',
  'h1', 'h2', 'h3', 'h4', 'blockquote', 'code', 'pre', 'a', 'span', 'div'
]);

const ALLOWED_ATTRS = new Set(['href', 'target', 'rel', 'class']);

export function sanitizeHtml(dirtyHtml: string): string {
  if (!dirtyHtml) return '';
  if (typeof window === 'undefined' || typeof DOMParser === 'undefined') {
    return dirtyHtml.replace(/<[^>]*>/g, '');
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(dirtyHtml, 'text/html');

  const cleanNode = (node: Node) => {
    const children = Array.from(node.childNodes);
    for (const child of children) {
      if (child.nodeType === Node.ELEMENT_NODE) {
        const el = child as Element;
        const tagName = el.tagName.toLowerCase();

        if (!ALLOWED_TAGS.has(tagName)) {
          // Replace disallowed elements like script/iframe/object/style completely or unwrap safe text
          if (tagName === 'script' || tagName === 'style' || tagName === 'iframe' || tagName === 'object' || tagName === 'embed') {
            el.remove();
            continue;
          }
          // Unwrap other unknown tags while keeping sanitized children
          cleanNode(el);
          const frag = doc.createDocumentFragment();
          while (el.firstChild) {
            frag.appendChild(el.firstChild);
          }
          el.replaceWith(frag);
          continue;
        }

        // Strip disallowed attributes and dangerous URL protocols
        for (const attr of Array.from(el.attributes)) {
          const attrName = attr.name.toLowerCase();
          if (!ALLOWED_ATTRS.has(attrName) || attrName.startsWith('on')) {
            el.removeAttribute(attr.name);
            continue;
          }
          if (attrName === 'href') {
            const val = attr.value.trim().toLowerCase();
            if (!val.startsWith('http://') && !val.startsWith('https://') && !val.startsWith('mailto:')) {
              el.removeAttribute('href');
            } else {
              el.setAttribute('rel', 'noopener noreferrer');
              el.setAttribute('target', '_blank');
            }
          }
        }

        cleanNode(el);
      }
    }
  };

  cleanNode(doc.body);
  return doc.body.innerHTML;
}
