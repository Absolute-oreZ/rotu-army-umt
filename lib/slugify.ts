export function slugify(text: string): string {
  // Handle non-Latin scripts by preserving them if they don't contain Latin characters
  const hasLatinChars = /[a-zA-Z]/.test(text);
  
  if (!hasLatinChars) {
    // For pure non-Latin text, create a slug from unicode code points
    return text
      .trim()
      .toLowerCase()
      .replace(/[\s_]+/g, "-")
      .replace(/[^\p{L}\p{N}-]+/gu, "")  // Keep letters, numbers, hyphens
      .replace(/-+/g, "-")
      .replace(/^-+|-+$/g, "")
      || "tag"; // fallback if all chars stripped
  }
  
  // Standard Latin slugify
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}
