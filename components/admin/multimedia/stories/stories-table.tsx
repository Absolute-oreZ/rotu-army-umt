"use client";

import { useMemo } from "react";
import { EyeIcon, PencilIcon, Trash2Icon, CalendarIcon, GlobeIcon, EyeOffIcon, ArchiveIcon, ArchiveRestoreIcon } from "lucide-react";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { TableToolbar } from "@/components/admin/data-table/table-toolbar";
import { GlobalFilterBar } from "@/components/admin/data-table/global-filter-bar";
import { SortableHead } from "@/components/admin/data-table/sortable-head";
import { Pagination } from "@/components/admin/data-table/pagination";
import { CopyableValue } from "@/components/admin/data-table/copyable-value";
import { useTableURL } from "@/lib/admin/use-table-url";
import { isTableStateDefault, type RawSearchParams } from "@/lib/admin/table-search-params";
import { Empty } from "@/components/ui/empty";
import { format } from "date-fns";
import {
  buildStoriesTableConfig,
  formatStatus,
} from "@/components/admin/multimedia/stories/table-config";

export type StoryRow = {
  id: number;
  name: string;
  slug: string;
  startDate: string;
  endDate: string;
  location: string;
  status: string;
  coverPhotoPath: string | null;
  createdAt: string;
};

type StoriesTableProps = {
  stories: StoryRow[];
  searchParams: RawSearchParams;
  totalCount: number;
  onView: (story: StoryRow) => void;
  onEdit: (story: StoryRow) => void;
  onDelete: (story: StoryRow) => void;
  onStatusChange: (story: StoryRow, status: "DRAFT" | "PUBLISHED" | "ARCHIVED") => void;
  isPending: boolean;
};

export function StoriesTable({
  stories,
  searchParams,
  totalCount,
  onView,
  onEdit,
  onDelete,
  onStatusChange,
  isPending,
}: StoriesTableProps) {
  const config = useMemo(() => buildStoriesTableConfig(), []);

  const { state, update, reset, totalPages } = useTableURL({
    searchParams,
    config,
    totalCount,
  });

  const isDefault = isTableStateDefault(state, config);

  return (
    <>
      <TableToolbar
        showRefreshButton
        searchPlaceholder="Search by title or location…"
        totalCount={totalCount}
        shownCount={stories.length}
        state={state}
        onChange={update}
        onReset={reset}
        isDefault={isDefault}
      />

      <div className="mb-4">
        <GlobalFilterBar
          filters={state.filters}
          sortRules={state.sortRules}
          filterColumns={config.filterColumns}
          sortKeys={config.sortKeys}
          sortLabels={config.sortLabels}
          onFilterUpdate={(filters) => update({ filters, page: 1 })}
          onSortUpdate={(sortRules) => update({ sortRules })}
        />
      </div>

      {stories.length === 0 ? (
        <Empty
          title="No results"
          description={
            isDefault
              ? "No stories found. Create one to get started."
              : "No stories match the current filters. Try clearing some."
          }
          icon={<CalendarIcon className="size-5 text-muted-foreground" />}
          action={
            !isDefault ? (
              <Button variant="outline" size="sm" onClick={reset}>
                Reset filters
              </Button>
            ) : undefined
          }
        />
      ) : (
        <>
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <SortableHead columnKey="name" label="Title" state={state} onChange={update} />
                  <SortableHead columnKey="startDate" label="Start Date" state={state} onChange={update} />
                  <SortableHead columnKey="location" label="Location" state={state} onChange={update} />
                  <SortableHead columnKey="status" label="Status" state={state} onChange={update} />
                  <TableHead className="pr-5 text-right w-24">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stories.map((story) => (
                  <TableRow key={story.id}>
                    <TableCell className="font-medium">
                      <CopyableValue value={story.name} valueClassName="font-medium">
                        {story.name}
                      </CopyableValue>
                    </TableCell>
                    <TableCell className="font-mono tabular-nums whitespace-nowrap">
                      <CopyableValue value={story.startDate} valueClassName="font-mono tabular-nums">
                        {format(new Date(story.startDate), "dd MMM yyyy")}
                      </CopyableValue>
                    </TableCell>
                    <TableCell>
                      <CopyableValue value={story.location} valueClassName="text-sm">
                        {story.location}
                      </CopyableValue>
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          story.status === "PUBLISHED"
                            ? "bg-emerald-100 text-emerald-800"
                            : story.status === "DRAFT"
                            ? "bg-gray-100 text-gray-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {formatStatus(story.status)}
                      </span>
                    </TableCell>
                    <TableCell className="pr-5">
                      <div className="flex items-center justify-end gap-0.5">
                        {story.status === "PUBLISHED" && (
                          <Tooltip>
                            <TooltipTrigger>
                              <Button variant="ghost" size="icon-xs" className="hover:text-purple-600" onClick={() => onStatusChange(story, "DRAFT")} disabled={isPending}>
                                <EyeOffIcon className="size-3.5" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent side="top">Unpublish to Draft</TooltipContent>
                          </Tooltip>
                        )}
                        {story.status === "DRAFT" && (
                          <Tooltip>
                            <TooltipTrigger>
                              <Button variant="ghost" size="icon-xs" className="hover:text-emerald-600" onClick={() => onStatusChange(story, "PUBLISHED")} disabled={isPending}>
                                <GlobeIcon className="size-3.5" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent side="top">Publish</TooltipContent>
                          </Tooltip>
                        )}
                        {story.status !== "ARCHIVED" && (
                          <Tooltip>
                            <TooltipTrigger>
                              <Button variant="ghost" size="icon-xs" className="hover:text-amber-600" onClick={() => onStatusChange(story, "ARCHIVED")} disabled={isPending}>
                                <ArchiveIcon className="size-3.5" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent side="top">Archive</TooltipContent>
                          </Tooltip>
                        )}
                        {story.status === "ARCHIVED" && (
                          <Tooltip>
                            <TooltipTrigger>
                              <Button variant="ghost" size="icon-xs" className="hover:text-emerald-600" onClick={() => onStatusChange(story, "PUBLISHED")} disabled={isPending}>
                                <ArchiveRestoreIcon className="size-3.5" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent side="top">Restore to Published</TooltipContent>
                          </Tooltip>
                        )}
                        <Tooltip>
                          <TooltipTrigger>
                            <Button
                              variant="ghost"
                              size="icon-xs"
                              className="hover:text-emerald-600"
                              onClick={() => onView(story)}
                            >
                              <EyeIcon className="size-3.5" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="top">View Details</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger>
                            <Button
                              variant="ghost"
                              size="icon-xs"
                              className="hover:text-sky-600"
                              onClick={() => onEdit(story)}
                            >
                              <PencilIcon className="size-3.5" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="top">Edit</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger>
                            <Button
                              variant="ghost"
                              size="icon-xs"
                              className="hover:text-destructive"
                              onClick={() => onDelete(story)}
                            >
                              <Trash2Icon className="size-3.5" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="top">Delete</TooltipContent>
                        </Tooltip>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="flex flex-col gap-3 md:hidden">
            {stories.map((story) => (
              <div
                key={story.id}
                className="rounded-lg border border-border p-4"
              >
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-medium">{story.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {formatStatus(story.status)} · {story.location}
                    </p>
                  </div>
                </div>
                <div className="mt-2 text-xs text-muted-foreground">
                  <p>Start: {format(new Date(story.startDate), "dd MMM yyyy")}</p>
                  <p>End: {format(new Date(story.endDate), "dd MMM yyyy")}</p>
                  <p>Created: {format(new Date(story.createdAt), "dd MMM yyyy")}</p>
                </div>
                <div className="mt-3 flex justify-end gap-0.5">
                  {story.status === "PUBLISHED" && (
                    <Tooltip><TooltipTrigger><Button variant="ghost" size="icon-xs" className="hover:text-purple-600" onClick={() => onStatusChange(story, "DRAFT")} disabled={isPending}><EyeOffIcon className="size-3.5" /></Button></TooltipTrigger><TooltipContent side="top">Unpublish to Draft</TooltipContent></Tooltip>
                  )}
                  {story.status === "DRAFT" && (
                    <Tooltip><TooltipTrigger><Button variant="ghost" size="icon-xs" className="hover:text-emerald-600" onClick={() => onStatusChange(story, "PUBLISHED")} disabled={isPending}><GlobeIcon className="size-3.5" /></Button></TooltipTrigger><TooltipContent side="top">Publish</TooltipContent></Tooltip>
                  )}
                  {story.status !== "ARCHIVED" && (
                    <Tooltip><TooltipTrigger><Button variant="ghost" size="icon-xs" className="hover:text-amber-600" onClick={() => onStatusChange(story, "ARCHIVED")} disabled={isPending}><ArchiveIcon className="size-3.5" /></Button></TooltipTrigger><TooltipContent side="top">Archive</TooltipContent></Tooltip>
                  )}
                  {story.status === "ARCHIVED" && (
                    <Tooltip><TooltipTrigger><Button variant="ghost" size="icon-xs" className="hover:text-emerald-600" onClick={() => onStatusChange(story, "PUBLISHED")} disabled={isPending}><ArchiveRestoreIcon className="size-3.5" /></Button></TooltipTrigger><TooltipContent side="top">Restore to Published</TooltipContent></Tooltip>
                  )}
                  <Tooltip>
                    <TooltipTrigger>
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        className="hover:text-emerald-600"
                        onClick={() => onView(story)}
                      >
                        <EyeIcon className="size-3.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="top">View Details</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger>
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        className="hover:text-sky-600"
                        onClick={() => onEdit(story)}
                      >
                        <PencilIcon className="size-3.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="top">Edit</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger>
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        className="hover:text-destructive"
                        onClick={() => onDelete(story)}
                      >
                        <Trash2Icon className="size-3.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="top">Delete</TooltipContent>
                  </Tooltip>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <Pagination
        state={state}
        totalPages={totalPages}
        totalCount={totalCount}
        pageSizeOptions={config.pageSizeOptions}
        onChange={update}
      />
    </>
  );
}
