export const PRIVATE_QUERY =
  /\b(full ic|identity card number|bank account number|account number|auth user id|password|token|home address|email address|phone number|receipt url|private document)\b/i;

export function refusesPrivateQuery(question: string) {
  return PRIVATE_QUERY.test(question);
}
