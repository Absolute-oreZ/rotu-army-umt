"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useIsMobile } from "@/lib/hooks/use-mobile";
import {
  CadetCoursesTable,
  type CadetCourseRow,
} from "./cadet-courses-table";
import {
  CoursesManagementTable,
  type CourseManagementRow,
} from "./courses-management-table";
import { EditCadetCourseDialog } from "./edit-cadet-course-dialog";
import { AddCourseDialog } from "./add-course-dialog";
import { EditCourseDialog } from "./edit-course-dialog";
import { DeleteCourseDialog } from "./delete-course-dialog";
import type { CourseOption } from "./table-config";
import type { IntakeOption, RawSearchParams } from "@/lib/admin/table-search-params";
import { BookOpenIcon, PlusIcon, UsersIcon } from "lucide-react";

type CoursesPageClientProps = {
  tab: string;
  searchParams: RawSearchParams;
  cadets: CadetCourseRow[];
  cadetsTotalCount: number;
  courses: CourseManagementRow[];
  coursesTotalCount: number;
  intakeOptions?: IntakeOption[];
  courseOptions?: CourseOption[];
  showIntakeColumn?: boolean;
};

export function CoursesPageClient({
  tab,
  searchParams,
  cadets,
  cadetsTotalCount,
  courses,
  coursesTotalCount,
  intakeOptions,
  courseOptions,
  showIntakeColumn = false,
}: CoursesPageClientProps) {
  const router = useRouter();
  const isMobile = useIsMobile();

  const inlineEnabled = !isMobile;

  const [editingCadetId, setEditingCadetId] = useState<number | null>(null);
  const [editCadetTarget, setEditCadetTarget] = useState<CadetCourseRow | null>(null);
  const [editingCourseId, setEditingCourseId] = useState<number | null>(null);
  const [editCourseTarget, setEditCourseTarget] = useState<CourseManagementRow | null>(null);
  const [deleteCourseTarget, setDeleteCourseTarget] = useState<CourseManagementRow | null>(null);
  const [pendingTab, setPendingTab] = useState<string | null>(null);

  const hasUnsavedEdit = editingCadetId !== null || editingCourseId !== null;

  const navigateToTab = useCallback(
    (value: string) => {
      const currentUrl = new URLSearchParams(window.location.search);
      const nextParams = new URLSearchParams();

      for (const [key, value_] of currentUrl) {
        nextParams.set(key, value_);
      }

      if (value === "cadets") {
        nextParams.delete("tab");
      } else {
        nextParams.set("tab", value);
      }

      const qs = nextParams.toString();
      router.push(`${window.location.pathname}${qs ? `?${qs}` : ""}`, {
        scroll: false,
      });
    },
    [router],
  );

  const handleTabChange = useCallback(
    (value: string) => {
      if (hasUnsavedEdit) {
        setPendingTab(value);
        return;
      }
      navigateToTab(value);
    },
    [hasUnsavedEdit, navigateToTab],
  );

  const handleDiscardAndSwitchTab = useCallback(() => {
    setEditingCadetId(null);
    setEditingCourseId(null);
    if (pendingTab !== null) navigateToTab(pendingTab);
    setPendingTab(null);
  }, [navigateToTab, pendingTab]);

  const courseOptionsForEdit = useMemo(
    () =>
      courses.map((course) => ({
        id: course.id,
        name: course.name,
        completionYear: course.completionYear,
        isSupported: course.isSupported,
      })),
    [courses],
  );

  const addCourseButton = (
    <AddCourseDialog
      trigger={
        <Button size="sm">
          <PlusIcon className="size-4" />
          Add Course
        </Button>
      }
    />
  );

  return (
    <>
      <Tabs defaultValue="cadets" value={tab} onValueChange={handleTabChange}>
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Courses</h1>
          {tab === "courses" && addCourseButton}
        </div>

        <TabsList className="mb-4">
          <TabsTrigger value="cadets">
            <UsersIcon className="mr-1.5 size-3.5" />
            Cadet Courses ({cadetsTotalCount})
          </TabsTrigger>
          <TabsTrigger value="courses">
            <BookOpenIcon className="mr-1.5 size-3.5" />
            Course Management ({coursesTotalCount})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="cadets">
          <CadetCoursesTable
            cadets={cadets}
            courses={courseOptionsForEdit}
            searchParams={searchParams}
            totalCount={cadetsTotalCount}
            intakeOptions={intakeOptions}
            courseOptions={courseOptions}
            showIntakeColumn={showIntakeColumn}
            editingCadetId={editingCadetId}
            inlineEnabled={inlineEnabled}
            onEditStartInline={setEditingCadetId}
            onEditRequest={setEditCadetTarget}
            onEditEnd={() => setEditingCadetId(null)}
          />
        </TabsContent>

        <TabsContent value="courses">
          <CoursesManagementTable
            courses={courses}
            searchParams={searchParams}
            totalCount={coursesTotalCount}
            editingCourseId={editingCourseId}
            inlineEnabled={inlineEnabled}
            onEditStartInline={setEditingCourseId}
            onEditRequest={setEditCourseTarget}
            onEditEnd={() => setEditingCourseId(null)}
            onDeleteRequest={setDeleteCourseTarget}
          />
        </TabsContent>
      </Tabs>

      <EditCadetCourseDialog
        key={`cadet-edit-${editCadetTarget?.id ?? "none"}`}
        cadet={editCadetTarget}
        courses={courseOptionsForEdit}
        open={Boolean(editCadetTarget)}
        onOpenChange={(open) => {
          if (!open) setEditCadetTarget(null);
        }}
      />

      <EditCourseDialog
        key={`course-edit-${editCourseTarget?.id ?? "none"}`}
        course={editCourseTarget}
        open={Boolean(editCourseTarget)}
        onOpenChange={(open) => {
          if (!open) setEditCourseTarget(null);
        }}
      />

      <DeleteCourseDialog
        key={`course-delete-${deleteCourseTarget?.id ?? "none"}`}
        course={deleteCourseTarget}
        open={Boolean(deleteCourseTarget)}
        onOpenChange={(open) => {
          if (!open) setDeleteCourseTarget(null);
        }}
      />

      <ConfirmDialog
        open={pendingTab !== null}
        onOpenChange={(open) => {
          if (!open) setPendingTab(null);
        }}
        title="Discard unsaved changes?"
        description="You have an unsaved edit. Switching tabs will discard it."
        confirmLabel="Discard"
        cancelLabel="Keep editing"
        destructive
        onConfirm={handleDiscardAndSwitchTab}
      />
    </>
  );
}

