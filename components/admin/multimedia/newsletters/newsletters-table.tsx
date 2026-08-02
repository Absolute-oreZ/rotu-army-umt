"use client";

import { useMemo } from "react";
import { EyeIcon, PencilIcon, Trash2Icon, SendIcon, CalendarIcon } from "lucide-react";
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
  buildNewslettersTableConfig,
  campaignStatusClass,
  formatCampaignStatus,
} from "@/components/admin/multimedia/newsletters/table-config";

export type CampaignRow = {
  id: number;
  subject: string;
  previewText: string | null;
  contentHtml: string;
  contentText: string | null;
  status: "DRAFT" | "SENT" | "SCHEDULED" | "SENDING" | "FAILED";
  scheduledAt: string | null;
  sentAt: string | null;
  recipientCount: number;
  sentByAdminUserId: string | null;
  createdAt: string;
  updatedAt: string;
  attachments?: Array<{ id: number; fileName: string; fileSize: number; contentType: string }>;
  translations?: Array<{ locale: string; subject: string; previewText: string | null; contentHtml: string; contentText: string | null }>;
};

export type SubscriberRow = {
  id: string;
  email: string;
  preferredLocale: string;
  status: "PENDING" | "ACTIVE" | "UNSUBSCRIBED";
  confirmedAt: string | null;
  unsubscribedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

type NewslettersTableProps = {
  campaigns: CampaignRow[];
  searchParams: RawSearchParams;
  totalCount: number;
  onView: (campaign: CampaignRow) => void;
  onEdit: (campaign: CampaignRow) => void;
  onDelete: (campaign: CampaignRow) => void;
  onSend: (campaign: CampaignRow) => void;
};

export function NewslettersTable({
  campaigns,
  searchParams,
  totalCount,
  onView,
  onEdit,
  onDelete,
  onSend,
}: NewslettersTableProps) {
  const config = useMemo(() => buildNewslettersTableConfig(), []);

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
        searchPlaceholder="Search by subject or content…"
        totalCount={totalCount}
        shownCount={campaigns.length}
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

      {campaigns.length === 0 ? (
        <Empty
          title="No results"
          description={
            isDefault
              ? "No campaigns found. Create one to get started."
              : "No campaigns match the current filters. Try clearing some."
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
                  <SortableHead columnKey="subject" label="Subject" state={state} onChange={update} />
                  <SortableHead columnKey="status" label="Status" state={state} onChange={update} />
                  <SortableHead columnKey="scheduledAt" label="Scheduled" state={state} onChange={update} />
                  <SortableHead columnKey="sentAt" label="Sent" state={state} onChange={update} />
                  <SortableHead columnKey="createdAt" label="Created" state={state} onChange={update} />
                  <TableHead className="pr-5 text-right w-32">Recipients</TableHead>
                  <TableHead className="pr-5 text-right w-40">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {campaigns.map((campaign) => (
                  <TableRow key={campaign.id}>
                    <TableCell className="font-medium">
                      <CopyableValue value={campaign.subject} valueClassName="font-medium">
                        {campaign.subject}
                      </CopyableValue>
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${campaignStatusClass(campaign.status)}`}
                      >
                        {formatCampaignStatus(campaign.status)}
                      </span>
                    </TableCell>
                    <TableCell className="font-mono tabular-nums whitespace-nowrap">
                      <CopyableValue value={campaign.scheduledAt ?? ""} valueClassName="font-mono tabular-nums">
                        {campaign.scheduledAt ? format(new Date(campaign.scheduledAt), "dd MMM yyyy HH:mm") : "—"}
                      </CopyableValue>
                    </TableCell>
                    <TableCell className="font-mono tabular-nums whitespace-nowrap">
                      <CopyableValue value={campaign.sentAt ?? ""} valueClassName="font-mono tabular-nums">
                        {campaign.sentAt ? format(new Date(campaign.sentAt), "dd MMM yyyy HH:mm") : "—"}
                      </CopyableValue>
                    </TableCell>
                    <TableCell className="font-mono tabular-nums whitespace-nowrap">
                      <CopyableValue value={campaign.createdAt} valueClassName="font-mono tabular-nums">
                        {format(new Date(campaign.createdAt), "dd MMM yyyy")}
                      </CopyableValue>
                    </TableCell>
                    <TableCell className="pr-5 tabular-nums text-right">{campaign.recipientCount}</TableCell>
                    <TableCell className="pr-5">
                      <div className="flex items-center justify-end gap-0.5">
                        <Tooltip>
                          <TooltipTrigger>
                            <Button
                              variant="ghost"
                              size="icon-xs"
                              className="hover:text-sky-600"
                              onClick={() => onView(campaign)}
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
                              onClick={() => onEdit(campaign)}
                            >
                              <PencilIcon className="size-3.5" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="top">Edit</TooltipContent>
                        </Tooltip>
                        {campaign.status === "DRAFT" && (
                          <>
                            <Tooltip>
                              <TooltipTrigger>
                                <Button
                                  variant="ghost"
                                  size="icon-xs"
                                  className="hover:text-emerald-600"
                                  onClick={() => onSend(campaign)}
                                >
                                  <SendIcon className="size-3.5" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent side="top">Send Now</TooltipContent>
                            </Tooltip>
                          </>
                        )}
                        {campaign.status === "FAILED" && (
                          <Tooltip>
                            <TooltipTrigger>
                              <Button
                                variant="ghost"
                                size="icon-xs"
                                className="hover:text-sky-600"
                                onClick={() => onSend(campaign)}
                              >
                                <SendIcon className="size-3.5" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent side="top">Retry failed deliveries</TooltipContent>
                          </Tooltip>
                        )}
                        <Tooltip>
                          <TooltipTrigger>
                            <Button
                              variant="ghost"
                              size="icon-xs"
                              className="hover:text-destructive"
                              onClick={() => onDelete(campaign)}
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
            {campaigns.map((campaign) => (
              <div
                key={campaign.id}
                className="rounded-lg border border-border p-4"
              >
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-medium">{campaign.subject}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {formatCampaignStatus(campaign.status)} · {campaign.recipientCount} recipients
                    </p>
                  </div>
                </div>
                <div className="mt-2 text-xs text-muted-foreground">
                  <p>Scheduled: {campaign.scheduledAt ? format(new Date(campaign.scheduledAt), "dd MMM yyyy HH:mm") : "—"}</p>
                  <p>Sent: {campaign.sentAt ? format(new Date(campaign.sentAt), "dd MMM yyyy HH:mm") : "—"}</p>
                  <p>Created: {format(new Date(campaign.createdAt), "dd MMM yyyy")}</p>
                </div>
                <div className="mt-3 flex justify-end gap-0.5">
                  <Tooltip>
                    <TooltipTrigger>
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        className="hover:text-sky-600"
                        onClick={() => onView(campaign)}
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
                        onClick={() => onEdit(campaign)}
                      >
                        <PencilIcon className="size-3.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="top">Edit</TooltipContent>
                  </Tooltip>
                  {campaign.status === "DRAFT" && (
                    <>
                      <Tooltip>
                        <TooltipTrigger>
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            className="hover:text-emerald-600"
                            onClick={() => onSend(campaign)}
                          >
                            <SendIcon className="size-3.5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="top">Send Now</TooltipContent>
                      </Tooltip>
                    </>
                  )}
                  {campaign.status === "FAILED" && (
                    <Tooltip>
                      <TooltipTrigger>
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          className="hover:text-sky-600"
                          onClick={() => onSend(campaign)}
                        >
                          <SendIcon className="size-3.5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="top">Retry failed deliveries</TooltipContent>
                    </Tooltip>
                  )}
                  <Tooltip>
                    <TooltipTrigger>
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        className="hover:text-destructive"
                        onClick={() => onDelete(campaign)}
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
