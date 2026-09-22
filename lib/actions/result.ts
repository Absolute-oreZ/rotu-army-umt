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
