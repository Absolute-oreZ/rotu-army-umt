/**
 * Extracts the PostgreSQL error code from a caught error.
 * Handles both raw pg errors and Drizzle-wrapped errors.
 */
export function getDatabaseErrorCode(error: unknown): string | null {
  if (error instanceof Error) {
    // Check if it's a pg error with code property
    const pgError = error as { code?: string };
    if (pgError.code) return pgError.code;
    
    // Check if error has a cause that's a pg error
    if (error.cause && typeof error.cause === "object" && "code" in error.cause) {
      return (error.cause as { code: string }).code;
    }
  }
  
  // Check if it's a Drizzle error with pg error inside
  if (error && typeof error === "object" && "cause" in error) {
    const cause = (error as { cause: unknown }).cause;
    if (cause instanceof Error && "code" in cause) {
      return (cause as { code: string }).code;
    }
    if (cause && typeof cause === "object" && "code" in cause) {
      return (cause as { code: string }).code;
    }
  }
  
  return null;
}

/**
 * Checks if the error is a unique constraint violation (PostgreSQL error code 23505).
 */
export function isUniqueViolation(error: unknown): boolean {
  return getDatabaseErrorCode(error) === "23505";
}

/**
 * User-friendly error messages for common database errors.
 * Never exposes raw SQL or query parameters to the client.
 */
export function getDatabaseErrorMessage(error: unknown): string {
  const code = getDatabaseErrorCode(error);
  
  switch (code) {
    case "23505":
      return "A record with this value already exists.";
    case "23503":
      return "Referenced record does not exist.";
    case "23514":
      return "Input violates a constraint.";
    case "23502":
      return "Required field is missing.";
    case "42P01":
      return "Database configuration error.";
    case "42703":
      return "Database schema error.";
    case "22001":
      return "Input value is too long.";
    case "22003":
      return "Numeric value out of range.";
    case "08000":
    case "08003":
    case "08006":
      return "Database connection error. Please try again.";
    case "40001":
      return "Transaction conflict. Please retry.";
    case "53300":
      return "Too many database connections. Please try again later.";
    default:
      return "A database error occurred. Please try again.";
  }
}

/**
 * Safely logs database errors server-side without exposing sensitive data.
 */
export function logDatabaseError(context: string, error: unknown): void {
  const code = getDatabaseErrorCode(error);
  const message = error instanceof Error ? error.message : "Unknown error";
  
  // Log structured error without sensitive details
  console.error(`[DB Error] ${context}`, {
    code,
    message: message.substring(0, 200), // Truncate long messages
    timestamp: new Date().toISOString(),
  });
}