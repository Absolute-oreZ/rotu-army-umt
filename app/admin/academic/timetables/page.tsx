import { Empty } from "@/components/ui/empty";
import { CalendarIcon } from "lucide-react";

export default function TimetablesPage() {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold">Timetables</h1>
      <Empty
        title="Timetables"
        description="This module is under construction."
        icon={<CalendarIcon className="size-5 text-muted-foreground" />}
      />
    </div>
  );
}
