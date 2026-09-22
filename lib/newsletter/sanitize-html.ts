import { parse, HTMLElement } from "node-html-parser";

export interface SanitizeOptions {
  allowedTags?: string[];
  allowedAttributes?: Record<string, string[]>;
  allowedSchemes?: string[];
}

const DEFAULT_ALLOWED_TAGS = [
  "p",
  "br",
  "strong",
  "b",
  "em",
  "i",
  "u",
  "ul",
  "ol",
  "li",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "blockquote",
  "a",
  "img",
  "table",
  "thead",
  "tbody",
  "tr",
  "th",
  "td",
  "div",
  "span",
  "hr",
  "pre",
  "code",
];

const DEFAULT_ALLOWED_ATTRIBUTES: Record<string, string[]> = {
  a: ["href", "title", "target", "rel"],
  img: ["src", "alt", "title", "width", "height"],
  th: ["colspan", "rowspan"],
  td: ["colspan", "rowspan"],
  "*": ["style", "class", "id"],
};

const DEFAULT_ALLOWED_SCHEMES = ["http:", "https:", "mailto:"];

const DANGEROUS_TAGS = [
  "script",
  "iframe",
  "object",
  "embed",
  "form",
  "input",
  "button",
  "select",
  "textarea",
  "style",
  "link",
  "meta",
  "base",
  "applet",
  "frameset",
  "frame",
  "noscript",
];

const DANGEROUS_ATTR_PATTERNS = [
  /^on\w+$/i, // onclick, onerror, onload, etc.
  /^data:/i, // data: URLs
  /^javascript:/i,
  /^vbscript:/i,
  /^expression\s*\(/i, // CSS expression()
];

function normalizeUrlValue(value: string): string {
  return value.toLowerCase().replace(/[\s\u0000-\u001f\u007f]+/g, "");
}

function isDangerousUrlValue(value: string): boolean {
  const stripped = normalizeUrlValue(value);
  return (
    stripped.includes("javascript:") ||
    stripped.includes("vbscript:") ||
    stripped.includes("data:") ||
    stripped.startsWith("//")
  );
}

function isSafeAttribute(name: string, value: string): boolean {
  const lowerName = name.toLowerCase();

  // Block dangerous attribute names
  for (const pattern of DANGEROUS_ATTR_PATTERNS) {
    if (pattern.test(lowerName)) return false;
  }

  // Block dangerous attribute values, including whitespace-obfuscated payloads
  const lowerValue = value.toLowerCase().trim();
  const stripped = normalizeUrlValue(value);
  for (const pattern of DANGEROUS_ATTR_PATTERNS) {
    if (pattern.test(lowerValue) || pattern.test(stripped)) return false;
  }

  return true;
}

function isAllowedScheme(url: string, allowedSchemes: string[]): boolean {
  try {
    const parsed = new URL(url);
    return allowedSchemes.some((scheme) => parsed.protocol === scheme);
  } catch {
    // Relative URLs are allowed unless they hide a dangerous scheme or are scheme-relative
    return !isDangerousUrlValue(url);
  }
}

function sanitizeStyle(style: string): string {
  // Remove dangerous CSS patterns
  let sanitized = style
    .replace(/expression\s*\([^)]*\)/gi, "")
    .replace(/url\s*\(\s*["']?\s*(javascript|data|vbscript):[^"')]*["']?\s*\)/gi, "")
    .replace(/behavior\s*:\s*url\s*\([^)]*\)/gi, "")
    .replace(/-moz-binding\s*:\s*url\s*\([^)]*\)/gi, "");

  // Remove any remaining javascript: or data: in style
  sanitized = sanitized.replace(/(javascript|data|vbscript)\s*:/gi, "");

  return sanitized;
}

export function sanitizeHtml(html: string, options: SanitizeOptions = {}): string {
  if (!html || typeof html !== "string") return "";

  const allowedTags = new Set(options.allowedTags ?? DEFAULT_ALLOWED_TAGS);
  const allowedAttributes = options.allowedAttributes ?? DEFAULT_ALLOWED_ATTRIBUTES;
  const allowedSchemes = options.allowedSchemes ?? DEFAULT_ALLOWED_SCHEMES;

  const root = parse(html, {
    lowerCaseTagName: true,
    comment: false,
    blockTextElements: {
      script: true,
      style: true,
      noscript: true,
      pre: true,
    },
  });

  function processNode(node: HTMLElement) {
    // Handle text nodes
    if (node.nodeType === 3) {
      return;
    }

    // Handle element nodes
    if (node.nodeType === 1) {
      const tagName = node.tagName.toLowerCase();

      // Remove dangerous tags entirely
      if (DANGEROUS_TAGS.includes(tagName)) {
        node.remove();
        return;
      }

      // Remove disallowed tags (but keep their children)
      if (!allowedTags.has(tagName)) {
        const parent = node.parentNode;
        if (parent && "insertBefore" in parent) {
          while (node.firstChild) {
            // @ts-expect-error - parent has insertBefore due to "insertBefore" in parent check
            parent.insertBefore(node.firstChild, node);
          }
          node.remove();
        }
        return;
      }

      // Sanitize attributes
      const attrs = node.attributes;
      for (const [name, value] of Object.entries(attrs as Record<string, unknown>)) {
        if (typeof value !== "string") {
          if (value == null) {
            node.removeAttribute(name);
          }
          continue;
        }
        if (!isSafeAttribute(name, value)) {
          node.removeAttribute(name);
          continue;
        }

        const lowerName = name.toLowerCase();
        const tagAllowedAttrs = allowedAttributes[tagName] ?? [];
        const globalAllowedAttrs = allowedAttributes["*"] ?? [];
        const isAllowed = tagAllowedAttrs.includes(name) || globalAllowedAttrs.includes(name) || lowerName === "style";

        if (!isAllowed) {
          node.removeAttribute(name);
          continue;
        }

        // Special handling for href/src
        if ((lowerName === "href" || lowerName === "src") && typeof value === "string") {
          if (!isAllowedScheme(value, allowedSchemes)) {
            node.removeAttribute(name);
            continue;
          }
          // Force safe target/rel for external links
          if (lowerName === "href") {
            try {
              const parsed = new URL(value);
              if (parsed.protocol === "http:" || parsed.protocol === "https:") {
                node.setAttribute("target", "_blank");
                node.setAttribute("rel", "noopener noreferrer");
              }
            } catch {
              // Relative URL, no action needed
            }
          }
        }

        // Sanitize style attribute
        if (lowerName === "style" && typeof value === "string") {
          node.setAttribute("style", sanitizeStyle(value));
        }
      }
    }

    // Process children
    for (const child of node.childNodes) {
      if (child.nodeType === 1) {
        processNode(child as HTMLElement);
      } else if (child.nodeType === 3) {
        // Text nodes are handled at the start of processNode
      }
    }
  }

  processNode(root);
  return root.innerHTML;
}

export function sanitizeHtmlForEmail(html: string): string {
  // More restrictive for email - no tables, no forms, limited styles
  return sanitizeHtml(html, {
    allowedTags: [
      "p",
      "br",
      "strong",
      "b",
      "em",
      "i",
      "u",
      "ul",
      "ol",
      "li",
      "h1",
      "h2",
      "h3",
      "h4",
      "h5",
      "h6",
      "blockquote",
      "a",
      "img",
      "div",
      "span",
      "hr",
      "pre",
      "code",
    ],
    allowedAttributes: {
      a: ["href", "title", "target", "rel"],
      img: ["src", "alt", "title", "width", "height"],
      "*": ["style", "class", "id"],
    },
    allowedSchemes: ["http:", "https:", "mailto:"],
  });
}