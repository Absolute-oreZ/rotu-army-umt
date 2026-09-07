export type AssessmentGender = "MALE" | "FEMALE";

export type AssessmentRecordType = "UKA" | "APFA";

export type AssessmentItemUnit = "count" | "metres" | "seconds";

export type AssessmentStandard = {
  key: string;
  label: string;
  unit: AssessmentItemUnit;
  direction: "min" | "max";
  threshold: number;
};