import { Empty } from "@/components/ui/empty";
import { GraduationCapIcon } from "lucide-react";

export default function ResultsPage() {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold">Results</h1>
      <Empty
        title="Results"
        description="This module is under construction."
        icon={<GraduationCapIcon className="size-5 text-muted-foreground" />}
      />
    </div>
  );
}
