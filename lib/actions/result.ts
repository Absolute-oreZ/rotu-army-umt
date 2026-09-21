export type ActionResult<T = undefined> =
  | { success: true; data?: T }
  | { success: false; error: string };

export function ok<T>(data?: T): ActionResult<T> {
  return { success: true, data };
}

export function err(error: string): ActionResult<never> {
  return { success: false, error };
}

export function isSuccess<T>(result: ActionResult<T>): result is { success: true; data?: T } {
  return result.success;
}

export function isFailure<T>(result: ActionResult<T>): result is { success: false; error: string } {
  return !result.success;
}

export function unwrap<T>(result: ActionResult<T>): T | never {
  if (result.success) {
    return result.data ?? (undefined as T);
  }
  throw new Error(result.error);
}