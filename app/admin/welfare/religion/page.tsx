import { Empty } from "@/components/ui/empty";
import { ChurchIcon } from "lucide-react";

export default function ReligionPage() {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold">Religion</h1>
      <Empty
        title="Religion"
        description="This module is under construction."
        icon={<ChurchIcon className="size-5 text-muted-foreground" />}
      />
    </div>
  );
}
