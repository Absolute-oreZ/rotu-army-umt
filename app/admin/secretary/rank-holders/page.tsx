import { Empty } from "@/components/ui/empty";
import { AwardIcon } from "lucide-react";

export default function RankHoldersPage() {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold">Rank Holders</h1>
      <Empty
        title="Rank Holders"
        description="This module is under construction."
        icon={<AwardIcon className="size-5 text-muted-foreground" />}
      />
    </div>
  );
}
