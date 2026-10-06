import DOMPurify from "isomorphic-dompurify";

// SSR-safe sanitization (isomorphic-dompurify) for editor text content before
// it's stored or rendered — the stored-XSS vector for a malicious Template
// shown on another tenant's screen via the shared library.
export function sanitizeHtml(input: string): string {
  return DOMPurify.sanitize(input);
}
