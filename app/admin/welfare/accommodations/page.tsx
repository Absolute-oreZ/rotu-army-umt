import { Empty } from "@/components/ui/empty";
import { BedIcon } from "lucide-react";

export default function AccommodationsPage() {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold">Accommodations</h1>
      <Empty
        title="Accommodations"
        description="This module is under construction."
        icon={<BedIcon className="size-5 text-muted-foreground" />}
      />
    </div>
  );
}
