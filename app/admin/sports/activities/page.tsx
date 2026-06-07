import { Empty } from "@/components/ui/empty";
import { DumbbellIcon } from "lucide-react";

export default function ActivitiesPage() {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold">Activities</h1>
      <Empty
        title="Activities"
        description="This module is under construction."
        icon={<DumbbellIcon className="size-5 text-muted-foreground" />}
      />
    </div>
  );
}
