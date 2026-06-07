import { Empty } from "@/components/ui/empty";
import { HeartIcon } from "lucide-react";

export default function HealthPage() {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold">Health</h1>
      <Empty
        title="Health"
        description="This module is under construction."
        icon={<HeartIcon className="size-5 text-muted-foreground" />}
      />
    </div>
  );
}
