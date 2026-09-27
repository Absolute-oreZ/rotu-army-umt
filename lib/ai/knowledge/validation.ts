const RELATIVE_BASE = "https://rotu-local.invalid";

export function safeMarkdownHref(value: string) {
  const href = value.trim();
  if (!href || /[\\\u0000-\u001f\u007f]/u.test(href) || href.startsWith("//"))
    return null;
  try {
    const url = new URL(href, RELATIVE_BASE);
    // Only absolute-path destinations stay local. Bare or dotted relative paths
    // resolve against the placeholder base and must not become absolute links.
    if (url.origin === RELATIVE_BASE) return href.startsWith("/") ? href : null;
    if (url.protocol === "https:" && !url.username && !url.password)
      return url.href;
  } catch {
    return null;
  }
  return null;
}

export function validatePublicKnowledgeVersion(
  title: string,
  markdown: string,
) {
  if (!title.trim() || title.trim().length > 240)
    return "Enter a title between 1 and 240 characters.";
  if (!markdown.trim() || markdown.length > 80_000)
    return "Markdown must contain content and stay below 80,000 characters.";
  if (/\b\d{6}-\d{2}-\d{4}\b/u.test(markdown))
    return "Remove personal identity card numbers before saving public knowledge.";
  if (/\b[\w.+-]+@[\w.-]+\.[A-Z]{2,}\b/iu.test(markdown))
    return "Remove email addresses before saving public knowledge.";
  for (const match of markdown.matchAll(/\]\(([^)]+)\)/gu)) {
    const destination = match[1].trim();
    if (safeMarkdownHref(destination)) continue;
    return "Links must use a safe HTTPS or local destination.";
  }
  return null;
}
