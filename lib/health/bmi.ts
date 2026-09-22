export type BMIClassification = "UNDERWEIGHT" | "NORMAL" | "OVERWEIGHT" | "OBESE";

export function calculateBMI(heightM: number, weightKg: number): number | null {
  if (!Number.isFinite(heightM) || !Number.isFinite(weightKg)) return null;
  if (heightM <= 0 || weightKg <= 0) return null;
  const bmi = Math.round((weightKg / (heightM * heightM)) * 100) / 100;
  if (bmi < 12 || bmi > 60) return null;
  return bmi;
}

export function getBMIClassification(bmi: number | null): BMIClassification | null {
  if (bmi === null) return null;
  if (bmi < 18.5) return "UNDERWEIGHT";
  if (bmi < 25) return "NORMAL";
  if (bmi < 30) return "OVERWEIGHT";
  return "OBESE";
}