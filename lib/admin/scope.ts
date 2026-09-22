import { takeNumber } from "@/lib/admin/form-helpers";

export function resolveScopedIntakeId(
  formData: FormData,
  intakeScope: number | null,
): { ok: true; intakeId: number } | { ok: false; error: string } {
  const rawIntakeId = takeNumber(formData.get("intakeId"));
  const effectiveIntakeId = intakeScope !== null ? intakeScope : rawIntakeId;

  if (effectiveIntakeId === null || !Number.isInteger(effectiveIntakeId) || effectiveIntakeId <= 0) {
    return { ok: false, error: "Valid intake is required." };
  }

  if (intakeScope !== null && rawIntakeId !== null && rawIntakeId !== intakeScope) {
    return { ok: false, error: "You can only manage data from your intake." };
  }

  return { ok: true, intakeId: effectiveIntakeId };
}

export function assertIntakeOwnership(
  rowIntakeId: number,
  intakeScope: number | null,
): string | null {
  if (intakeScope !== null && rowIntakeId !== intakeScope) {
    return "You can only manage data from your intake.";
  }
  return null;
}