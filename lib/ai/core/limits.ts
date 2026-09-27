export const AI_LIMITS = {
  publicMessageCharacters: 1500,
  adminMessageCharacters: 1500,
  conversationTurns: 6,
  conversationMessageCharacters: 1500,
  // Must stay above the worst-case conversation payload: conversationTurns * 2
  // messages x conversationMessageCharacters, in UTF-8 bytes (CJK is 3 bytes per
  // character). This is a defense-in-depth ceiling, not the primary limit.
  maxRequestBytes: 64_000,
  providerMaxAttempts: 2,
  publicChunks: 5,
  maxToolCallsPerTurn: 1,
  maxRows: 100,
  publicMaxOutputTokens: 650,
  adminMaxOutputTokens: 500,
} as const;
