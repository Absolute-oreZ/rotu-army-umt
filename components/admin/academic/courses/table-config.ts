import { cadets, intakes, members, studyPrograms } from "@/db/schema";
import { CADET_RANK_FILTER_OPTIONS, type FilterColumn, type IntakeOption, type TableConfig } from "@/lib/admin/table-search-params";

export type CourseOption = {
  value: string;
  label: string;
};

export function buildCadetCoursesTableConfig(options?: {
  intakeOptions?: IntakeOption[];
  courseOptions?: CourseOption[];
  prefix?: string;
  enableGpaFilters?: boolean;
}): TableConfig {
  const filterColumns: FilterColumn[] = [CADET_RANK_FILTER_OPTIONS];

  if (options?.intakeOptions && options.intakeOptions.length > 0) {
    filterColumns.push({
      key: "intakeNo",
      label: "Intake",
      type: "enum",
      options: options.intakeOptions,
    });
  }

  if (options?.courseOptions && options.courseOptions.length > 0) {
    filterColumns.push({
      key: "course",
      label: "Course",
      type: "enum",
      options: options.courseOptions,
    });
  }

  if (options?.enableGpaFilters) {
    filterColumns.push(
      {
        key: "gpa",
        label: "GPA",
        type: "number",
      },
      {
        key: "cgpa",
        label: "CGPA",
        type: "number",
      }
    );
  }

  return {
    prefix: options?.prefix,
    defaults: {
      q: "",
      sortRules: [{ columnKey: "name", direction: "asc" }],
      page: 1,
      pageSize: 10,
      filters: {},
    },
    sortKeys: ["name", "armyNo", "rank", "matricNo", "course", "intakeNo", "gpa", "cgpa"],
    sortLabels: {
      name: "Name",
      armyNo: "Army No",
      rank: "Rank",
      matricNo: "Matric No",
      course: "Course",
      intakeNo: "Intake",
      gpa: "GPA",
      cgpa: "CGPA",
    },
    filterColumns,
    pageSizeOptions: [10, 25, 50],
    editMode: "INLINE",
  };
}

export const CADET_COURSES_SORT_FIELD_MAP = {
  name: members.name,
  armyNo: members.armyNo,
  rank: members.rank,
  matricNo: cadets.matricNo,
  course: studyPrograms.name,
  intakeNo: intakes.intakeNo,
  gpa: cadets.cgpa,
  cgpa: cadets.cgpa,
} as const;

export function buildCoursesManagementTableConfig(prefix?: string): TableConfig {
  return {
    prefix,
    defaults: {
      q: "",
      sortRules: [{ columnKey: "name", direction: "asc" }],
      page: 1,
      pageSize: 10,
      filters: {},
    },
    sortKeys: ["name", "completionYear", "isSupported"],
    sortLabels: {
      name: "Course Name",
      completionYear: "Years to Complete",
      isSupported: "Supported Status",
    },
    filterColumns: [
      {
        key: "isSupported",
        label: "Status",
        type: "enum",
        options: [
          { value: "true", label: "Supported" },
          { value: "false", label: "Unsupported" },
        ],
      },
    ],
    pageSizeOptions: [10, 25, 50],
    editMode: "INLINE",
  };
}

export const COURSES_SORT_FIELD_MAP = {
  name: studyPrograms.name,
  completionYear: studyPrograms.completionYear,
  isSupported: studyPrograms.isSupported,
} as const;