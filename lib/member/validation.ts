const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const EDU_DOMAIN = "ocean.umt.edu.my";

export function isValidPersonalEmail(email: string): boolean {
  const value = email.trim().toLowerCase();
  if (!EMAIL_RE.test(value)) return false;
  return value.split("@")[1] !== EDU_DOMAIN;
}

export function isValidEduEmail(email: string): boolean {
  const value = email.trim().toLowerCase();
  if (!EMAIL_RE.test(value)) return false;
  return value.split("@")[1] === EDU_DOMAIN;
}

export function normalizeEmail(email: string | null | undefined): string {
  return email?.trim().toLowerCase() ?? "";
}